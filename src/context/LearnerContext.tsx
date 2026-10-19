import React, { createContext, useContext, useState, useEffect } from 'react';
import { LearnerProfile, QuizResult, StudyPlan, StudyPlanTask } from '../types';

interface LearnerContextType {
  learner: LearnerProfile;
  setStudentName: (name: string) => void;
  isNameModalOpen: boolean;
  setIsNameModalOpen: (open: boolean) => void;
  selectedDocIds: string[];
  setSelectedDocIds: (ids: string[]) => void;
  toggleDocSelection: (id: string) => void;
  selectAllDocs: (ids: string[]) => void;
  updateProfileWithQuizResult: (result: QuizResult) => void;
  activeStudyPlan: StudyPlan | null;
  setActiveStudyPlan: (plan: StudyPlan | null) => void;
  toggleTaskCompletion: (dayNumber: number, taskId: string) => void;
  activeTourStep: number;
  setActiveTourStep: (step: number) => void;
  completedTourSteps: number[];
  markTourStepCompleted: (step: number) => void;
  resetLearnerProfile: () => void;
  loadSampleLearnerProfile: () => void;
  clearSampleData: () => void;
}

// Sample Demonstration Quizzes for initial preview and demonstration
const SAMPLE_DEMO_QUIZZES: QuizResult[] = [
  {
    id: 'sample-quiz-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
    score: 4,
    totalQuestions: 4,
    percentage: 100,
    difficulty: 'easy',
    topicPerformance: { 'Glycolysis': { correct: 4, total: 4 } },
    isSampleData: true,
  },
  {
    id: 'sample-quiz-2',
    date: new Date(Date.now() - 86400000).toISOString(),
    docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
    score: 1,
    totalQuestions: 4,
    percentage: 25,
    difficulty: 'medium',
    topicPerformance: { 'Electron Transport Chain': { correct: 1, total: 4 } },
    isSampleData: true,
  },
  {
    id: 'sample-quiz-3',
    date: new Date().toISOString(),
    docTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
    score: 3,
    totalQuestions: 4,
    percentage: 75,
    difficulty: 'medium',
    topicPerformance: { 'Attention Mechanisms': { correct: 3, total: 4 } },
    isSampleData: true,
  }
];

const INITIAL_PROFILE: LearnerProfile = {
  name: '', // Empty until student enters their name
  streakDays: 4,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalQuizzesTaken: 3,
  totalQuestionsAnswered: 12,
  totalQuestionsCorrect: 8,
  accuracyPct: 67,
  currentDifficultyLevel: 'Intermediate',
  masteredTopics: ['Glycolysis'],
  weakTopics: ['Electron Transport Chain', 'Attention Mechanisms'],
  topicScores: {
    'Glycolysis': { correct: 4, total: 4, percentage: 100 },
    'Electron Transport Chain': { correct: 1, total: 3, percentage: 33 },
    'Attention Mechanisms': { correct: 1, total: 3, percentage: 33 },
    'Industrial Revolution': { correct: 2, total: 2, percentage: 100 },
  },
  quizHistory: SAMPLE_DEMO_QUIZZES,
  hasSampleData: true,
};

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent student name from dedicated localStorage key or profile
  const [studentName, setStudentNameState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('studymate_student_name');
      if (stored && stored !== 'Alex Chen') return stored.trim();
    } catch (e) {}
    return '';
  });

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(() => {
    // Open on first visit if no name is set and not explicitly dismissed
    try {
      const stored = localStorage.getItem('studymate_student_name');
      const dismissed = localStorage.getItem('studymate_name_prompt_dismissed');
      if ((!stored || stored === 'Alex Chen') && !dismissed) {
        return true;
      }
    } catch (e) {}
    return false;
  });

  const [learner, setLearner] = useState<LearnerProfile>(() => {
    try {
      const saved = localStorage.getItem('studymate_learner_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy fictional names
        let cleanName = parsed.name === 'Alex Chen' || parsed.name === 'Student Learner' ? '' : (parsed.name || '');
        const storedName = localStorage.getItem('studymate_student_name');
        if (storedName && storedName !== 'Alex Chen') cleanName = storedName;

        return {
          ...parsed,
          name: cleanName,
        };
      }
    } catch (e) {}
    return INITIAL_PROFILE;
  });

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(['sample-bio-101', 'sample-cs-transformer']);

  const [activeStudyPlan, setActiveStudyPlan] = useState<StudyPlan | null>(() => {
    try {
      const saved = localStorage.getItem('studymate_active_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [activeTourStep, setActiveTourStep] = useState<number>(1);
  const [completedTourSteps, setCompletedTourSteps] = useState<number[]>([1]);

  // Keep learner.name in sync with studentName
  useEffect(() => {
    if (studentName && learner.name !== studentName) {
      setLearner((prev) => ({ ...prev, name: studentName }));
    }
  }, [studentName]);

  // Persist learner profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studymate_learner_profile', JSON.stringify(learner));
    } catch (e) {}
  }, [learner]);

  // Persist active study plan
  useEffect(() => {
    if (activeStudyPlan) {
      try {
        localStorage.setItem('studymate_active_plan', JSON.stringify(activeStudyPlan));
      } catch (e) {}
    }
  }, [activeStudyPlan]);

  const setStudentName = (name: string) => {
    const trimmed = name.trim();
    setStudentNameState(trimmed);
    setLearner((prev) => ({ ...prev, name: trimmed }));
    try {
      localStorage.setItem('studymate_student_name', trimmed);
      localStorage.setItem('studymate_name_prompt_dismissed', 'true');
    } catch (e) {}
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAllDocs = (ids: string[]) => {
    setSelectedDocIds(ids);
  };

  const markTourStepCompleted = (step: number) => {
    setCompletedTourSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    if (step < 7) {
      setActiveTourStep(step + 1);
    }
  };

  const updateProfileWithQuizResult = (result: QuizResult) => {
    setLearner((prev) => {
      const newTotalQuizzes = prev.totalQuizzesTaken + 1;
      const newTotalAnswered = prev.totalQuestionsAnswered + result.totalQuestions;
      const newTotalCorrect = prev.totalQuestionsCorrect + result.score;
      const newAccuracy = Math.round((newTotalCorrect / newTotalAnswered) * 100);

      // Recalculate topic scores
      const updatedTopicScores = { ...prev.topicScores };
      for (const [topic, perf] of Object.entries(result.topicPerformance)) {
        if (!updatedTopicScores[topic]) {
          updatedTopicScores[topic] = {
            correct: perf.correct,
            total: perf.total,
            percentage: Math.round((perf.correct / perf.total) * 100)
          };
        } else {
          const c = updatedTopicScores[topic].correct + perf.correct;
          const t = updatedTopicScores[topic].total + perf.total;
          updatedTopicScores[topic] = {
            correct: c,
            total: t,
            percentage: Math.round((c / t) * 100),
          };
        }
      }

      const mastered: string[] = [];
      const weak: string[] = [];

      for (const [topic, score] of Object.entries(updatedTopicScores)) {
        if (score.percentage >= 75 && score.total >= 2) {
          mastered.push(topic);
        } else if (score.percentage < 60) {
          weak.push(topic);
        }
      }

      // Adaptive difficulty calculation
      let newLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery' = prev.currentDifficultyLevel;
      if (newAccuracy >= 85 && newTotalAnswered >= 10) {
        newLevel = 'Mastery';
      } else if (newAccuracy >= 75) {
        newLevel = 'Advanced';
      } else if (newAccuracy >= 55) {
        newLevel = 'Intermediate';
      } else {
        newLevel = 'Beginner';
      }

      return {
        ...prev,
        totalQuizzesTaken: newTotalQuizzes,
        totalQuestionsAnswered: newTotalAnswered,
        totalQuestionsCorrect: newTotalCorrect,
        accuracyPct: newAccuracy,
        currentDifficultyLevel: newLevel,
        masteredTopics: mastered,
        weakTopics: weak,
        topicScores: updatedTopicScores,
        quizHistory: [result, ...prev.quizHistory],
        hasSampleData: false, // User now has real completed quiz data!
      };
    });
  };

  const toggleTaskCompletion = (dayNumber: number, taskId: string) => {
    if (!activeStudyPlan) return;
    setActiveStudyPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        dailyPlans: prev.dailyPlans.map((dp) => {
          if (dp.dayNumber !== dayNumber) return dp;
          return {
            ...dp,
            tasks: dp.tasks.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
          };
        }),
      };
    });
  };

  const clearSampleData = () => {
    setLearner((prev) => ({
      name: prev.name, // Preserve user's actual entered name!
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalQuestionsCorrect: 0,
      accuracyPct: 0,
      currentDifficultyLevel: 'Beginner',
      masteredTopics: [],
      weakTopics: [],
      topicScores: {},
      quizHistory: [],
      hasSampleData: false,
    }));
  };

  const resetLearnerProfile = () => {
    setLearner({
      name: studentName || '',
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalQuestionsCorrect: 0,
      accuracyPct: 0,
      currentDifficultyLevel: 'Beginner',
      masteredTopics: [],
      weakTopics: [],
      topicScores: {},
      quizHistory: [],
      hasSampleData: false,
    });
    localStorage.removeItem('studymate_learner_profile');
    localStorage.removeItem('studymate_active_plan');
    setActiveStudyPlan(null);
  };

  const loadSampleLearnerProfile = () => {
    setLearner({
      ...INITIAL_PROFILE,
      name: studentName || '', // Keep student's actual name!
    });
    localStorage.setItem(
      'studymate_learner_profile',
      JSON.stringify({
        ...INITIAL_PROFILE,
        name: studentName || '',
      })
    );
  };

  return (
    <LearnerContext.Provider
      value={{
        learner,
        setStudentName,
        isNameModalOpen,
        setIsNameModalOpen,
        selectedDocIds,
        setSelectedDocIds,
        toggleDocSelection,
        selectAllDocs,
        updateProfileWithQuizResult,
        activeStudyPlan,
        setActiveStudyPlan,
        toggleTaskCompletion,
        activeTourStep,
        setActiveTourStep,
        completedTourSteps,
        markTourStepCompleted,
        resetLearnerProfile,
        loadSampleLearnerProfile,
        clearSampleData,
      }}
    >
      {children}
    </LearnerContext.Provider>
  );
};

export const useLearner = () => {
  const ctx = useContext(LearnerContext);
  if (!ctx) throw new Error('useLearner must be used within LearnerProvider');
  return ctx;
};
