import React, { useState, useEffect } from 'react';
import { Quiz, QuizHistoryItem, UserStats } from '../types/quiz';
import {
  History as HistoryIcon,
  Bookmark,
  Award,
  Clock,
  CheckCircle2,
  Layers,
  RotateCcw,
  Trash2,
  Flame,
  BarChart3,
  Calendar,
  Sparkles,
  Play
} from 'lucide-react';
import { storage } from '../services/storage';
import { sound } from '../services/sound';

interface QuizHistoryProps {
  onSelectQuizToPlay: (quiz: Quiz) => void;
  onSelectQuizToStudy: (quiz: Quiz) => void;
  onNewQuiz: () => void;
}

export const QuizHistory: React.FC<QuizHistoryProps> = ({
  onSelectQuizToPlay,
  onSelectQuizToStudy,
  onNewQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
  const [stats, setStats] = useState<UserStats>(storage.getUserStats());
  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>(storage.getHistory());
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>(storage.getSavedQuizzes());

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(storage.getUserStats());
    setHistoryItems(storage.getHistory());
    setSavedQuizzes(storage.getSavedQuizzes());
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your quiz history?')) {
      storage.clearHistory();
      refreshData();
      sound.playClick();
    }
  };

  const handleRemoveSaved = (quizId: string) => {
    storage.removeSavedQuiz(quizId);
    refreshData();
    sound.playClick();
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  const overallAccuracy =
    stats.totalQuestionsAnswered > 0
      ? Math.round((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Learning Dashboard & Quizzes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your progress, revisit past tests, and review study materials
          </p>
        </div>

        <button
          onClick={onNewQuiz}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Create New Quiz
        </button>
      </div>

      {/* Global Analytics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Total Points</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">{stats.totalQuizzesTaken} quizzes taken</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Overall Accuracy</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{overallAccuracy}%</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.totalCorrectAnswers} / {stats.totalQuestionsAnswered} correct
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Best Streak</span>
          </div>
          <p className="text-2xl font-black text-orange-400">{stats.bestStreak}x</p>
          <p className="text-[11px] text-slate-500 mt-1">Consecutive correct</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <Bookmark className="w-4 h-4 text-purple-400" />
            <span>Saved Quizzes</span>
          </div>
          <p className="text-2xl font-black text-purple-400">{savedQuizzes.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">In your library</p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HistoryIcon className="w-4 h-4" />
            Completed Quizzes ({historyItems.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved Library ({savedQuizzes.length})
          </button>
        </div>

        {activeTab === 'history' && historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Tab 1: History Items */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
              <HistoryIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No quiz history yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                Generate your first quiz on any topic to test your knowledge and track your stats!
              </p>
              <button
                onClick={onNewQuiz}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                Create First Quiz
              </button>
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase">
                      {item.quiz.topic}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(item.completedAt)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.quiz.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      Score: <strong className="text-white">{item.result.percentage}%</strong> ({item.result.correctCount}/{item.result.totalQuestions})
                    </span>
                    <span>&bull;</span>
                    <span>
                      Grade: <strong className="text-emerald-400">{item.result.grade}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>+{item.result.score} pts</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onSelectQuizToStudy(item.quiz)}
                    title="Study with flashcards"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => onSelectQuizToPlay(item.quiz)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Saved Quizzes */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedQuizzes.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No saved quizzes yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                When you complete or generate a quiz, click the bookmark icon to save it to your library!
              </p>
              <button
                onClick={onNewQuiz}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                Explore Topics
              </button>
            </div>
          ) : (
            savedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold uppercase">
                      {quiz.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      &bull; {quiz.difficulty} &bull; {quiz.questions.length} Questions
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{quiz.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onSelectQuizToStudy(quiz)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Flashcards</span>
                  </button>
                  <button
                    onClick={() => onSelectQuizToPlay(quiz)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Take Quiz</span>
                  </button>
                  <button
                    onClick={() => handleRemoveSaved(quiz.id)}
                    title="Remove from saved"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
