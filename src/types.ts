export interface StudyDocumentMeta {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'text' | 'slides' | 'markdown';
  fileSize: number;
  uploadedAt: string;
  pageCount: number;
  summary: string;
  topics: string[];
  chunkCount: number;
  isSample?: boolean;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  content: string;
}

export interface Citation {
  fileName: string;
  pageNumber?: number;
  sectionTitle?: string;
  isVerified?: boolean;
  citationKey?: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  retrievedPassages?: DocumentChunk[];
  isRefusal?: boolean;
  isTemporarilyUnavailable?: boolean;
  userQueryForRetry?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceDocTitle?: string;
  sourcePage?: number;
}

export interface QuizResult {
  id: string;
  date: string;
  docTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topicPerformance: { [topic: string]: { correct: number; total: number } };
  isSampleData?: boolean;
}

export interface LearnerProfile {
  name: string;
  streakDays: number;
  lastActiveDate: string;
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  accuracyPct: number;
  currentDifficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';
  masteredTopics: string[];
  weakTopics: string[];
  topicScores: { [topic: string]: { correct: number; total: number; percentage: number } };
  quizHistory: QuizResult[];
  hasSampleData?: boolean;
}

export interface StudyPlanTask {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  type: 'reading' | 'quiz' | 'revision' | 'practice';
}

export interface DailyStudyPlan {
  dayNumber: number;
  dayTitle: string;
  focusTopic: string;
  tasks: StudyPlanTask[];
  keyConcepts: string[];
}

export interface StudyPlan {
  title: string;
  summary: string;
  targetGoal?: string;
  dailyCommitmentMinutes: number;
  weakTopicsTargeted: string[];
  dailyPlans: DailyStudyPlan[];
  adaptiveRecommendations: string[];
  createdAt: string;
}

export interface EvaluationItem {
  id: string;
  question: string;
  expectedAnswer: string;
  expectedSourceFile: string;
  expectedPage: number;
  expectedKeywords: string[];
  docId: string;
  isNegativeTest?: boolean;
}

export interface EvaluationResult {
  itemId: string;
  question: string;
  expectedAnswer: string;
  actualAnswer: string;
  citedSources: { fileName: string; pageNumber: number }[];
  citationCorrect: boolean;
  citationScore: number;
  answerRelevanceScore: number;
  groundednessScore: number;
  overallPassed: boolean;
  latencyMs: number;
  notes: string;
}

export interface EvaluationReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  overallAccuracyPct: number;
  meanCitationAccuracyPct: number;
  meanRelevancePct: number;
  meanGroundednessPct: number;
  hallucinationRatePct: number;
  averageLatencyMs: number;
  results: EvaluationResult[];
  frameworkGuidelines: {
    ragas: string;
    deepEval: string;
    truLens: string;
  };
}

export interface VideoRecommendation {
  id: string;
  title: string;
  channelTitle: string;
  description?: string;
  thumbnailUrl?: string;
  youtubeUrl: string;
  searchUrl: string;
  topic: string;
  isWeakTopic: boolean;
  scorePercentage?: number;
  recommendationReason: string;
  duration?: string;
  isDirectVideo: boolean;
}

export interface AvailableTopicMeta {
  topic: string;
  isWeak: boolean;
  isMastered: boolean;
  scorePercentage?: number;
  docCount: number;
}

export interface VideoRecommendationsResponse {
  success: boolean;
  source: 'youtube_api' | 'smart_search_fallback';
  apiKeyConfigured: boolean;
  selectedTopic: string;
  availableTopics: AvailableTopicMeta[];
  recommendations: VideoRecommendation[];
  weakTopicRecommendations: VideoRecommendation[];
}

export interface RevisionRecommendation {
  topic: string;
  docId: string;
  docTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  passageSnippet: string;
  reason: string;
  priority: 'high' | 'medium' | 'normal';
}

export interface QuizAnalysisResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  strongTopics: string[];
  weakTopics: string[];
  neutralTopics: string[];
  revisionRecommendations: RevisionRecommendation[];
  hasSufficientData: boolean;
  nextRecommendedAction: {
    actionType: 'revise_topic' | 'watch_video' | 'attempt_quiz' | 'ask_tutor';
    title: string;
    description: string;
    topic?: string;
  };
}

