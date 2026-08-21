import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Layers,
  History as HistoryIcon,
  BarChart3,
  Volume2,
  VolumeX,
  PlusCircle,
  Flame,
  Award
} from 'lucide-react';
import { sound } from '../services/sound';
import { storage } from '../services/storage';

interface NavbarProps {
  currentView: 'generator' | 'player' | 'results' | 'flashcards' | 'history' | 'stats';
  onNavigate: (view: 'generator' | 'flashcards' | 'history' | 'stats') => void;
  hasActiveQuiz: boolean;
  onReturnToQuiz?: () => void;
  onNewQuiz: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  hasActiveQuiz,
  onReturnToQuiz,
  onNewQuiz,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [stats, setStats] = useState(storage.getUserStats());

  useEffect(() => {
    // Refresh stats
    setStats(storage.getUserStats());
  }, [currentView]);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={onNewQuiz}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400 group-hover:text-pink-400 transition-colors" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                QuizMind
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Instant Smart Quizzes on Any Topic</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onNavigate('generator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'generator'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Create Quiz
          </button>

          {hasActiveQuiz && (
            <button
              onClick={onReturnToQuiz}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'player'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 border border-purple-800/50'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Active Quiz
            </button>
          )}

          <button
            onClick={() => onNavigate('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Flashcards
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'history'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HistoryIcon className="w-4 h-4" />
            My Quizzes
          </button>

          <button
            onClick={() => onNavigate('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'stats'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Streak & Points Badge */}
          {stats.totalPoints > 0 && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.totalPoints.toLocaleString()} pts</span>
              {stats.bestStreak > 1 && (
                <span className="flex items-center gap-0.5 text-orange-400 ml-1 border-l border-amber-500/30 pl-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  {stats.bestStreak}x streak
                </span>
              )}
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors"
            aria-label="Toggle sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* New Quiz Primary CTA */}
          <button
            onClick={onNewQuiz}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Quiz</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/95 py-2 px-3">
        <button
          onClick={() => onNavigate('generator')}
          className={`flex flex-col items-center gap-1 text-xs ${
            currentView === 'generator' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Create</span>
        </button>

        {hasActiveQuiz && (
          <button
            onClick={onReturnToQuiz}
            className={`flex flex-col items-center gap-1 text-xs ${
              currentView === 'player' ? 'text-purple-400 font-semibold' : 'text-purple-300'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Active</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('flashcards')}
          className={`flex flex-col items-center gap-1 text-xs ${
            currentView === 'flashcards' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Flashcards</span>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center gap-1 text-xs ${
            currentView === 'history' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <HistoryIcon className="w-4 h-4" />
          <span>Quizzes</span>
        </button>

        <button
          onClick={() => onNavigate('stats')}
          className={`flex flex-col items-center gap-1 text-xs ${
            currentView === 'stats' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Stats</span>
        </button>
      </div>
    </header>
  );
};
