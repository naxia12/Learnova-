import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Compass,
  FileText,
  Youtube,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { QuizQuestion, StudyDocumentMeta, QuizResult, QuizAnalysisResult } from '../types';
import { useLearner } from '../context/LearnerContext';
import { NavTab } from './Sidebar';
import { VideoRecommendationsSection } from './VideoRecommendationsSection';

interface QuizViewProps {
  documents: StudyDocumentMeta[];
  onNavigateTab: (tab: NavTab) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ documents, onNavigateTab }) => {
  const { learner, selectedDocIds, updateProfileWithQuizResult } = useLearner();

  const [loading, setLoading] = useState(false);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: number }>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<{ [questionId: string]: boolean }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    learner.currentDifficultyLevel === 'Beginner'
      ? 'easy'
      : learner.currentDifficultyLevel === 'Mastery' || learner.currentDifficultyLevel === 'Advanced'
      ? 'hard'
      : 'medium'
  );
  const [error, setError] = useState<string | null>(null);
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const startNewQuiz = async (difficultyOverride?: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    setError(null);
    setQuizFinished(false);
    setQuizAnalysis(null);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setCurrentQuestionIndex(0);

    const diff = difficultyOverride || activeDifficulty;

    try {
      const res = await api.generateQuiz({
        docIds: selectedDocIds,
        difficulty: diff,
        targetTopics: learner.weakTopics.length > 0 ? learner.weakTopics : undefined,
        questionCount: 4,
      });

      if (!res.quiz.questions || res.quiz.questions.length === 0) {
        throw new Error('No quiz questions could be generated. Please select more documents.');
      }

      setCurrentQuizQuestions(res.quiz.questions);
      setActiveDifficulty(diff);
    } catch (err: any) {
      setError(err.message || 'Failed to generate adaptive quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submittedAnswers[questionId]) return; // already submitted
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitCurrentQuestion = () => {
    if (!currentQuizQuestions) return;
    const currentQ = currentQuizQuestions[currentQuestionIndex];
    if (selectedAnswers[currentQ.id] === undefined) return;

    setSubmittedAnswers((prev) => ({ ...prev, [currentQ.id]: true }));

    // Check if correct
    const isCorrect = selectedAnswers[currentQ.id] === currentQ.correctAnswerIndex;

    // Adaptive difficulty adjustment on-the-fly!
    if (isCorrect && activeDifficulty === 'easy') {
      setActiveDifficulty('medium');
    } else if (isCorrect && activeDifficulty === 'medium') {
      setActiveDifficulty('hard');
    } else if (!isCorrect && activeDifficulty === 'hard') {
      setActiveDifficulty('medium');
    } else if (!isCorrect && activeDifficulty === 'medium') {
      setActiveDifficulty('easy');
    }
  };

  const handleNextQuestion = () => {
    if (!currentQuizQuestions) return;
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Finish Quiz
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!currentQuizQuestions) return;

    let totalScore = 0;
    const topicPerf: { [topic: string]: { correct: number; total: number } } = {};

    for (const q of currentQuizQuestions) {
      const userAns = selectedAnswers[q.id];
      const isCorrect = userAns === q.correctAnswerIndex;
      if (isCorrect) totalScore++;

      if (!topicPerf[q.topic]) {
        topicPerf[q.topic] = { correct: isCorrect ? 1 : 0, total: 1 };
      } else {
        topicPerf[q.topic].correct += isCorrect ? 1 : 0;
        topicPerf[q.topic].total += 1;
      }
    }

    const percentage = Math.round((totalScore / currentQuizQuestions.length) * 100);

    const result: QuizResult = {
      id: `quiz-run-${Date.now()}`,
      date: new Date().toISOString(),
      docTitle: currentQuizQuestions[0]?.sourceDocTitle || 'Selected Study Materials',
      score: totalScore,
      totalQuestions: currentQuizQuestions.length,
      percentage,
      difficulty: activeDifficulty,
      topicPerformance: topicPerf,
    };

    updateProfileWithQuizResult(result);
    setQuizFinished(true);

    if (percentage >= 75) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    // Trigger detailed personalized weak topic analysis & textbook revision recommendations
    setAnalyzing(true);
    try {
      const analysisRes = await api.analyzeQuizResults({
        quizQuestions: currentQuizQuestions,
        selectedAnswers,
        activeTopicScores: learner.topicScores,
        selectedDocIds,
      });
      if (analysisRes.success && analysisRes.analysis) {
        setQuizAnalysis(analysisRes.analysis);
      }
    } catch (e) {
      console.warn('Quiz analysis endpoint error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const currentQ = currentQuizQuestions ? currentQuizQuestions[currentQuestionIndex] : null;
  const isCurrentSubmitted = currentQ ? Boolean(submittedAnswers[currentQ.id]) : false;
  const currentSelectedOption = currentQ ? selectedAnswers[currentQ.id] : undefined;

  return (
    <div className="space-y-6 pb-12">
      {/* Quiz Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900">Adaptive Quiz Arena</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Real-Time Calibration
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Dynamically adjusts question difficulty based on your answers to test foundational recall and deep synthesis.
          </p>
        </div>

        {/* Difficulty Selector pills */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => startNewQuiz(diff)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                activeDifficulty === diff
                  ? diff === 'easy'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : diff === 'medium'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* If No Quiz active and not loading */}
      {!currentQuizQuestions && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ready to test your knowledge?</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              We’ll generate 4 multiple-choice questions from your currently selected study materials.
              Each question includes detailed explanations and page citations.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => startNewQuiz()}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Adaptive Quiz ({activeDifficulty.toUpperCase()})</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 max-w-md mx-auto shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            Synthesizing Adaptive Questions...
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Extracting core principles from your selected documents and formulating four balanced options.
          </p>
        </div>
      )}

      {/* Active Quiz Question Card */}
      {currentQuizQuestions && !quizFinished && currentQ && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-xs max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                Question {currentQuestionIndex + 1} of {currentQuizQuestions.length}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                currentQ.difficulty === 'easy'
                  ? 'bg-emerald-50 text-emerald-700'
                  : currentQ.difficulty === 'medium'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {currentQ.difficulty} Tier
              </span>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Topic: <strong className="text-slate-700">{currentQ.topic}</strong>
            </span>
          </div>

          {/* Question Text */}
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>

          {/* 4 Multiple Choice Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = currentSelectedOption === idx;
              const isCorrectAnswer = idx === currentQ.correctAnswerIndex;

              let optionStyle = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 text-slate-800';
              if (isSelected && !isCurrentSubmitted) {
                optionStyle = 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600';
              } else if (isCurrentSubmitted) {
                if (isCorrectAnswer) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = 'border-rose-400 bg-rose-50 text-rose-900 ring-1 ring-rose-400';
                } else {
                  optionStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
                  disabled={isCurrentSubmitted}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 ${optionStyle}`}
                >
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>

                  {isCurrentSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isCurrentSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Callout (after submission) */}
          {isCurrentSubmitted && (
            <div className={`p-4 rounded-xl border space-y-1.5 ${
              currentSelectedOption === currentQ.correctAnswerIndex
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                {currentSelectedOption === currentQ.correctAnswerIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Correct! Great Recall</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Incorrect — Concept Revision</span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Difficulty adapts after each question submission.
            </span>

            {!isCurrentSubmitted ? (
              <button
                onClick={handleSubmitCurrentQuestion}
                disabled={currentSelectedOption === undefined}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>{currentQuestionIndex < currentQuizQuestions.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Finished / Detailed Score & Analysis Screen */}
      {quizFinished && currentQuizQuestions && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Main Score Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Quiz Evaluation Completed
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                Your Score:{' '}
                {
                  Object.values(submittedAnswers).filter(
                    (_, i) => selectedAnswers[currentQuizQuestions[i].id] === currentQuizQuestions[i].correctAnswerIndex
                  ).length
                }{' '}
                / {currentQuizQuestions.length} (
                {Math.round(
                  (Object.values(submittedAnswers).filter(
                    (_, i) => selectedAnswers[currentQuizQuestions[i].id] === currentQuizQuestions[i].correctAnswerIndex
                  ).length /
                    currentQuizQuestions.length) *
                    100
                )}
                %)
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                Your actual quiz answers have been analyzed to update your cognitive mastery profile, calibrate difficulty, and generate personalized revision steps.
              </p>
            </div>

            {/* Quick Actions Header */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startNewQuiz()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Take Another Quiz</span>
              </button>
              <button
                onClick={() => onNavigateTab('tutor')}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>Ask AI Tutor with Citations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('profile')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                View Learner Model
              </button>
            </div>
          </div>

          {/* Section 1: Personalized Weak Topic Analysis (Requirement 1 & 5) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Personalized Weak Topic Analysis</h4>
                  <p className="text-xs text-slate-500">
                    Calculated from your verified answers in this quiz and cumulative mastery history.
                  </p>
                </div>
              </div>
            </div>

            {analyzing ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">Analyzing concept breakdown and error patterns...</p>
              </div>
            ) : quizAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strong Topics */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Strong Topics (Demonstrated Mastery)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {quizAnalysis.strongTopics.length} Concepts
                    </span>
                  </div>
                  {quizAnalysis.strongTopics.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {quizAnalysis.strongTopics.map((topic) => (
                        <div key={topic} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-100 text-xs font-semibold text-emerald-900">
                          <span>{topic}</span>
                          <span className="text-[11px] font-bold text-emerald-600">✓ Strong Recall</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-800 italic pt-1">
                      No topics met the strong mastery threshold (≥75%) in this run. Focus on the revision sections below!
                    </p>
                  )}
                </div>

                {/* Weak Topics */}
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                        Weak Topics (Requires Revision)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {quizAnalysis.weakTopics.length} Focus Areas
                    </span>
                  </div>
                  {quizAnalysis.weakTopics.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {quizAnalysis.weakTopics.map((topic) => (
                        <div key={topic} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rose-100 text-xs font-semibold text-rose-900">
                          <span>{topic}</span>
                          <span className="text-[11px] font-bold text-rose-600">⚠️ Needs Reinforcement</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-800 italic pt-1">
                      No weak topics detected in this quiz! All tested questions answered with high accuracy.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  Insufficient response data to distinguish strong and weak topics. Answer more quiz questions to generate personalized analysis.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Personalized Revision Recommendations with Page Numbers (Requirement 2 & 5) */}
          {quizAnalysis && quizAnalysis.revisionRecommendations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Recommended Textbook & Material Revision</h4>
                    <p className="text-xs text-slate-500">
                      Verifiable citations and exact passages from your uploaded learning materials.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  Exact Page Citations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizAnalysis.revisionRecommendations.map((rec, i) => (
                  <div
                    key={`${rec.docId}-${rec.pageNumber}-${i}`}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate">
                          {rec.topic}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                          Page {rec.pageNumber}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {rec.docTitle}
                      </h5>
                      {rec.sectionTitle && (
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                          {rec.sectionTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-3 leading-relaxed italic bg-white p-2 rounded border border-slate-100">
                        "{rec.passageSnippet}"
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {rec.priority} Priority
                      </span>
                      <button
                        onClick={() => onNavigateTab('tutor')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <span>Ask Tutor</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Personalized Next Recommended Action (Requirement 5) */}
          {quizAnalysis && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Recommended Next Action
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {quizAnalysis.nextRecommendedAction.title}
                </h4>
                <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
                  {quizAnalysis.nextRecommendedAction.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {quizAnalysis.nextRecommendedAction.actionType === 'revise_topic' ? (
                  <button
                    onClick={() => onNavigateTab('tutor')}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Clarify in Tutor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : quizAnalysis.nextRecommendedAction.actionType === 'attempt_quiz' ? (
                  <button
                    onClick={() => startNewQuiz('hard')}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Start Harder Quiz</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateTab('plan')}
                    className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>View Study Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Recommended YouTube Videos for Weak Topics (Requirement 3 & 5) */}
          <div className="pt-2">
            <VideoRecommendationsSection
              documents={documents}
              initialTopicFilter={quizAnalysis?.weakTopics?.[0] || undefined}
              title="Recommended Videos for Concept Revision"
              subtitle="Curated educational YouTube lectures tailored to the weak topics and incorrect answers identified in this quiz."
              onNavigateTutor={(topic) => onNavigateTab('tutor')}
              onNavigateQuiz={(topic) => onNavigateTab('quiz')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

