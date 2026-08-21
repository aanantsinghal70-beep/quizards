import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../types/quiz';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Lightbulb,
  Sparkles,
  Bot,
  ArrowLeft,
  Flame,
  Award
} from 'lucide-react';
import { sound } from '../services/sound';
import { AITutorModal } from './AITutorModal';

interface FlashcardModeProps {
  quiz: Quiz;
  onExit: () => void;
  onStartQuiz: () => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({ quiz, onExit, onStartQuiz }) => {
  const [cards, setCards] = useState<QuizQuestion[]>(quiz.questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [needsReviewIds, setNeedsReviewIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [activeTutorQuestion, setActiveTutorQuestion] = useState<QuizQuestion | null>(null);

  const currentCard = cards[currentIndex] || quiz.questions[0];

  useEffect(() => {
    // Reset flip when navigating
    setIsFlipped(false);
    setShowHint(false);
  }, [currentIndex]);

  const handleFlip = () => {
    sound.playClick();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkMastered = () => {
    sound.playCorrect();
    const newMastered = new Set(masteredIds);
    newMastered.add(currentCard.id);
    setMasteredIds(newMastered);

    const newReview = new Set(needsReviewIds);
    newReview.delete(currentCard.id);
    setNeedsReviewIds(newReview);

    if (currentIndex < cards.length - 1) {
      handleNext();
    }
  };

  const handleMarkNeedsReview = () => {
    sound.playIncorrect();
    const newReview = new Set(needsReviewIds);
    newReview.add(currentCard.id);
    setNeedsReviewIds(newReview);

    const newMastered = new Set(masteredIds);
    newMastered.delete(currentCard.id);
    setMasteredIds(newMastered);

    if (currentIndex < cards.length - 1) {
      handleNext();
    }
  };

  const handleShuffle = () => {
    sound.playClick();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const getAnswerText = (q: QuizQuestion) => {
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      return q.options[q.correctOptionIndex] || 'Correct answer';
    }
    if (q.type === 'multiple_select' && q.correctIndices) {
      return q.correctIndices.map((i) => q.options[i]).join(', ');
    }
    if (q.type === 'fill_blank' && q.acceptedAnswers) {
      return q.acceptedAnswers.join(' / ');
    }
    return 'Correct answer';
  };

  const masteryPercent = Math.round((masteredIds.size / cards.length) * 100) || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Flashcard Study Mode
            </h1>
            <p className="text-xs text-slate-400 truncate max-w-md">{quiz.title}</p>
          </div>
        </div>

        {/* Progress & Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleShuffle}
            title="Shuffle Flashcards"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
          <button
            onClick={onStartQuiz}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            Take Test Now
          </button>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="mb-6 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-slate-400 font-medium">Study Mastery Progress</span>
          <span className="font-bold text-indigo-300">
            {masteredIds.size} of {cards.length} Mastered ({masteryPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
            style={{ width: `${(masteredIds.size / cards.length) * 100}%` }}
          />
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-300"
            style={{ width: `${(needsReviewIds.size / cards.length) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {masteredIds.size} Mastered
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> {needsReviewIds.size} Needs Review
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-600" />{' '}
            {cards.length - masteredIds.size - needsReviewIds.size} Unstudied
          </span>
        </div>
      </div>

      {/* Main 3D Flip Card Container */}
      <div className="relative w-full min-h-[380px] sm:min-h-[420px] select-none perspective-1000 mb-6">
        <div
          onClick={handleFlip}
          className={`w-full min-h-[380px] sm:min-h-[420px] rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between border shadow-2xl relative ${
            isFlipped
              ? 'bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border-indigo-500/40 shadow-indigo-500/10'
              : 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-slate-700/80 shadow-slate-950/50 hover:border-slate-600'
          }`}
        >
          {/* Card Top Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                Card {currentIndex + 1} / {cards.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                {currentCard.difficulty || 'Medium'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {masteredIds.has(currentCard.id) && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                </span>
              )}
              {needsReviewIds.has(currentCard.id) && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Review Later
                </span>
              )}
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Click card to flip
              </span>
            </div>
          </div>

          {/* Card Content (Front vs Back) */}
          <div className="my-auto py-6">
            {!isFlipped ? (
              /* FRONT: Question */
              <div className="space-y-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Question</p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed">
                  {currentCard.question}
                </h2>

                {currentCard.options && currentCard.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 max-w-xl mx-auto text-left">
                    {currentCard.options.map((opt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs sm:text-sm text-slate-300 flex items-center gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-md bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hint Button if front */}
                {currentCard.hint && (
                  <div className="pt-4">
                    {showHint ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block max-w-md p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left"
                      >
                        <span className="font-bold flex items-center gap-1 text-amber-400 mb-1">
                          <Lightbulb className="w-3.5 h-3.5" /> Study Hint:
                        </span>
                        {currentCard.hint}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playLifeline();
                          setShowHint(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5" /> Reveal Hint
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* BACK: Answer & Deep Explanation */
              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Correct Answer
                  </p>
                  <button
                    onClick={() => setActiveTutorQuestion(currentCard)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-medium transition-all"
                  >
                    <Bot className="w-3.5 h-3.5" /> Deep Tutor Breakdown
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-lg sm:text-xl font-bold">
                  {getAnswerText(currentCard)}
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 text-slate-300 text-sm leading-relaxed space-y-2">
                  <p className="font-semibold text-white text-xs uppercase tracking-wider">Explanation</p>
                  <p>{currentCard.explanation}</p>
                </div>

                {currentCard.keyTakeaway && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed">
                    <span className="font-bold text-indigo-300">🎯 Key Concept: </span>
                    {currentCard.keyTakeaway}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Bottom: Navigation & Mastery Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Counter & Prev/Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-medium text-slate-400 px-2">
                {currentIndex + 1} / {cards.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Mastery Toggles */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleMarkNeedsReview}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  needsReviewIds.has(currentCard.id)
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-slate-700 hover:border-amber-500/40'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Need Review
              </button>
              <button
                onClick={handleMarkMastered}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  masteredIds.has(currentCard.id)
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 border border-slate-700 hover:border-emerald-500/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Mastered!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tutor Modal */}
      {activeTutorQuestion && (
        <AITutorModal
          question={activeTutorQuestion}
          topic={quiz.topic}
          onClose={() => setActiveTutorQuestion(null)}
        />
      )}

    </div>
  );
};
