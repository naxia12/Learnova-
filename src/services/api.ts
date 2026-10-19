import {
  StudyDocumentMeta,
  ChatMessage,
  QuizQuestion,
  StudyPlan,
  EvaluationReport,
  EvaluationItem,
  DocumentChunk,
  VideoRecommendationsResponse,
  QuizAnalysisResult
} from '../types';

/**
 * Robust response handler that inspects HTTP status code and content-type
 * before attempting JSON parsing, preventing "Unexpected token <" syntax errors.
 */
async function handleResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  // Non-JSON response (e.g. HTML 504 Gateway Timeout, 502 Bad Gateway, or 500 error page)
  if (!contentType.includes('application/json')) {
    let errorDetail = '';
    try {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<!doctype')) {
        if (res.status === 504) {
          errorDetail = 'The server timed out while processing your request (HTTP 504). Please try again with a smaller file.';
        } else if (res.status === 502) {
          errorDetail = 'The server is temporarily unavailable (HTTP 502 Bad Gateway). Please retry in a few moments.';
        } else if (res.status === 503) {
          errorDetail = 'The service is temporarily overloaded (HTTP 503). Please try again shortly.';
        } else if (res.status === 413) {
          errorDetail = 'The file is too large (maximum allowed size is 25MB).';
        } else {
          errorDetail = `Server returned an unexpected HTML error page (HTTP ${res.status}).`;
        }
      } else if (text.trim()) {
        errorDetail = text.slice(0, 300);
      }
    } catch {
      errorDetail = `HTTP ${res.status} ${res.statusText}`;
    }

    throw new Error(errorDetail || `Server error (${res.status}). Please try again.`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch (parseError: any) {
    throw new Error(`Failed to parse server response as JSON: ${parseError.message}`);
  }

  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.error || fallbackError);
  }

  return data as T;
}

/**
 * Safe fetch wrapper that handles network disconnects and connection refused errors
 */
async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (networkError: any) {
    if (networkError.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error('Network connection failed. Unable to reach the server. Please check your internet connection.');
  }
}

export const api = {
  // 1. Documents
  async getDocuments(): Promise<{ documents: StudyDocumentMeta[]; totalDocuments: number; totalChunks: number }> {
    const res = await safeFetch('/api/documents');
    return handleResponse(res, 'Failed to load documents');
  },

  async getDocumentDetails(id: string): Promise<{ document: any }> {
    const res = await safeFetch(`/api/documents/${id}`);
    return handleResponse(res, 'Failed to load document details');
  },

  async uploadDocument(file: File): Promise<{ success: boolean; document: StudyDocumentMeta }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await safeFetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    return handleResponse(res, 'Failed to upload document');
  },

  async resetSampleDocuments(): Promise<{ success: boolean; documents: any[] }> {
    const res = await safeFetch('/api/documents/reset-sample', {
      method: 'POST',
    });
    return handleResponse(res, 'Failed to reset sample documents');
  },

  async deleteDocument(id: string): Promise<boolean> {
    const res = await safeFetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    const data = await handleResponse<{ success: boolean }>(res, 'Failed to delete document');
    return Boolean(data.success);
  },

  // 2. Tutor Chat
  async sendTutorMessage(params: {
    message: string;
    selectedDocIds?: string[];
    history?: { role: string; content: string }[];
  }): Promise<{
    answer: string;
    citations: any[];
    retrievedPassages: DocumentChunk[];
    isTemporarilyUnavailable?: boolean;
    usedModel?: string;
    attemptsCount?: number;
  }> {
    const res = await safeFetch('/api/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res, 'Failed to contact tutor service');
  },

  // 3. Quiz Generation
  async generateQuiz(params: {
    docIds?: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    targetTopics?: string[];
    questionCount?: number;
  }): Promise<{
    quiz: {
      id: string;
      difficulty: 'easy' | 'medium' | 'hard';
      questions: QuizQuestion[];
      createdAt: string;
    };
  }> {
    const res = await safeFetch('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res, 'Failed to generate quiz');
  },

  // 4. Personalized Study Plan
  async generateStudyPlan(params: {
    weakTopics: string[];
    masteredTopics: string[];
    accuracyPct: number;
    studyMinutesPerDay: number;
    learningGoal: string;
    selectedDocIds?: string[];
  }): Promise<{ plan: StudyPlan }> {
    const res = await safeFetch('/api/study-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res, 'Failed to generate study plan');
  },

  // 5. Evaluation Benchmarks
  async getBenchmarkDataset(): Promise<{ benchmarkDataset: EvaluationItem[]; totalQuestions: number }> {
    const res = await safeFetch('/api/evaluation/benchmark');
    return handleResponse(res, 'Failed to load benchmark dataset');
  },

  async runEvaluation(): Promise<{ report: EvaluationReport }> {
    const res = await safeFetch('/api/evaluation/run', {
      method: 'POST',
    });
    return handleResponse(res, 'Evaluation failed to run');
  },

  // 6. Smart Video Recommendations
  async getVideoRecommendations(params: {
    topicScores?: { [topic: string]: { correct: number; total: number; percentage: number } };
    weakTopics?: string[];
    masteredTopics?: string[];
    selectedTopicFilter?: string;
    searchQuery?: string;
    selectedDocIds?: string[];
  }): Promise<VideoRecommendationsResponse> {
    const res = await safeFetch('/api/videos/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res, 'Failed to fetch video recommendations');
  },

  // 7. Quiz Analysis & Personalized Revision Recommendations
  async analyzeQuizResults(params: {
    quizQuestions: QuizQuestion[];
    selectedAnswers: { [questionId: string]: number };
    activeTopicScores?: { [topic: string]: { correct: number; total: number; percentage: number } };
    selectedDocIds?: string[];
  }): Promise<{ success: boolean; analysis: QuizAnalysisResult }> {
    const res = await safeFetch('/api/quiz/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res, 'Failed to analyze quiz results');
  },
};
