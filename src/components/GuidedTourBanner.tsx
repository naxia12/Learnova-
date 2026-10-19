import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronRight,
  Info,
  ExternalLink,
  Award,
  BookOpen,
  MessageSquareQuote,
  Flame,
  X
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';
import { NavTab } from './Sidebar';

interface GuidedTourBannerProps {
  onNavigateTab: (tab: NavTab) => void;
}

export const TOUR_STEPS = [
  {
    step: 1,
    title: 'Dashboard Overview',
    tab: 'dashboard' as NavTab,
    hint: 'Explore the student progress overview, learning streak, and cognitive metrics.',
  },
  {
    step: 2,
    title: 'Select / Upload Materials',
    tab: 'materials' as NavTab,
    hint: 'Review preloaded textbooks (Bio 101, CS Transformers, World History) or upload your own PDF/Notes.',
  },
  {
    step: 3,
    title: 'Ask Source-Grounded Tutor',
    tab: 'tutor' as NavTab,
    hint: 'Ask questions like "What is the net ATP in glycolysis?" and test negative refusal with unanswerable questions.',
  },
  {
    step: 4,
    title: 'Inspect Citations',
    tab: 'tutor' as NavTab,
    hint: 'Click on the citation tags to preview exact excerpt passages and page references.',
  },
  {
    step: 5,
    title: 'Take Adaptive Quiz',
    tab: 'quiz' as NavTab,
    hint: 'Answer 4-choice questions. Watch difficulty adapt in real-time based on your answers.',
  },
  {
    step: 6,
    title: 'Inspect Learner Model',
    tab: 'profile' as NavTab,
    hint: 'Check updated topic mastery, weak areas, accuracy percentage, and difficulty rating.',
  },
  {
    step: 7,
    title: 'Generate Study Plan',
    tab: 'plan' as NavTab,
    hint: 'Create an adaptive multi-day schedule targeting your weak topics, with checkable tasks.',
  },
];

export const GuidedTourBanner: React.FC<GuidedTourBannerProps> = ({ onNavigateTab }) => {
  const { activeTourStep, setActiveTourStep, completedTourSteps, markTourStepCompleted } = useLearner();
  const [isMinimized, setIsMinimized] = useState(false);

  const currentStepData = TOUR_STEPS.find((s) => s.step === activeTourStep) || TOUR_STEPS[0];
  const progressPercent = Math.round((completedTourSteps.length / TOUR_STEPS.length) * 100);

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-indigo-700/50">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="font-bold">Feature Tour:</span>
          <span>
            Step {activeTourStep}/7: {currentStepData.title} ({progressPercent}% Completed)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onNavigateTab(currentStepData.tab);
              setIsMinimized(false);
            }}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-medium text-[11px] transition-colors"
          >
            Expand Demo Guide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Header left */}
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Interactive Feature Walkthrough
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                  {completedTourSteps.length} of 7 steps
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong className="text-white">Step {activeTourStep}: {currentStepData.title}</strong> — {currentStepData.hint}
              </p>
            </div>
          </div>

          {/* Stepper buttons and actions */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => onNavigateTab(currentStepData.tab)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Go to {currentStepData.title}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => markTourStepCompleted(activeTourStep)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Done</span>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Minimize guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[11px]">
          {TOUR_STEPS.map((s) => {
            const isCompleted = completedTourSteps.includes(s.step);
            const isCurrent = activeTourStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => {
                  setActiveTourStep(s.step);
                  onNavigateTab(s.tab);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors text-left shrink-0 ${
                  isCurrent
                    ? 'bg-indigo-600/40 text-white font-bold ring-1 ring-indigo-400'
                    : isCompleted
                    ? 'text-emerald-300 hover:bg-slate-800 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold ${isCurrent ? 'bg-indigo-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                    {s.step}
                  </span>
                )}
                <span className="truncate max-w-[120px]">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
