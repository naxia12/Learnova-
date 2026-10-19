# Learnova AI: Understand Better. Learn Smarter. Grow Beyond.



Learnova AI is a production-grade, source-grounded intelligent learning companion designed to help students master complex course materials with zero hallucination risk, adaptive dynamic quizzes, continuous cognitive learner modeling, and tailored study plans.

---

## 🚀 Key Features & Capabilities

### 1. Document Extraction & Knowledge Scope
- **Multi-Format Processing:** Upload PDF textbooks, lecture slides, markdown notes, or text files up to 25MB.
- **Page-Aware Chunking:** Intelligently breaks materials into granular, searchable passages preserved with exact document titles and page markers (`[DocumentTitle, Page X]`).
- **Preloaded Academic Textbooks:** Out-of-the-box textbooks ready for immediate judge evaluation:
  - *Biology 101: Cellular Respiration, Glycolysis & Photosynthesis*
  - *Computer Science: Transformer Architecture & Attention Mechanisms*
  - *World History: The First Industrial Revolution & Socioeconomic Transformation*

### 2. Source-Grounded AI Tutor & 503 Resilience (Zero Hallucination Protocol)
- **Stubborn Grounding:** Every response is synthesized exclusively from retrieved document passages using Gemini 3.8 Flash (`gemini-3.8-flash`).
- **Verifiable Citations:** Returns inline citations containing filename and page number (`[Bio 101, Page 2]`). Clickable citation badges allow instant inspection of the source passage.
- **Strict Negative Refusal:** When a user asks an unanswerable question or something not present in their uploaded study materials, Learnova AI explicitly states:
  > *"I couldn't find this information in your uploaded sources."*
- **High-Availability & 503/429 Resilience:**
  - Automated 3-stage exponential backoff with jitter (1s, 2s, 4s).
  - Multi-model fallback sequence: `gemini-3.8-flash` &rarr; `gemini-flash-latest` &rarr; `gemini-3.1-flash-lite`.
  - Graceful fallback delivers grounded textbook excerpts and a 1-click retry option if model servers experience temporary congestion.

### 3. Adaptive Quiz Arena
- **Dynamic Difficulty Calibration:** 4-choice multiple choice questions that adjust difficulty level (**Easy → Medium → Hard**) dynamically based on immediate performance.
- **Pedagogical Explanations:** Explains the reasoning behind each answer with verified references back to the textbook page.
- **Real-Time Mastery Adjustment:** Updates student mastery scores on the fly upon quiz completion, accompanied by celebratory reward visuals.

### 4. Continuous Learner Model
- Tracks cumulative accuracy, quiz history, question counts, and learning streaks.
- Pinpoints **Mastered Topics** (≥75% accuracy) vs. **Weak Topics** (<60% accuracy).
- Dynamically assigns an adaptive tier (**Beginner, Intermediate, Advanced, Mastery**).

### 5. Personalized Study Plan
- Formulates multi-day daily schedules calibrated to the student's available study time (15, 30, 45, or 60 mins/day).
- Focuses specifically on weak topics identified by the adaptive diagnostic engine.
- Interactive, checkable study tasks saved in persistent state.

### 6. Hackathon Evaluation & Reliability Suite
- Built-in benchmark dataset with gold-standard Q&A pairs across biology, computer science, history, and negative refusal tests.
- Live automated RAG benchmark measuring **Citation Accuracy**, **Groundedness / Faithfulness**, **Answer Relevance**, and **Negative Refusal Rate**.
- Architecture aligned with industry standards: **RAGAS**, **DeepEval**, and **TruLens**.

---

## 🏛️ System Architecture

```
[ User Browser / React 19 Client ]
                │
                ▼ HTTP / JSON
[ Express API Server (:3000) ]
   ├── /api/documents (Upload, PDF Parse, Chunking, In-Memory Index)
   ├── /api/tutor/chat (RAG Passage Retrieval, Strict Grounding Prompts)
   ├── /api/quiz/generate (Adaptive 4-Option MCQ Generator)
   ├── /api/study-plan/generate (Personalized Schedule Engine)
   └── /api/evaluation/run (Automated Benchmark Harness)
                │
                ▼ Server-Side Proxy
[ Google Gemini 3.8 Flash API ]
   └── SDK: @google/genai
   └── Secure process.env.GEMINI_API_KEY
```

---

## 🧪 Evaluation Guidelines & Methodologies

1. **RAGAS (Retrieval Augmented Generation Assessment):**
   - **Faithfulness:** Ensures answers contain only assertions directly inferable from retrieved chunks.
   - **Answer Relevance:** Evaluates whether the generated response directly answers the user prompt.
2. **DeepEval (G-Eval):**
   - **Citation Precision:** Confirms that cited filenames and page numbers exist and substantiate the claim.
3. **TruLens RAG Triad:**
   - **Context Relevance, Groundedness, and Answer Relevance** are verified continuously.

---

## 🏃 Quick Start / Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables in .env
GEMINI_API_KEY="your-gemini-api-key"

# 3. Start development server
npm run dev
# The app will be available on http://localhost:3000
```

---

## 🎯 Guided Demo Flow for Judges
1. **Dashboard:** Observe learner streak, cognitive profile, and topic accuracy.
2. **Study Materials:** Explore preloaded textbooks or upload a PDF/text file.
3. **AI Tutor:** Ask `"What is the net ATP yield of glycolysis?"` and test an out-of-domain question to verify the refusal contract.
4. **Citations:** Click the citation pills to inspect source chunks and page numbers.
5. **Adaptive Quiz:** Take a 4-question quiz and see the real-time difficulty adaptation.
6. **Learner Model:** Observe updated topic mastery and difficulty rating.
7. **Study Plan:** Generate an adaptive multi-day schedule targeting weak topics and check off tasks.
