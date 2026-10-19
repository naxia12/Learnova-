import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquareQuote,
  Sparkles,
  UserCheck,
  CalendarCheck2,
  CheckCircle2,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Layers,
  GraduationCap,
  Network,
  BarChart3,
  Flame,
  Zap
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';

export type NavTab = 'dashboard' | 'materials' | 'tutor' | 'galaxy' | 'quiz' | 'insights' | 'plan' | 'eval' | 'profile';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  documentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, documentCount }) => {
  const { learner, selectedDocIds } = useLearner();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Command Center & Highlights'
    },
    {
      id: 'tutor' as NavTab,
      label: 'AI Study Room',
      icon: MessageSquareQuote,
      badge: 'Grounded',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      description: 'Conversational Source-Cited Tutor'
    },
    {
      id: 'galaxy' as NavTab,
      label: 'Knowledge Galaxy',
      icon: Network,
      badge: 'Concept Map',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      description: 'Interactive Topology & Links'
    },
    {
      id: 'insights' as NavTab,
      label: 'Learning Insights',
      icon: BarChart3,
      badge: `${learner.accuracyPct}% Acc`,
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      description: 'Topic Mastery & Analytics'
    },
    {
      id: 'plan' as NavTab,
      label: 'Study Planner',
      icon: CalendarCheck2,
      badge: 'Adaptive',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      description: 'Weekly Milestones & Goals'
    },
    {
      id: 'quiz' as NavTab,
      label: 'Adaptive Quiz Arena',
      icon: Sparkles,
      badge: learner.currentDifficultyLevel,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Real-Time Dynamic Difficulty'
    },
    {
      id: 'materials' as NavTab,
      label: 'Study Materials',
      icon: BookOpen,
      badge: `${documentCount} docs`,
      badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
      description: 'PDFs, Slides & Notes'
    },
    {
      id: 'eval' as NavTab,
      label: 'Evaluation & Benchmarks',
      icon: ShieldCheck,
      badge: 'RAG Eval',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      description: 'RAG Faithfulness & Metrics'
    },
    {
      id: 'profile' as NavTab,
      label: 'Cognitive Model',
      icon: UserCheck,
      badge: learner.name ? learner.name.split(' ')[0] : 'Learner',
      badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
      description: 'Mastery Profile & Calibration'
    },
  ];

  return (
    <aside className="w-72 bg-[#0d0b21] border-r border-violet-900/30 flex flex-col shrink-0 h-screen sticky top-0 text-slate-100 select-none shadow-2xl z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-violet-950/80 bg-gradient-to-b from-[#13102f] to-[#0d0b21]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">Learnova</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold tracking-wider bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-md shadow-xs">
                AI
              </span>
            </div>
            <p className="text-[10px] font-medium text-violet-300/80 truncate">Understand Better. Learn Smarter.</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-violet-400/80 uppercase tracking-wider flex items-center justify-between">
          <span>Core Experiences</span>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-transparent text-white font-semibold shadow-inner border border-violet-500/40 glow-violet'
                  : 'text-slate-400 hover:bg-violet-950/30 hover:text-white font-medium border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-violet-400 to-indigo-400 rounded-r-full shadow-[0_0_12px_#a78bfa]" />
              )}
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/40'
                  : 'bg-slate-900/60 text-slate-400 group-hover:text-violet-300 group-hover:bg-violet-950/60'
              }`}>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Active Knowledge Footprint & Status Card */}
      <div className="p-3.5 border-t border-violet-950/80 bg-[#090818]/90">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-200">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span>Knowledge Scope</span>
          </div>
          <span className="text-[10px] font-bold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded-md border border-violet-800/40">
            {selectedDocIds.length} Active Docs
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
          Grounded strictly to your selected materials to guarantee zero hallucinations.
        </p>

        {/* Learner Level Micro-badge */}
        <div className="bg-[#131130] rounded-xl p-2.5 border border-violet-900/30 flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-violet-400/80">Adaptive Tier</div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{learner.currentDifficultyLevel}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase font-bold tracking-wider text-violet-400/80">Active Streak</div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1 justify-end">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{learner.streakDays} Days</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
