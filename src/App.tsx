import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { GuidedTourBanner } from './components/GuidedTourBanner';
import { DashboardView } from './components/DashboardView';
import { MaterialsView } from './components/MaterialsView';
import { TutorView } from './components/TutorView';
import { KnowledgeGalaxyView } from './components/KnowledgeGalaxyView';
import { LearningInsightsView } from './components/LearningInsightsView';
import { QuizView } from './components/QuizView';
import { LearnerProfileView } from './components/LearnerProfileView';
import { StudyPlanView } from './components/StudyPlanView';
import { EvaluationView } from './components/EvaluationView';
import { StudentNameModal } from './components/StudentNameModal';
import { LearnerProvider, useLearner } from './context/LearnerContext';
import { api } from './services/api';
import { StudyDocumentMeta } from './types';
import {
  Menu,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  ChevronRight,
  Zap,
  Network,
  BarChart3
} from 'lucide-react';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [documents, setDocuments] = useState<StudyDocumentMeta[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { learner, selectedDocIds, setIsNameModalOpen } = useLearner();

  const loadDocs = async () => {
    try {
      setLoadingDocs(true);
      const res = await api.getDocuments();
      setDocuments(res.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'tutor':
        return 'AI Study Room';
      case 'galaxy':
        return 'Knowledge Galaxy';
      case 'insights':
        return 'Learning Insights';
      case 'plan':
        return 'Study Planner';
      case 'quiz':
        return 'Adaptive Quiz Arena';
      case 'materials':
        return 'Study Materials Library';
      case 'profile':
        return 'Learner Cognitive Model';
      case 'eval':
        return 'Evaluation & RAGAS Benchmarks';
      default:
        return 'Workspace';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a081a] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* 1. Feature Tour Banner */}
      <GuidedTourBanner onNavigateTab={handleSelectTab} />

      {/* 2. Main Layout with Responsive Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            documentCount={documents.length}
          />
        </div>

        {/* Mobile Header / Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 bg-[#0d0b21] h-full shadow-2xl flex flex-col border-r border-violet-900/40">
              <div className="p-4 flex items-center justify-between border-b border-violet-950/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-white text-base">Learnova AI</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-violet-950/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar
                currentTab={currentTab}
                onSelectTab={handleSelectTab}
                documentCount={documents.length}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gradient-to-b from-[#0e0c24] via-[#0a081a] to-[#070514]">
          {/* Top Navigation Bar */}
          <header className="bg-[#0e0c24]/90 backdrop-blur-xl border-b border-violet-900/30 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-violet-300 hover:text-white hover:bg-violet-950/60 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  Learnova
                </span>
                <span className="text-violet-800">/</span>
                <span className="text-sm font-bold text-white capitalize">
                  {getTabTitle()}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span>Adaptive Engine Active</span>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-violet-900/40">
                {learner.name ? (
                  <button
                    onClick={() => setIsNameModalOpen(true)}
                    className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity group"
                    title="Click to edit your student name"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-violet-900/40 ring-1 ring-violet-400/40 group-hover:ring-2">
                      {learner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left text-xs">
                      <div className="font-bold text-white leading-tight flex items-center gap-1">
                        <span>{learner.name}</span>
                        <span className="text-[10px] text-violet-400">✏️</span>
                      </div>
                      <div className="text-[10px] text-violet-400 font-mono">{learner.currentDifficultyLevel} Tier</div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsNameModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-900/40 transition-all flex items-center gap-1.5"
                  >
                    <span>👋 Set Student Name</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Tab Content Router */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                documents={documents}
                onSelectTab={handleSelectTab}
              />
            )}

            {currentTab === 'tutor' && (
              <TutorView
                documents={documents}
                onNavigateMaterials={() => handleSelectTab('materials')}
              />
            )}

            {currentTab === 'galaxy' && (
              <KnowledgeGalaxyView
                documents={documents}
                onNavigateTab={handleSelectTab}
              />
            )}

            {currentTab === 'insights' && (
              <LearningInsightsView
                onNavigateTab={handleSelectTab}
              />
            )}

            {currentTab === 'plan' && (
              <StudyPlanView
                onNavigateTab={handleSelectTab}
              />
            )}

            {currentTab === 'quiz' && (
              <QuizView
                documents={documents}
                onNavigateTab={handleSelectTab}
              />
            )}

            {currentTab === 'materials' && (
              <MaterialsView
                documents={documents}
                onRefreshDocs={loadDocs}
                onNavigateTutor={() => handleSelectTab('tutor')}
              />
            )}

            {currentTab === 'profile' && (
              <LearnerProfileView
                onNavigateTab={handleSelectTab}
              />
            )}

            {currentTab === 'eval' && (
              <EvaluationView />
            )}
          </div>
        </main>
      </div>

      {/* Welcoming Student Name Modal */}
      <StudentNameModal />
    </div>
  );
}

export default function App() {
  return (
    <LearnerProvider>
      <MainApp />
    </LearnerProvider>
  );
}
