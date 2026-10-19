import React from 'react';
import {
  UserCheck,
  Award,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Zap,
  Sparkles
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';
import { NavTab } from './Sidebar';

interface LearnerProfileViewProps {
  onNavigateTab: (tab: NavTab) => void;
}

export const LearnerProfileView: React.FC<LearnerProfileViewProps> = ({ onNavigateTab }) => {
  const {
    learner,
    loadSampleLearnerProfile,
    resetLearnerProfile,
    clearSampleData,
    setIsNameModalOpen
  } = useLearner();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-600/30 border border-fuchsia-500/40 text-fuchsia-300 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Personalized Learner Cognitive Model</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Adaptive Cognitive Profile
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Continuously models cognitive retention, topic proficiency, and dynamic challenge level based on verified quiz performance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNameModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>✏️ {learner.name ? 'Edit Name' : 'Set Your Name'}</span>
          </button>
          <button
            onClick={clearSampleData}
            className="px-3 py-1.5 text-xs font-semibold bg-[#131130] hover:bg-[#1c1845] text-slate-300 border border-violet-900/40 rounded-xl transition-colors shadow-xs"
          >
            Clear Sample Data
          </button>
          <button
            onClick={loadSampleLearnerProfile}
            className="px-3 py-1.5 text-xs font-semibold bg-[#131130] hover:bg-[#1c1845] text-slate-300 border border-violet-900/40 rounded-xl transition-colors shadow-xs"
          >
            Preload Sample History
          </button>
          <button
            onClick={resetLearnerProfile}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-xl transition-colors shadow-xs"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Primary Learner Card */}
      <div className="bg-[#0d0b21]/80 backdrop-blur-md rounded-2xl border border-violet-900/30 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-violet-600/30 ring-1 ring-white/20">
            {learner.name ? learner.name.charAt(0).toUpperCase() : <UserCheck className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {learner.name || 'Anonymous Student'}
              </h3>
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium underline"
              >
                {learner.name ? 'Change' : 'Set Name'}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Tier: {learner.currentDifficultyLevel}
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {learner.streakDays} Day Streak
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {learner.hasSampleData ? 'Displaying sample demonstration profile' : 'Real learner metrics active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-violet-900/30 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-around md:justify-start">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-white">{learner.accuracyPct}%</span>
            <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Overall Accuracy</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-extrabold text-white">{learner.totalQuizzesTaken}</span>
            <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Quizzes Taken</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-extrabold text-white">
              {learner.totalQuestionsCorrect}/{learner.totalQuestionsAnswered}
            </span>
            <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Questions Correct</p>
          </div>
        </div>
      </div>

      {/* Two Column Mastery & Needs Improvement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mastered Topics */}
        <div className="bg-[#0d0b21]/80 backdrop-blur-md rounded-2xl border border-violet-900/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Mastered Topics (≥75% Accuracy)</h3>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {learner.masteredTopics.length} Mastered
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Strong foundational understanding demonstrated across multiple quiz attempts. Only periodic maintenance review required.
          </p>

          <div className="space-y-2.5 mt-2">
            {learner.masteredTopics.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-4 text-center">
                No topics mastered yet. Complete adaptive quizzes with ≥75% accuracy to master concepts!
              </div>
            ) : (
              learner.masteredTopics.map((topic) => (
                <div
                  key={topic}
                  className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-emerald-200">{topic}</span>
                  <span className="font-semibold text-emerald-300">
                    {learner.topicScores[topic]?.percentage || 80}% Accuracy
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weak Topics Needing Revision */}
        <div className="bg-[#0d0b21]/80 backdrop-blur-md rounded-2xl border border-violet-900/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Needs Revision (&lt;60% Accuracy)</h3>
            </div>
            <span className="text-xs font-bold text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
              {learner.weakTopics.length} Focus Areas
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Targeted for immediate reinforcement in your next AI tutoring sessions and adaptive practice plan.
          </p>

          <div className="space-y-2.5 mt-2">
            {learner.weakTopics.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-4 text-center">
                No critical weak areas identified! Great work!
              </div>
            ) : (
              learner.weakTopics.map((topic) => (
                <div
                  key={topic}
                  className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-rose-200">{topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-300">
                      {learner.topicScores[topic]?.percentage || 33}% Accuracy
                    </span>
                    <button
                      onClick={() => onNavigateTab('tutor')}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[10px] transition-colors shadow-xs"
                    >
                      Ask Tutor &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quiz History Log */}
      <div className="bg-[#0d0b21]/80 backdrop-blur-md rounded-2xl border border-violet-900/30 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Completed Quiz History</h3>
            <p className="text-xs text-slate-400">
              Historical record of test sessions and adaptive performance ratings
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('quiz')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/30 flex items-center gap-1.5"
          >
            <span>Take New Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-violet-950/80 text-violet-400/80 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Subject / Document</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Topics Covered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-950/50">
              {learner.quizHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    No quizzes taken yet. Generate an adaptive quiz to start building your record!
                  </td>
                </tr>
              ) : (
                learner.quizHistory.map((q) => (
                  <tr key={q.id} className="hover:bg-violet-950/30 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(q.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-200">{q.docTitle}</span>
                        {q.isSampleData && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold text-[9px] border border-amber-500/30">
                            DEMO SAMPLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        q.difficulty === 'easy'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : q.difficulty === 'medium'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {q.score} / {q.totalQuestions}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${
                        q.percentage >= 75 ? 'text-emerald-400' : q.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {q.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {Object.keys(q.topicPerformance).join(', ') || 'General Concepts'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
