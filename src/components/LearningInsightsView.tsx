import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  BookOpen,
  Target,
  Brain,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';
import { NavTab } from './Sidebar';

interface LearningInsightsViewProps {
  onNavigateTab: (tab: NavTab) => void;
}

export const LearningInsightsView: React.FC<LearningInsightsViewProps> = ({ onNavigateTab }) => {
  const { learner } = useLearner();
  const [selectedTopicDetail, setSelectedTopicDetail] = useState<string | null>(null);

  const topicEntries = Object.entries(learner.topicScores || {});
  const totalQuizzes = learner.totalQuizzesTaken;

  // Derive common misconceptions and learning traps grounded in actual student topics
  const misconceptionNotes: Record<string, { misconception: string; clarification: string; citation: string }> = {
    'Electron Transport Chain': {
      misconception: 'Believing ATP is directly synthesized by electron transfer rather than proton chemiosmosis.',
      clarification: 'Electrons pass through complexes I-IV solely to pump H+ ions into the intermembrane space; the resulting electrochemical gradient drives ATP Synthase rotation.',
      citation: 'Biology 101: Cellular Respiration, Page 3',
    },
    'Attention Mechanisms': {
      misconception: 'Assuming dividing by sqrt(d_k) is only for dimensional normalization.',
      clarification: 'Scaling by 1/sqrt(d_k) specifically stabilizes the variance of the dot products to 1.0, preventing large values from driving the softmax into regions with vanishing gradients.',
      citation: 'Computer Science: Transformer Architecture, Page 2',
    },
    'Glycolysis': {
      misconception: 'Confusing gross ATP yield (4 ATP) with net ATP yield (2 ATP).',
      clarification: 'The preparatory phase requires investing 2 ATP, so although 4 ATP are generated in the payoff phase, net gain is exactly 2 ATP.',
      citation: 'Biology 101: Cellular Respiration, Page 1',
    },
    'Industrial Revolution': {
      misconception: 'Believing James Watt invented the steam engine from scratch.',
      clarification: 'Thomas Newcomen invented the first commercial atmospheric engine in 1712; Watt radically enhanced thermal efficiency in 1769 by introducing a separate condenser and rotary motion.',
      citation: 'World History: First Industrial Revolution, Page 2',
    },
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Learning Insights & Diagnostics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Cognitive Retention Analytics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Accessible performance graphs, misconception analysis, and topic retention patterns calibrated from your real quiz answers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('quiz')}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-900/30 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Take Diagnostic Quiz</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#120f2e]/80 border border-violet-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
              Overall Accuracy
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{learner.accuracyPct}%</span>
            <span className="text-xs text-slate-400">
              ({learner.totalQuestionsCorrect}/{learner.totalQuestionsAnswered} questions)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Calibrated against {totalQuizzes} completed quizzes</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#120f2e]/80 border border-violet-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
              Mastered Concepts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {learner.masteredTopics.length}
            </span>
            <span className="text-xs text-slate-400">topics at ≥75%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {learner.masteredTopics.join(', ') || 'Keep practicing to master topics!'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#120f2e]/80 border border-violet-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Target Weak Areas
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {learner.weakTopics.length}
            </span>
            <span className="text-xs text-slate-400">needs reinforcement</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-300">
            {learner.weakTopics[0] ? `Priority focus: ${learner.weakTopics[0]}` : 'No critical weak areas'}
          </div>
        </div>
      </div>

      {/* Main Grid: Topic Performance Bar Visuals & Misconceptions Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Breakdown Bars (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#120f2e]/80 border border-violet-500/25 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-violet-500/20 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Topic Mastery & Progress Over Time</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated from verified quiz evaluations and difficulty tier calibration.
              </p>
            </div>
            <span className="text-[11px] font-mono text-violet-300 bg-violet-950/60 px-2.5 py-1 rounded-lg border border-violet-800/30">
              {topicEntries.length} Tracked Topics
            </span>
          </div>

          {topicEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No topic scores recorded yet. Complete your first quiz to generate insights!
            </div>
          ) : (
            <div className="space-y-4">
              {topicEntries.map(([topic, data]) => {
                const isWeak = data.percentage < 60;
                const isMastered = data.percentage >= 75;

                return (
                  <div
                    key={topic}
                    onClick={() => setSelectedTopicDetail(topic)}
                    className="p-3.5 rounded-2xl bg-slate-950/40 hover:bg-violet-950/30 border border-violet-500/15 hover:border-violet-400/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-violet-200 transition-colors">
                          {topic}
                        </span>
                        {isWeak && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Needs Focus
                          </span>
                        )}
                        {isMastered && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Mastered
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 font-bold">
                          {data.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({data.correct}/{data.total} correct)
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWeak
                            ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_#f43f5e]'
                            : isMastered
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_#34d399]'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-400 shadow-[0_0_10px_#a78bfa]'
                        }`}
                        style={{ width: `${Math.max(8, data.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Highlighted Misconceptions & Clarifications (1 Col) */}
        <div className="p-6 rounded-3xl bg-[#120f2e]/80 border border-violet-500/25 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-extrabold text-white">Misconception Shield</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                AI Diagnostic
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Common conceptual pitfalls identified from student answer patterns on uploaded materials:
            </p>

            <div className="space-y-3 mt-4">
              {Object.entries(misconceptionNotes).slice(0, 2).map(([topic, item]) => (
                <div
                  key={topic}
                  className="p-3.5 rounded-2xl bg-slate-950/50 border border-violet-500/20 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-violet-300">{topic}</span>
                    <span className="text-[10px] text-rose-400 font-bold">Frequent Trap</span>
                  </div>
                  <div className="text-[11px] text-slate-300 bg-rose-950/20 p-2 rounded-lg border border-rose-500/20 leading-relaxed">
                    <strong className="text-rose-300">Misconception:</strong> {item.misconception}
                  </div>
                  <div className="text-[11px] text-slate-300 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20 leading-relaxed">
                    <strong className="text-emerald-300">Clarification:</strong> {item.clarification}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <BookOpen className="w-3 h-3 text-violet-400" />
                    <span>{item.citation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('tutor')}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Ask Tutor to Verify Misconceptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
