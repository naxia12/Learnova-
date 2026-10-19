import React from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Sparkles,
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Layers,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Network,
  Compass,
  Play
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';
import { StudyDocumentMeta } from '../types';
import { NavTab } from './Sidebar';
import { VideoRecommendationsSection } from './VideoRecommendationsSection';

interface DashboardViewProps {
  documents: StudyDocumentMeta[];
  onSelectTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ documents, onSelectTab }) => {
  const {
    learner,
    selectedDocIds,
    activeStudyPlan,
    resetLearnerProfile,
    loadSampleLearnerProfile,
    clearSampleData,
    setIsNameModalOpen
  } = useLearner();

  const totalDocuments = documents.length;
  const totalChunks = documents.reduce((acc, d) => acc + d.chunkCount, 0);

  // Top weak topics
  const weakTopics = learner.weakTopics.length > 0
    ? learner.weakTopics
    : ['Electron Transport Chain', 'Attention Mechanisms'];

  // Top mastered topics
  const masteredTopics = learner.masteredTopics.length > 0
    ? learner.masteredTopics
    : ['Glycolysis', 'Industrial Revolution'];

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* 1. Futuristic Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1542] via-[#141033] to-[#0d0a26] text-white p-7 sm:p-9 border border-violet-500/25 shadow-2xl">
        {/* Glow ambient backdrops */}
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 backdrop-blur-md text-violet-200 text-xs font-semibold border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Personalized Tutoring & Adaptive Engine</span>
            </div>
            {learner.name ? (
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-violet-200 text-[11px] font-medium border border-white/15 transition-colors"
                title="Click to edit your name"
              >
                ✏️ Edit Name
              </button>
            ) : (
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md"
              >
                👋 Set Student Name
              </button>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            {learner.name ? `Welcome back, ${learner.name}! 👋` : `Welcome to Learnova AI! 👋`}
          </h1>
          <p className="mt-2.5 text-violet-200/80 text-sm sm:text-base max-w-2xl leading-relaxed">
            {learner.name
              ? `Your calibrated learning profile is actively personalizing your AI tutoring citations, weak-concept video recommendations, and adaptive quizzes.`
              : `Your intelligent academic workspace with source-grounded answers, cognitive concept maps, and tailored mastery plans.`}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectTab('tutor')}
              className="px-5 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 ring-1 ring-white/20"
            >
              <Brain className="w-4 h-4 text-violet-200" />
              <span>Enter AI Study Room</span>
            </button>
            <button
              onClick={() => onSelectTab('galaxy')}
              className="px-4 py-3 bg-[#1e1948]/80 hover:bg-[#251f58] text-violet-200 border border-violet-500/30 font-semibold rounded-2xl text-xs sm:text-sm transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <Network className="w-4 h-4 text-violet-300" />
              <span>Explore Knowledge Galaxy</span>
            </button>
            <button
              onClick={() => onSelectTab('quiz')}
              className="px-4 py-3 bg-[#1e1948]/80 hover:bg-[#251f58] text-violet-200 border border-violet-500/30 font-semibold rounded-2xl text-xs sm:text-sm transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Adaptive Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Cognitive & Progress Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="p-5 rounded-2xl bg-[#120f2e]/85 border border-violet-500/20 shadow-lg hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">Active Streak</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{learner.streakDays}</span>
            <span className="text-xs font-semibold text-slate-400">days active</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Daily engagement goal active</span>
          </div>
        </div>

        {/* Accuracy Card */}
        <div className="p-5 rounded-2xl bg-[#120f2e]/85 border border-violet-500/20 shadow-lg hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">Overall Accuracy</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
              <Award className="w-5 h-5 text-violet-300" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{learner.accuracyPct}%</span>
            <span className="text-xs font-semibold text-slate-400">
              ({learner.totalQuestionsCorrect}/{learner.totalQuestionsAnswered})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across {learner.totalQuizzesTaken} completed quizzes
          </div>
        </div>

        {/* Adaptive Tier */}
        <div className="p-5 rounded-2xl bg-[#120f2e]/85 border border-violet-500/20 shadow-lg hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">Learner Level</span>
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
              <Zap className="w-5 h-5 text-fuchsia-300 fill-fuchsia-300" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{learner.currentDifficultyLevel}</span>
          </div>
          <div className="mt-2 text-[11px] text-violet-300 font-semibold flex items-center gap-1">
            <span>Dynamic tier adjustment active</span>
          </div>
        </div>

        {/* Study Materials */}
        <div className="p-5 rounded-2xl bg-[#120f2e]/85 border border-violet-500/20 shadow-lg hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">Study Materials</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalDocuments}</span>
            <span className="text-xs font-semibold text-slate-400">documents</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {totalChunks} indexed & verifiable passages
          </div>
        </div>
      </div>

      {/* 3. Continue Learning Banner & Priority Recommendations */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/60 via-[#18123d] to-[#120f2e] border border-violet-500/25 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
              Continue Learning Roadmap
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-white">
            Focus Concept: <span className="text-amber-300">{weakTopics[0] || 'Core Subject Review'}</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Your recent evaluation identified difficulty in this topic. Strengthen your understanding with source-cited tutor clarification, textbook page revision, or visual video animations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => onSelectTab('tutor')}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Ask Tutor with Citations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTab('galaxy')}
            className="px-4 py-2.5 bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 border border-violet-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            View in Galaxy
          </button>
        </div>
      </div>

      {/* 4. Two Column Layout: Topic Mastery Overview & Daily Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Topic Mastery Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#120f2e]/85 border border-violet-500/20 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Cognitive Concept Matrix</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time mastery status derived from adaptive quiz answers
                </p>
              </div>
              <button
                onClick={() => onSelectTab('insights')}
                className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1"
              >
                <span>Full Insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Topics Bar Graph */}
            <div className="space-y-3.5">
              {Object.entries(learner.topicScores).map(([topic, data]) => {
                const isWeak = data.percentage < 60;
                const isMastered = data.percentage >= 75;
                return (
                  <div key={topic} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{topic}</span>
                        {isWeak && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Weak Area
                          </span>
                        )}
                        {isMastered && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Mastered
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-300 font-mono">
                        {data.percentage}% ({data.correct}/{data.total})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWeak
                            ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_#f43f5e]'
                            : isMastered
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_#34d399]'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-400 shadow-[0_0_8px_#a78bfa]'
                        }`}
                        style={{ width: `${Math.max(8, data.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Daily Study Goals & Controls */}
        <div className="space-y-6">
          {/* Daily Goals & Plan Snapshot */}
          <div className="p-6 rounded-3xl bg-[#120f2e]/85 border border-violet-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Daily Study Commitment</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                30 Mins Daily
              </span>
            </div>

            {activeStudyPlan ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-medium">
                  {activeStudyPlan.title}
                </p>
                <div className="space-y-2">
                  {activeStudyPlan.dailyPlans[0]?.tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-violet-500/10 text-xs text-slate-300"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          task.completed ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-600'
                        }`}
                      />
                      <span className={`flex-1 truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{task.durationMinutes}m</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onSelectTab('plan')}
                  className="w-full mt-2 py-2 text-xs font-bold text-violet-300 hover:text-white bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/20 rounded-xl transition-colors"
                >
                  View Full Schedule &rarr;
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">No active study plan generated yet.</p>
                <button
                  onClick={() => onSelectTab('plan')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Generate Personalized Plan
                </button>
              </div>
            )}
          </div>

          {/* Profile & Demo Controls */}
          <div className="bg-[#0b091e] border border-violet-900/40 p-5 rounded-3xl shadow-xl space-y-3 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Demo & Profile Controls
              </span>
              <span className="text-[10px] bg-violet-950 text-violet-300 px-2 py-0.5 rounded font-mono border border-violet-800/40">
                Learner Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toggle between simulated benchmark results and empty fresh learner states.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="w-full py-2 bg-violet-600/70 hover:bg-violet-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-violet-500/40"
              >
                <span>Change Student Name ({learner.name || 'Not set'})</span>
              </button>
              <button
                onClick={clearSampleData}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-800"
              >
                <span>Clear Sample Data (Blank Slate)</span>
              </button>
              <button
                onClick={loadSampleLearnerProfile}
                className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
                <span>Reload Sample Quizzes</span>
              </button>
              <button
                onClick={() => onSelectTab('eval')}
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>Run RAG Benchmark Suite</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recommended YouTube Videos Section */}
      <VideoRecommendationsSection
        documents={documents}
        onNavigateTutor={(topic) => onSelectTab('tutor')}
        onNavigateQuiz={(topic) => onSelectTab('quiz')}
      />
    </div>
  );
};
