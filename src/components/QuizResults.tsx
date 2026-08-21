import React, { useState, useEffect } from 'react';
import { Quiz, QuizResult, QuizQuestion } from '../types/quiz';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  RotateCcw,
  Layers,
  Share2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Filter
} from 'lucide-react';
import { storage } from '../services/storage';
import { sound } from '../services/sound';
import { ExportModal } from './ExportModal';
import { AITutorModal } from './AITutorModal';

interface QuizResultsProps {
  quiz: Quiz;
  result: QuizResult;
  onRetakeAll: () => void;
  onRetakeIncorrect: (incorrectQuestions: QuizQuestion[]) => void;
  onStudyFlashcards: () => void;
  onNewQuiz: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  result,
  onRetakeAll,
  onRetakeIncorrect,
  onStudyFlashcards,
  onNewQuiz,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [isSaved, setIsSaved] = useState(storage.isQuizSaved(quiz.id));
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTutorQuestion, setActiveTutorQuestion] = useState<QuizQuestion | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Trigger confetti celebration on mount
  useEffect(() => {
    if (result.percentage >= 60) {
      confetti({
        particleCount: result.percentage >= 90 ? 120 : 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'],
      });
    }

    // Auto save result into history
    storage.saveQuizResult(quiz, result);
  }, []);

  const handleToggleSave = () => {
    if (isSaved) {
      storage.removeSavedQuiz(quiz.id);
      setIsSaved(false);
    } else {
      storage.saveQuiz(quiz);
      setIsSaved(true);
      sound.playLifeline();
    }
  };

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Find incorrect questions
  const incorrectQuestions = quiz.questions.filter(
    (q) => !result.answers[q.id] || !result.answers[q.id].isCorrect
  );

  const filteredQuestions = quiz.questions.filter((q) => {
    const isCorrect = result.answers[q.id]?.isCorrect;
    if (filter === 'correct') return isCorrect;
    if (filter === 'incorrect') return !isCorrect;
    return true;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S+':
        return 'from-amber-400 via-pink-500 to-purple-500 text-amber-300';
      case 'A+':
        return 'from-emerald-400 to-teal-500 text-emerald-300';
      case 'B':
        return 'from-blue-400 to-indigo-500 text-blue-300';
      case 'C':
        return 'from-amber-400 to-orange-500 text-amber-300';
      default:
        return 'from-rose-400 to-red-500 text-rose-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Hero Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left: Summary and Grade */}
          <div className="text-center md:text-left space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Quiz Performance Report
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              {quiz.title}
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              {result.performanceFeedback}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button
                onClick={handleToggleSave}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isSaved
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-amber-400" />
                    Saved to My Quizzes
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Save to My Quizzes
                  </>
                )}
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                Export & Print
              </button>
            </div>
          </div>

          {/* Right: Radial Score & Grade Badge */}
          <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 min-w-[200px] shadow-inner text-center">
            <div className="relative flex items-center justify-center">
              {/* Grade Letter */}
              <div className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                {result.grade}
              </div>
            </div>
            
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              {result.percentage}%
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {result.correctCount} of {result.totalQuestions} Correct
            </p>
            <div className="mt-3 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold border border-amber-500/20">
              +{result.score} Total Points
            </div>
          </div>

        </div>

        {/* Stats Metrics Grid */}
        <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Accuracy</span>
            </div>
            <p className="text-xl font-bold text-white">{result.percentage}%</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Time Spent</span>
            </div>
            <p className="text-xl font-bold text-white">{formatTime(result.timeSpentTotalSeconds)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Best Streak</span>
            </div>
            <p className="text-xl font-bold text-white">{result.streakRecord}x in a row</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Difficulty</span>
            </div>
            <p className="text-xl font-bold text-white capitalize">{result.difficulty}</p>
          </div>

        </div>

      </div>

      {/* Action CTA Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRetakeAll}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-sm font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>

          {incorrectQuestions.length > 0 && (
            <button
              onClick={() => onRetakeIncorrect(incorrectQuestions)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-sm font-semibold transition-all"
            >
              <Award className="w-4 h-4 text-purple-400" />
              Practice Missed ({incorrectQuestions.length})
            </button>
          )}

          <button
            onClick={onStudyFlashcards}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-sm font-semibold transition-all"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Study as Flashcards
          </button>
        </div>

        <button
          onClick={onNewQuiz}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quiz
        </button>
      </div>

      {/* Detailed Question Review Section */}
      <div className="space-y-4">
        
        {/* Section Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Question Breakdown & Review</h2>
            <p className="text-xs text-slate-400">
              Inspect answer explanations and chat with AI Tutor for any question
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({quiz.questions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correct ({result.correctCount})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'incorrect'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Incorrect ({incorrectQuestions.length})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const answer = result.answers[q.id];
            const isCorrect = answer?.isCorrect;
            const isExpanded = expandedQuestions[q.id] !== false; // Default expanded

            const getUserAnswerDisplay = () => {
              if (!answer) return 'Not answered (timed out)';
              if (answer.selectedOptionIndex !== undefined && q.options) {
                return `${String.fromCharCode(65 + answer.selectedOptionIndex)}) ${
                  q.options[answer.selectedOptionIndex]
                }`;
              }
              if (answer.selectedOptionIndices && q.options) {
                return answer.selectedOptionIndices
                  .map((i) => `${String.fromCharCode(65 + i)}) ${q.options[i]}`)
                  .join(', ');
              }
              if (answer.textAnswer) {
                return answer.textAnswer;
              }
              return 'No answer selected';
            };

            const getCorrectAnswerDisplay = () => {
              if (q.type === 'multiple_choice' || q.type === 'true_false') {
                return `${String.fromCharCode(65 + q.correctOptionIndex)}) ${
                  q.options[q.correctOptionIndex]
                }`;
              }
              if (q.type === 'multiple_select' && q.correctIndices) {
                return q.correctIndices
                  .map((i) => `${String.fromCharCode(65 + i)}) ${q.options[i]}`)
                  .join(', ');
              }
              if (q.type === 'fill_blank' && q.acceptedAnswers) {
                return q.acceptedAnswers.join(' / ');
              }
              return 'Correct answer';
            };

            return (
              <div
                key={q.id}
                className={`rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : 'bg-slate-900/90 border-red-500/30'
                }`}
              >
                {/* Question Header Card */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">
                          Q{idx + 1}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        {q.question}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTutorQuestion(q);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium transition-all"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">AI Tutor</span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3.5 border-t border-slate-800/80 text-xs sm:text-sm">
                    
                    {/* Answers Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <div
                        className={`p-3 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                            : 'bg-red-950/30 border-red-500/30 text-red-200'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Your Answer:
                        </p>
                        <p className="font-semibold">{getUserAnswerDisplay()}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                          Correct Answer:
                        </p>
                        <p className="font-semibold">{getCorrectAnswerDisplay()}</p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300 leading-relaxed">
                      <strong className="text-white block mb-1">💡 Detailed Explanation:</strong>
                      {q.explanation}
                    </div>

                    {/* Key Takeaway */}
                    {q.keyTakeaway && (
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 leading-relaxed">
                        <span className="font-bold text-indigo-300">🎯 Key Concept: </span>
                        {q.keyTakeaway}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal quiz={quiz} onClose={() => setShowExportModal(false)} />
      )}

      {/* AI Tutor Modal */}
      {activeTutorQuestion && (
        <AITutorModal
          question={activeTutorQuestion}
          selectedAnswerText={
            result.answers[activeTutorQuestion.id]?.selectedOptionIndex !== undefined &&
            activeTutorQuestion.options
              ? activeTutorQuestion.options[
                  result.answers[activeTutorQuestion.id]!.selectedOptionIndex!
                ]
              : undefined
          }
          topic={quiz.topic}
          onClose={() => setActiveTutorQuestion(null)}
        />
      )}

    </div>
  );
};
