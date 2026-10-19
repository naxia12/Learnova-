import React, { useState, useEffect } from 'react';
import { Sparkles, User, X, Check, GraduationCap } from 'lucide-react';
import { useLearner } from '../context/LearnerContext';

export const StudentNameModal: React.FC = () => {
  const { learner, setStudentName, isNameModalOpen, setIsNameModalOpen } = useLearner();
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNameModalOpen) {
      setNameInput(learner.name || '');
      setError(null);
    }
  }, [isNameModalOpen, learner.name]);

  if (!isNameModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Please enter a name or click "Continue as Guest".');
      return;
    }
    setStudentName(trimmed);
    setIsNameModalOpen(false);
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('studymate_name_prompt_dismissed', 'true');
    } catch (e) {}
    setIsNameModalOpen(false);
  };

  const isEditing = Boolean(learner.name);

  return (
    <div className="fixed inset-0 z-50 bg-[#060411]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#120f30] rounded-3xl max-w-md w-full p-7 shadow-2xl border border-violet-500/30 text-left space-y-5 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10">
        {/* Header icon & badge */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-violet-950/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title and prompt */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Personalize Your Study Experience
          </span>
          <h3 className="text-xl font-extrabold text-white mt-1">
            {isEditing ? 'Edit Your Student Name' : 'Welcome to Learnova AI! What should we call you?'}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Your name will be used across your AI tutor chats, adaptive study plans, and learning progress cards. No login or password required.
          </p>
        </div>

        {/* Form input */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="student-name-input" className="block text-xs font-bold text-slate-300 mb-1.5">
              Student / Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="student-name-input"
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., Sarah, Maya, Jordan..."
                maxLength={40}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a081a] border border-violet-800/50 rounded-xl text-sm font-semibold text-white focus:bg-[#0e0c24] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:font-normal placeholder:text-slate-500"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-violet-950/60 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Continue as Guest'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Start Learning'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
