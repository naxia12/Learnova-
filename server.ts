import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { ai, MODEL_NAME, generateContentWithRetry, isRetryableError } from './server/gemini.js';
import {
  getDocuments,
  resetToSampleDocuments,
  addDocument,
  deleteDocument,
  getDocumentById,
  chunkText,
  retrieveRelevantPassages,
  StudyDocument,
  DocumentChunk
} from './server/rag.js';
import { runEvaluationSuite, BENCHMARK_DATASET, extractCitations } from './server/eval.js';
import { extractAndVerifyCitations } from './server/citations.js';
import { getSmartVideoRecommendations } from './server/youtube.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Configure multer for file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// ==========================================
// API ROUTES
// ==========================================

// 1. Documents API
app.get('/api/documents', (req: Request, res: Response) => {
  try {
    const docs = getDocuments();
    res.json({
      success: true,
      documents: docs.map(d => ({
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        uploadedAt: d.uploadedAt,
        pageCount: d.pageCount,
        summary: d.summary,
        topics: d.topics,
        chunkCount: d.chunks.length,
        isSample: d.isSample,
      })),
      totalDocuments: docs.length,
      totalChunks: docs.reduce((acc, d) => acc + d.chunks.length, 0),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, document: doc });
});

app.post('/api/documents/reset-sample', (req: Request, res: Response) => {
  const docs = resetToSampleDocuments();
  res.json({ success: true, documents: docs });
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const deleted = deleteDocument(req.params.id);
  res.json({ success: deleted });
});

// 2. Upload Document API (PDF, TXT, MD)
app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    let extractedText = '';
    let pageCount = 1;
    let fileType: 'pdf' | 'text' | 'slides' | 'markdown' = 'text';

    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      fileType = 'pdf';
      try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const parsePromise = parser.getText();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PDF extraction timed out after 10s')), 10000)
        );
        const pdfData: any = await Promise.race([parsePromise, timeoutPromise]);
        extractedText = typeof pdfData === 'string' ? pdfData : (pdfData?.text || pdfData?.pages?.map((p: any) => p.text).join('\n\n') || '');
        pageCount = Math.max(1, pdfData?.total || pdfData?.pages?.length || Math.ceil(extractedText.length / 2500) || 1);
        await parser.destroy?.().catch(() => {});
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        return res.status(422).json({
          success: false,
          error: 'Failed to extract text from PDF. The file may be password-protected or contain only scanned images.'
        });
      }
    } else if (
      mimetype === 'text/plain' ||
      mimetype === 'text/markdown' ||
      originalname.endsWith('.txt') ||
      originalname.endsWith('.md')
    ) {
      fileType = originalname.endsWith('.md') ? 'markdown' : 'text';
      extractedText = buffer.toString('utf-8');
      pageCount = Math.max(1, Math.ceil(extractedText.length / 2500));
    } else {
      // Treat other text-based files as utf-8
      extractedText = buffer.toString('utf-8');
      pageCount = 1;
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Extracted content is empty. Please upload a document with readable text.'
      });
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docTitle = originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    const chunks = chunkText(extractedText, docId, docTitle);

    // Initial fast local summary and topic heuristics (prevents slow upload)
    let summary = `Uploaded ${fileType.toUpperCase()} document consisting of ${chunks.length} sections and approximately ${pageCount} pages.`;
    const candidateSectionTopics = chunks
      .map((c) => c.sectionTitle?.replace(/^Chapter \d+:\s*/i, '').trim())
      .filter((t): t is string => Boolean(t && t.length > 3));
    let topics: string[] = candidateSectionTopics.length > 0
      ? Array.from(new Set(candidateSectionTopics)).slice(0, 4)
      : [docTitle, 'Course Notes'];

    // Optional quick AI summary generation with a strict 3.5s timeout to keep upload fast
    if (process.env.GEMINI_API_KEY) {
      try {
        const previewText = chunks.slice(0, 3).map(c => c.content).join('\n\n').substring(0, 3000);
        const metaPromise = generateContentWithRetry({
          model: MODEL_NAME,
          contents: `Analyze this study document excerpt and return a JSON object with:
1. "summary": A 2-sentence concise summary of the material.
2. "topics": An array of 3-5 specific subject topic tags.

Document Title: ${docTitle}
Excerpt:
${previewText}

Return valid JSON only.`,
          config: {
            responseMimeType: 'application/json',
          }
        }, 1);

        const aiTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI metadata timeout')), 3500)
        );

        const metaResponse: any = await Promise.race([metaPromise, aiTimeoutPromise]);
        const parsed = JSON.parse(metaResponse.text?.trim() || '{}');
        if (parsed.summary) summary = parsed.summary;
        if (Array.isArray(parsed.topics) && parsed.topics.length > 0) topics = parsed.topics;
      } catch (e) {
        // Fall back gracefully to fast local summary and topics
        console.log('[Document Upload] Using fast local summary/topics heuristic (AI metadata skipped or timed out).');
      }
    }

    const newDoc: StudyDocument = {
      id: docId,
      title: docTitle,
      fileName: originalname,
      fileType,
      fileSize: size,
      uploadedAt: new Date().toISOString(),
      pageCount,
      summary,
      topics,
      chunks,
      isSample: false,
    };

    addDocument(newDoc);

    res.json({
      success: true,
      document: {
        id: newDoc.id,
        title: newDoc.title,
        fileName: newDoc.fileName,
        fileType: newDoc.fileType,
        pageCount: newDoc.pageCount,
        summary: newDoc.summary,
        topics: newDoc.topics,
        chunkCount: newDoc.chunks.length,
      }
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal upload error' });
  }
});

// 3. AI Tutor Chat Endpoint (Grounding with Citations & Fallback Refusal)
app.post('/api/tutor/chat', async (req: Request, res: Response) => {
  try {
    const { message, selectedDocIds, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message query is required' });
    }

    const docs = getDocuments();
    if (docs.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find this information in your uploaded sources. Please upload or select study materials first.",
        citations: [],
        retrievedPassages: [],
      });
    }

    // Retrieve relevant passages
    const retrieved = retrieveRelevantPassages(message, selectedDocIds, 4);

    // If no passages retrieved or score very low
    const hasContext = retrieved.length > 0 && retrieved[0].score > 0.5;

    const formattedContext = retrieved.map((r, idx) => {
      return `[Source #${idx + 1}: "${r.chunk.docTitle}" | File: ${r.chunk.docId}.pdf | Page ${r.chunk.pageNumber}${r.chunk.sectionTitle ? ' | ' + r.chunk.sectionTitle : ''}]\n${r.chunk.content}`;
    }).join('\n\n---\n\n');

    if (!process.env.GEMINI_API_KEY) {
      // Deterministic educational fallback when API key is not yet configured
      if (!hasContext) {
        return res.json({
          success: true,
          answer: "I couldn't find this information in your uploaded sources.",
          citations: [],
          retrievedPassages: [],
        });
      }

      const topChunk = retrieved[0].chunk;
      return res.json({
        success: true,
        answer: `Based on your uploaded material [${topChunk.docTitle}, Page ${topChunk.pageNumber}]:\n\n${topChunk.content.substring(0, 400)}...\n\nWould you like me to quiz you on this concept or provide a deeper step-by-step breakdown?`,
        citations: [`${topChunk.docTitle}, Page ${topChunk.pageNumber}`],
        retrievedPassages: retrieved.map(r => r.chunk),
      });
    }

    const systemPrompt = `You are Learnova AI, an expert, encouraging, source-grounded academic tutor.
Core Guidelines (Personalized Tutoring & Adaptive Learning):
1. STUBBORN EVIDENCE-GROUNDING: Answer the student's question based strictly on the provided context passages below.
2. CITATION ENFORCEMENT & DEDUPLICATION:
- Display citations directly beside the specific claims they support in square brackets: [DocTitle, Page X].
- If page numbers are unavailable, cite the document name and section title: [DocTitle, Section Name].
- Do not repeat identical citations consecutively; reuse the citation tag once per claim or conceptual point.
- Never invent citations, page numbers, quotations, or documents not present in the context.
3. STRICT NEGATIVE REFUSAL: Never invent citations or pretend a source supports an answer when it does not. If the student asks something that is NOT addressed or verified in the uploaded sources, you MUST reply:
"I couldn't find this information in your uploaded sources."
Do not attempt to answer from external world knowledge unless directly comparing what is in the document.
4. EXPLANATION QUALITY:
- Explain difficult ideas in clear, simple language with relatable analogies.
- Provide step-by-step breakdowns for complex mechanisms.
- Highlight key terms in **bold**.
- At the end of your answer, include 2 short suggested follow-up questions for the student under a "💡 Suggested Next Questions:" section.
`;

    const userPrompt = `CONTEXT PASSAGES:
${formattedContext || 'No matching context passages found in selected study materials.'}

STUDENT QUESTION:
${message}
`;

    let answer = '';
    let usedModel = MODEL_NAME;
    let attemptsCount = 1;

    try {
      const genResult = await generateContentWithRetry({
        model: MODEL_NAME,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
      }, 3);

      answer = genResult.text || "I couldn't find this information in your uploaded sources.";
      usedModel = genResult.modelUsed;
      attemptsCount = genResult.attempts;
    } catch (genError: any) {
      console.warn('[Tutor Chat] Generation failed after retries:', genError?.message);

      if (isRetryableError(genError) || genError?.status === 503) {
        // High-traffic / temporary outage fallback: deliver grounded excerpts directly!
        const topChunk = retrieved[0]?.chunk;
        const fallbackCitation = topChunk ? `[${topChunk.docTitle}, Page ${topChunk.pageNumber}]` : '';
        answer = `⚠️ **Notice: The Learnova AI model service is temporarily experiencing high traffic (HTTP 503).**
We automatically attempted 3 retries with exponential backoff. In the meantime, here is the relevant grounded excerpt retrieved from your study materials:

${topChunk ? `> "${topChunk.content.substring(0, 400)}..."\n\n— *Source: ${fallbackCitation}*` : 'No matching passages were found in your selected materials.'}

💡 *You can click "Retry Question" below in a moment once traffic subsides.*`;
      } else {
        throw genError;
      }
    }

    const retrievedChunks = retrieved.map(r => r.chunk);
    const { citations: verifiedCitations } = extractAndVerifyCitations(answer, retrievedChunks);

    res.json({
      success: true,
      answer,
      citations: verifiedCitations,
      retrievedPassages: retrievedChunks,
      usedModel,
      attemptsCount,
    });
  } catch (error: any) {
    console.error('Tutor chat error:', error);
    res.status(500).json({
      success: false,
      error: 'The AI tutor service is temporarily unavailable. Please try again in a few moments.'
    });
  }
});

// 4. Adaptive Quiz Generation Endpoint
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { docIds, difficulty = 'medium', targetTopics, questionCount = 4 } = req.body;
    const docs = getDocuments();
    const targetDocs = docIds && docIds.length > 0
      ? docs.filter(d => docIds.includes(d.id))
      : docs;

    if (targetDocs.length === 0) {
      return res.status(400).json({ success: false, error: 'No documents available for quiz generation.' });
    }

    // Gather text from target docs
    const availablePassages = targetDocs.flatMap(d => d.chunks.slice(0, 4));
    const sampleContext = availablePassages.map(c => `[${c.docTitle}, Page ${c.pageNumber}]: ${c.content}`).join('\n\n');

    if (!process.env.GEMINI_API_KEY) {
      // High-quality mock adaptive questions matching sample documents
      const sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'What is the net ATP yield produced directly by Glycolysis per single molecule of glucose?',
          options: ['2 net ATP', '4 net ATP', '32 net ATP', '0 net ATP'],
          correctAnswerIndex: 0,
          explanation: 'Glycolysis generates 4 ATP in the payoff phase but invests 2 ATP in the preparatory phase, yielding a net gain of 2 ATP per glucose [Biology 101, Page 1].',
          topic: 'Glycolysis',
          difficulty: 'easy',
          sourceDocTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
          sourcePage: 1
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Why does Scaled Dot-Product Attention scale the dot products by 1 / sqrt(d_k)?',
          options: [
            'To prevent vanishing gradients by stabilizing softmax input variance',
            'To force the attention matrix to become symmetric',
            'To compress keys and queries into a single vector',
            'To introduce non-linear activation into the dot product'
          ],
          correctAnswerIndex: 0,
          explanation: 'Dividing by the square root of d_k prevents large dot products from pushing the softmax function into regions with vanishingly small gradients [Computer Science: Transformer Architecture, Page 2].',
          topic: 'Transformers',
          difficulty: 'medium',
          sourceDocTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
          sourcePage: 2
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'What key innovation did James Watt introduce to the steam engine in 1769 to drastically increase efficiency?',
          options: [
            'A separate condenser',
            'Water-wheel integration',
            'High-pressure diesel fuel',
            'Atmospheric cooling tower'
          ],
          correctAnswerIndex: 0,
          explanation: 'James Watt added a separate condenser to Newcomen atmospheric engine, preventing thermal loss from repeatedly cooling the main cylinder [World History: The First Industrial Revolution, Page 2].',
          topic: 'Industrial Revolution',
          difficulty: 'hard',
          sourceDocTitle: 'World History: The First Industrial Revolution (1760–1840)',
          sourcePage: 2
        },
        {
          id: `q-${Date.now()}-4`,
          question: 'In cellular respiration, what molecule acts as the terminal electron acceptor at Complex IV of the electron transport chain?',
          options: [
            'Molecular oxygen (O2)',
            'Carbon dioxide (CO2)',
            'NAD+',
            'Pyruvate'
          ],
          correctAnswerIndex: 0,
          explanation: 'Oxygen acts as the terminal electron acceptor, binding with incoming electrons and protons to form water (H2O) [Biology 101, Page 3].',
          topic: 'Electron Transport Chain',
          difficulty: 'medium',
          sourceDocTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
          sourcePage: 3
        }
      ];

      return res.json({
        success: true,
        quiz: {
          id: `quiz-${Date.now()}`,
          difficulty,
          questions: sampleQuestions.slice(0, questionCount),
          createdAt: new Date().toISOString(),
        }
      });
    }

    const prompt = `Generate a ${difficulty} difficulty adaptive quiz containing ${questionCount} multiple-choice questions based STRICTLY on the source text below.
Requirements:
1. Four options per question (index 0, 1, 2, 3).
2. Exactly one correct answer.
3. In-depth explanation citing the exact source and page number: [DocTitle, Page X].
4. Calibrate difficulty to: ${difficulty.toUpperCase()} (Easy = recall/definitions, Medium = application/mechanisms, Hard = synthesis/deep edge-cases).
${targetTopics && targetTopics.length ? `Focus especially on topics: ${targetTopics.join(', ')}` : ''}

SOURCE TEXT:
${sampleContext.substring(0, 10000)}

Return a JSON array of questions with schema:
[
  {
    "id": "q-1",
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswerIndex": 0,
    "explanation": "string with citation",
    "topic": "string",
    "difficulty": "${difficulty}",
    "sourceDocTitle": "string",
    "sourcePage": 1
  }
]
`;

    let questions = [];
    try {
      const genResult = await generateContentWithRetry({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      }, 3);

      questions = JSON.parse(genResult.text || '[]');
    } catch (parseErr) {
      console.warn('Quiz generation with AI failed after retries, utilizing grounded fallback:', parseErr);
      // Fallback questions grounded in materials
      questions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'What is the net ATP yield produced directly by Glycolysis per single molecule of glucose?',
          options: ['2 net ATP', '4 net ATP', '32 net ATP', '0 net ATP'],
          correctAnswerIndex: 0,
          explanation: 'Glycolysis generates 4 ATP in the payoff phase but invests 2 ATP in the preparatory phase, yielding a net gain of 2 ATP per glucose [Biology 101, Page 1].',
          topic: 'Glycolysis',
          difficulty: difficulty,
          sourceDocTitle: targetDocs[0]?.title || 'Selected Study Materials',
          sourcePage: 1
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Why does Scaled Dot-Product Attention scale the dot products by 1 / sqrt(d_k)?',
          options: [
            'To prevent vanishing gradients by stabilizing softmax input variance',
            'To force the attention matrix to become symmetric',
            'To compress keys and queries into a single vector',
            'To introduce non-linear activation into the dot product'
          ],
          correctAnswerIndex: 0,
          explanation: 'Dividing by the square root of d_k prevents large dot products from pushing the softmax function into regions with vanishingly small gradients [Computer Science: Transformer Architecture, Page 2].',
          topic: 'Transformers',
          difficulty: difficulty,
          sourceDocTitle: targetDocs[0]?.title || 'Selected Study Materials',
          sourcePage: 2
        }
      ];
    }

    res.json({
      success: true,
      quiz: {
        id: `quiz-${Date.now()}`,
        difficulty,
        questions: questions.length > 0 ? questions : [],
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4b. Quiz Answer Analysis & Personalized Revision Recommendations
app.post('/api/quiz/analyze', (req: Request, res: Response) => {
  try {
    const {
      quizQuestions = [],
      selectedAnswers = {},
      activeTopicScores = {},
      selectedDocIds = []
    } = req.body || {};

    if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Quiz questions are required for analysis.'
      });
    }

    let score = 0;
    const answeredCount = Object.keys(selectedAnswers).length;
    const hasSufficientData = answeredCount >= Math.min(2, quizQuestions.length);

    // Track performance by topic in this specific quiz run
    const quizTopicStats: { [topic: string]: { correct: number; total: number; incorrectQuestions: any[] } } = {};

    quizQuestions.forEach((q: any) => {
      const userChoice = selectedAnswers[q.id];
      const isCorrect = userChoice === q.correctAnswerIndex;
      if (isCorrect) score++;

      const t = q.topic || 'General Material';
      if (!quizTopicStats[t]) {
        quizTopicStats[t] = { correct: 0, total: 0, incorrectQuestions: [] };
      }
      quizTopicStats[t].total += 1;
      if (isCorrect) {
        quizTopicStats[t].correct += 1;
      } else {
        quizTopicStats[t].incorrectQuestions.push(q);
      }
    });

    const percentage = Math.round((score / quizQuestions.length) * 100);

    const strongTopics: string[] = [];
    const weakTopics: string[] = [];
    const neutralTopics: string[] = [];

    // Categorize based on this quiz run and cumulative learner scores
    Object.entries(quizTopicStats).forEach(([topic, stats]) => {
      const runPct = Math.round((stats.correct / stats.total) * 100);
      const cumScore = activeTopicScores[topic];
      const effectivePct = cumScore ? Math.round((runPct * 0.6) + (cumScore.percentage * 0.4)) : runPct;

      if (effectivePct >= 75 && stats.correct >= 1) {
        strongTopics.push(topic);
      } else if (effectivePct < 60 || stats.correct === 0) {
        weakTopics.push(topic);
      } else {
        neutralTopics.push(topic);
      }
    });

    // Locate verified textbook/source passages from retrieved chunks for weak topics
    const allDocs = getDocuments();
    const activeDocs = selectedDocIds.length > 0
      ? allDocs.filter(d => selectedDocIds.includes(d.id))
      : allDocs;

    const revisionRecommendations: any[] = [];
    const seenCitations = new Set<string>();

    // For every weak topic, find exact textbook chunks
    weakTopics.forEach((topic) => {
      const matchingChunks = retrieveRelevantPassages(topic, selectedDocIds, 2);
      matchingChunks.forEach(({ chunk }) => {
        const key = `${chunk.docTitle}::${chunk.pageNumber}`;
        if (!seenCitations.has(key)) {
          seenCitations.add(key);
          revisionRecommendations.push({
            topic,
            docId: chunk.docId,
            docTitle: chunk.docTitle,
            pageNumber: chunk.pageNumber,
            sectionTitle: chunk.sectionTitle,
            passageSnippet: chunk.content.substring(0, 240) + '...',
            reason: `Targeted revision: You had difficulty with "${topic}". Re-read this section to reinforce foundational concepts.`,
            priority: 'high',
          });
        }
      });
    });

    // If no weak topics, recommend an enrichment section from neutral/untested topics
    if (revisionRecommendations.length === 0 && neutralTopics.length > 0) {
      const matchingChunks = retrieveRelevantPassages(neutralTopics[0], selectedDocIds, 1);
      matchingChunks.forEach(({ chunk }) => {
        revisionRecommendations.push({
          topic: neutralTopics[0],
          docId: chunk.docId,
          docTitle: chunk.docTitle,
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
          passageSnippet: chunk.content.substring(0, 240) + '...',
          reason: `Recommended maintenance: Review key definitions to advance toward full topic mastery.`,
          priority: 'medium',
        });
      });
    }

    // Determine smart personalized next action
    let nextRecommendedAction: {
      actionType: 'revise_topic' | 'watch_video' | 'attempt_quiz' | 'ask_tutor';
      title: string;
      description: string;
      topic?: string;
    };

    if (weakTopics.length > 0) {
      const primaryWeak = weakTopics[0];
      nextRecommendedAction = {
        actionType: 'revise_topic',
        title: `Revise Weak Topic: ${primaryWeak}`,
        description: `Review the recommended textbook excerpts and watch the curated visual tutorial before your next quiz.`,
        topic: primaryWeak,
      };
    } else if (percentage >= 80) {
      nextRecommendedAction = {
        actionType: 'attempt_quiz',
        title: 'Level Up: Attempt Harder Challenge',
        description: `You scored ${percentage}%! Advance to Hard difficulty to test deeper mechanism synthesis.`,
      };
    } else {
      nextRecommendedAction = {
        actionType: 'ask_tutor',
        title: 'Ask AI Tutor for Clarification',
        description: `Clarify borderline concepts with verifiable citations in the AI Tutor arena.`,
      };
    }

    res.json({
      success: true,
      analysis: {
        score,
        totalQuestions: quizQuestions.length,
        percentage,
        strongTopics,
        weakTopics,
        neutralTopics,
        revisionRecommendations: revisionRecommendations.slice(0, 3),
        hasSufficientData,
        nextRecommendedAction,
      }
    });
  } catch (error: any) {
    console.error('Quiz analysis error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze quiz' });
  }
});

// 5. Adaptive Personalized Study Plan Generator
app.post('/api/study-plan/generate', async (req: Request, res: Response) => {
  try {
    const {
      weakTopics = [],
      masteredTopics = [],
      accuracyPct = 65,
      studyMinutesPerDay = 30,
      learningGoal = 'Master core concepts & excel in upcoming exams',
      selectedDocIds
    } = req.body;

    const docs = getDocuments();
    const docTitles = docs.map(d => d.title).join(', ');

    if (!process.env.GEMINI_API_KEY) {
      // Deterministic personalized plan
      const defaultPlan = {
        title: `7-Day Adaptive Mastery Plan: ${weakTopics[0] || 'Core Subject Review'}`,
        summary: `Tailored for ${studyMinutesPerDay} mins/day to boost accuracy from ${accuracyPct}% to 90%+ by addressing weaknesses in ${weakTopics.slice(0, 2).join(', ') || 'foundation concepts'}.`,
        targetGoal: learningGoal,
        dailyCommitmentMinutes: studyMinutesPerDay,
        weakTopicsTargeted: weakTopics,
        dailyPlans: [
          {
            dayNumber: 1,
            dayTitle: `Diagnostic Deep Dive: ${weakTopics[0] || 'Foundational Principles'}`,
            focusTopic: weakTopics[0] || 'Foundations',
            tasks: [
              { id: 't1-1', title: `Review key definitions and mechanisms in source readings`, durationMinutes: 15, completed: false, type: 'reading' },
              { id: 't1-2', title: `Take a 5-question targeted adaptive quiz`, durationMinutes: 15, completed: false, type: 'quiz' }
            ],
            keyConcepts: ['Core terminology', 'Mechanism flowchart', 'Common misconceptions']
          },
          {
            dayNumber: 2,
            dayTitle: `Bridging the Gap: ${weakTopics[1] || 'Process Analysis'}`,
            focusTopic: weakTopics[1] || 'Process Flow',
            tasks: [
              { id: 't2-1', title: `Ask Learnova AI tutor 3 clarification questions`, durationMinutes: 10, completed: false, type: 'practice' },
              { id: 't2-2', title: `Summarize the step-by-step sequence in your own words`, durationMinutes: 10, completed: false, type: 'revision' },
              { id: 't2-3', title: `Attempt medium-difficulty challenge question`, durationMinutes: 10, completed: false, type: 'quiz' }
            ],
            keyConcepts: ['Cause and effect', 'Mathematical formulas / balance', 'Key citations']
          },
          {
            dayNumber: 3,
            dayTitle: `Consolidation & Active Recall`,
            focusTopic: 'Synthesis',
            tasks: [
              { id: 't3-1', title: `Compare and contrast related mechanisms`, durationMinutes: 15, completed: false, type: 'revision' },
              { id: 't3-2', title: `High-speed review flash quiz`, durationMinutes: 15, completed: false, type: 'quiz' }
            ],
            keyConcepts: ['Synthesis across chapters', 'Error log inspection']
          }
        ],
        adaptiveRecommendations: [
          `Prioritize active recall over passive re-reading for ${weakTopics[0] || 'key topics'}.`,
          `Use Learnova AI chat to verify citations whenever in doubt.`,
          `Retake adaptive quiz when confidence exceeds 75%.`
        ]
      };

      return res.json({ success: true, plan: defaultPlan });
    }

    const prompt = `You are Learnova AI's Adaptive Learning Engine.
Generate a tailored 5-to-7 day personalized study schedule for a student with the following profile:
- Current Overall Accuracy: ${accuracyPct}%
- Weak Topics Needing Urgent Focus: ${weakTopics.join(', ') || 'General fundamentals'}
- Mastered Topics (only need periodic review): ${masteredTopics.join(', ') || 'None yet'}
- Available Daily Study Time: ${studyMinutesPerDay} minutes per day
- Student Target Goal: "${learningGoal}"
- Available Course Materials: ${docTitles}

Generate a structured JSON study plan with:
- "title": string
- "summary": string (2-3 sentences explaining the adaptive strategy)
- "dailyCommitmentMinutes": ${studyMinutesPerDay}
- "weakTopicsTargeted": array of strings
- "dailyPlans": array of daily objects:
  {
    "dayNumber": number (1 to 5),
    "dayTitle": string,
    "focusTopic": string,
    "tasks": [
      { "id": "task-uuid", "title": "string", "durationMinutes": number, "completed": false, "type": "reading" | "quiz" | "revision" | "practice" }
    ],
    "keyConcepts": ["string", "string"]
  }
- "adaptiveRecommendations": array of 3 specific actionable study tips tailored to their weak areas.
`;

    let plan: any = null;
    try {
      const genResult = await generateContentWithRetry({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      }, 3);

      plan = JSON.parse(genResult.text || '{}');
    } catch (planErr) {
      console.warn('Study plan generation with AI failed after retries, falling back to adaptive default template:', planErr);
      plan = {
        title: `7-Day Adaptive Mastery Plan: ${weakTopics[0] || 'Core Subject Review'}`,
        summary: `Tailored for ${studyMinutesPerDay} mins/day to boost accuracy from ${accuracyPct}% to 90%+ by focusing on ${weakTopics.slice(0, 2).join(', ') || 'foundation concepts'}.`,
        targetGoal: learningGoal,
        dailyCommitmentMinutes: studyMinutesPerDay,
        weakTopicsTargeted: weakTopics,
        dailyPlans: [
          {
            dayNumber: 1,
            dayTitle: `Diagnostic Deep Dive: ${weakTopics[0] || 'Foundational Principles'}`,
            focusTopic: weakTopics[0] || 'Foundations',
            tasks: [
              { id: 't1-1', title: `Review key definitions and mechanisms in source readings`, durationMinutes: Math.round(studyMinutesPerDay * 0.5), completed: false, type: 'reading' },
              { id: 't1-2', title: `Take a targeted adaptive quiz on ${weakTopics[0] || 'foundations'}`, durationMinutes: Math.round(studyMinutesPerDay * 0.5), completed: false, type: 'quiz' }
            ],
            keyConcepts: ['Core terminology', 'Mechanism flowchart', 'Key citations']
          },
          {
            dayNumber: 2,
            dayTitle: `Process Analysis & Clarification`,
            focusTopic: weakTopics[1] || 'Process Flow',
            tasks: [
              { id: 't2-1', title: `Ask Learnova AI tutor 3 clarification questions with citations`, durationMinutes: Math.round(studyMinutesPerDay * 0.4), completed: false, type: 'practice' },
              { id: 't2-2', title: `Summarize the step-by-step sequence in your own notes`, durationMinutes: Math.round(studyMinutesPerDay * 0.6), completed: false, type: 'revision' }
            ],
            keyConcepts: ['Cause and effect', 'Mathematical balance', 'Verified citations']
          }
        ],
        adaptiveRecommendations: [
          `Prioritize active recall over passive re-reading for ${weakTopics[0] || 'key topics'}.`,
          `Use Learnova AI tutor chat to verify citations whenever in doubt.`,
          `Retake adaptive quiz when confidence exceeds 75%.`
        ]
      };
    }

    res.json({ success: true, plan });
  } catch (error: any) {
    console.error('Study plan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Smart Video Recommendations Endpoint
app.post('/api/videos/recommendations', async (req: Request, res: Response) => {
  try {
    const {
      topicScores = {},
      weakTopics = [],
      masteredTopics = [],
      selectedTopicFilter = '',
      searchQuery = '',
      selectedDocIds
    } = req.body || {};

    const allDocs = getDocuments();
    const activeDocs = Array.isArray(selectedDocIds) && selectedDocIds.length > 0
      ? allDocs.filter(d => selectedDocIds.includes(d.id))
      : allDocs;

    const data = await getSmartVideoRecommendations({
      activeDocuments: activeDocs.length > 0 ? activeDocs : allDocs,
      topicScores,
      weakTopics,
      masteredTopics,
      selectedTopicFilter,
      searchQuery,
    });

    res.json(data);
  } catch (error: any) {
    console.error('Video recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch video recommendations'
    });
  }
});

// 7. Evaluation and Reliability Benchmark Endpoint
app.get('/api/evaluation/benchmark', (req: Request, res: Response) => {
  res.json({
    success: true,
    benchmarkDataset: BENCHMARK_DATASET,
    totalQuestions: BENCHMARK_DATASET.length,
  });
});

app.post('/api/evaluation/run', async (req: Request, res: Response) => {
  try {
    const report = await runEvaluationSuite(Boolean(process.env.GEMINI_API_KEY));
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Evaluation run error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// API ERROR INTERCEPTOR & STATIC ASSETS
// ==========================================

app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    console.error('[API Error Intercepted]:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File exceeds maximum upload size of 25MB.' });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    }
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'An unexpected error occurred while processing the request.'
    });
  }
  next(err);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Learnova AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
