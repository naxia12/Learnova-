import React, { useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Flame,
  AlertCircle,
  Calendar,
  Layers,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useLearner } from '../context/LearnerContext';
import { StudyPlan } from '../types';
import { NavTab } from './Sidebar';

interface StudyPlanViewProps {
  onNavigateTab: (tab: NavTab) => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({ onNavigateTab }) => {
  const {
    learner,
    activeStudyPlan,
    setActiveStudyPlan,
    toggleTaskCompletion,
    selectedDocIds
  } = useLearner();

  const [loading, setLoading] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(activeStudyPlan?.dailyCommitmentMinutes || 30);
  const [learningGoal, setLearningGoal] = useState(
    activeStudyPlan?.targetGoal || 'Master weak topics and prepare for semester exam'
  );
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateStudyPlan({
        weakTopics: learner.weakTopics,
        masteredTopics: learner.masteredTopics,
        accuracyPct: learner.accuracyPct,
        studyMinutesPerDay: selectedMinutes,
        learningGoal,
        selectedDocIds,
      });

      setActiveStudyPlan({
        ...res.plan,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate task completion percentage
  let totalTasks = 0;
  let completedTasks = 0;
  if (activeStudyPlan) {
    for (const day of activeStudyPlan.dailyPlans) {
      for (const t of day.tasks) {
        totalTasks++;
        if (t.completed) completedTasks++;
      }
    }
  }
  const planProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {learner.name ? `${learner.name}’s Study Planner` : 'Weekly Adaptive Study Planner'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Personalized Multi-Day Roadmap
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            AI-calibrated schedule targeting your verified weak topics, reading citations, and daily time commitments.
          </p>
        </div>

        {/* Generate / Refresh button */}
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-900/30 flex items-center gap-2 self-start md:self-auto"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>{activeStudyPlan ? 'Regenerate Adaptive Plan' : 'Generate Weekly Roadmap'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Configuration Bar */}
      <div className="bg-[#120f2e]/85 rounded-3xl border border-violet-500/20 p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 backdrop-blur-md">
        {/* Time Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0 border border-violet-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Daily Study Commitment</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedMinutes(mins)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedMinutes === mins
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40 border border-violet-400'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-violet-500/20'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target Goal Input */}
        <div className="flex-1 w-full md:w-auto">
          <div className="text-xs font-bold text-white mb-1.5">Primary Learning Goal</div>
          <input
            type="text"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            placeholder="e.g. Master cellular respiration and neural networks"
            className="w-full px-3.5 py-2 bg-slate-950/60 border border-violet-500/30 rounded-xl text-xs text-white focus:bg-[#18133b] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-500"
          />
        </div>

        {/* Weak topics targeted badge */}
        <div className="w-full md:w-auto text-left md:text-right shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Targeting Weak Topics</div>
          <div className="text-xs font-bold text-rose-400 mt-0.5">
            {learner.weakTopics.slice(0, 2).join(', ') || 'General Foundations'}
          </div>
        </div>
      </div>

      {/* Plan Content */}
      {activeStudyPlan ? (
        <div className="space-y-6">
          {/* Plan Header Card & Progress */}
          <div className="bg-[#120f2e]/85 rounded-3xl border border-violet-500/20 p-6 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Active Adaptive Roadmap
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {activeStudyPlan.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                  {activeStudyPlan.summary}
                </p>
              </div>

              {/* Progress Ring / Bar */}
              <div className="bg-slate-950/60 border border-violet-500/25 p-3.5 rounded-2xl min-w-[160px] text-center shrink-0">
                <div className="text-xs font-bold text-violet-300">Plan Progress</div>
                <div className="text-2xl font-extrabold text-white mt-0.5">
                  {planProgressPct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {completedTasks} of {totalTasks} Tasks Done
                </div>
              </div>
            </div>

            {/* Recommendations callout */}
            {activeStudyPlan.adaptiveRecommendations && activeStudyPlan.adaptiveRecommendations.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personalized Adaptive Recommendations:</span>
                </div>
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-300 pl-1">
                  {activeStudyPlan.adaptiveRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Daily Schedule Cards */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center justify-between">
              <span>Weekly Schedule Breakdown ({activeStudyPlan.dailyPlans.length} Days)</span>
              <span className="text-[11px] text-slate-400 font-normal">Check off completed sessions to advance progress</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStudyPlan.dailyPlans.map((day) => {
                const dayTasksDone = day.tasks.filter((t) => t.completed).length;
                const isDayComplete = dayTasksDone === day.tasks.length;

                return (
                  <div
                    key={day.dayNumber}
                    className={`rounded-3xl border p-5 space-y-4 transition-all ${
                      isDayComplete
                        ? 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'border-violet-500/20 bg-[#120f2e]/85 hover:border-violet-500/40 shadow-lg'
                    }`}
                  >
                    {/* Day Card Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                          Day {day.dayNumber}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                          {day.dayTitle}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDayComplete
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {dayTasksDone}/{day.tasks.length} Done
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Focus: <strong className="text-violet-200">{day.focusTopic}</strong>
                    </div>

                    {/* Task Checklist */}
                    <div className="space-y-2 pt-1 border-t border-violet-500/15">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskCompletion(day.dayNumber, task.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            task.completed
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                              : 'bg-slate-950/40 border-violet-500/15 hover:border-violet-500/30 text-slate-200'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                              task.completed
                                ? 'text-emerald-400 fill-emerald-400/20'
                                : 'text-slate-600 hover:text-slate-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`leading-relaxed ${task.completed ? 'line-through text-slate-500' : ''}`}>
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {task.durationMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Key Concepts Footer */}
                    {day.keyConcepts && day.keyConcepts.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {day.keyConcepts.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-violet-950/60 text-violet-300 border border-violet-800/30 px-2 py-0.5 rounded-md"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 bg-[#120f2e]/85 rounded-3xl border border-dashed border-violet-500/25 p-8 max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center mx-auto shadow-inner">
            <CalendarCheck2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Active Study Roadmap Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Generate a personalized schedule calibrated to your current weak areas, daily available minutes, and target goal.
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-900/40 transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Adaptive Study Roadmap</span>
          </button>
        </div>
      )}
    </div>
  );
};
