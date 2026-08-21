import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Quiz,
  QuizQuestion,
  QuizConfig,
  UserAnswer,
  QuizResult,
  DifficultyLevel
} from '../types/quiz';
import {
  Clock,
  Flame,
  Lightbulb,
  Zap,
  SkipForward,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Bot,
  Award,
  AlertCircle
} from 'lucide-react';
import { sound } from '../services/sound';
import { AITutorModal } from './AITutorModal';

interface QuizPlayerProps {
  quiz: Quiz;
  config: QuizConfig;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  config,
  onComplete,
  onExit,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  
  // Selection state for current question
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>('');
  
  // Question status
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [revealedHint, setRevealedHint] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]); // 50/50
  const [used5050, setUsed5050] = useState<boolean>(false);
  const [lifeline5050Available, setLifeline5050Available] = useState<boolean>(true);
  const [hintsAvailable, setHintsAvailable] = useState<number>(3);
  
  // Timing & Gamification
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(
    config.timeLimitPerQuestionSeconds || 30
  );
  const [totalQuizTimeElapsed, setTotalQuizTimeElapsed] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);

  // AI Tutor Modal
  const [tutorQuestion, setTutorQuestion] = useState<QuizQuestion | null>(null);

  const currentQ: QuizQuestion = quiz.questions[currentIdx] || quiz.questions[0];
  const isLastQuestion = currentIdx === quiz.questions.length - 1;

  // Initialize/reset state when question changes
  const initQuestion = useCallback(() => {
    setSelectedOption(null);
    setSelectedMultiOptions([]);
    setTextAnswer('');
    setIsAnswerSubmitted(false);
    setRevealedHint(false);
    setEliminatedOptions([]);
    setUsed5050(false);
    setQuestionStartTime(Date.now());
    setQuestionTimeLeft(currentQ.timeLimitSeconds || config.timeLimitPerQuestionSeconds || 30);
  }, [currentQ, config.timeLimitPerQuestionSeconds]);

  useEffect(() => {
    initQuestion();
  }, [currentIdx, initQuestion]);

  // Overall timer and per-question countdown
  useEffect(() => {
    if (isAnswerSubmitted) return;

    const timer = setInterval(() => {
      setTotalQuizTimeElapsed((prev) => prev + 1);

      if (config.timerMode === 'per_question') {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeExpired();
            return 0;
          }
          if (prev <= 5) {
            sound.playTick();
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, isAnswerSubmitted, config.timerMode]);

  // Time expired handler
  const handleTimeExpired = () => {
    if (isAnswerSubmitted) return;
    sound.playIncorrect();
    submitAnswer(true); // timed out
  };

  // Lifeline: 50/50 (eliminates 2 incorrect options)
  const handleUse5050 = () => {
    if (!lifeline5050Available || isAnswerSubmitted || eliminatedOptions.length > 0) return;
    if (currentQ.type !== 'multiple_choice' || !currentQ.options || currentQ.options.length < 4) return;

    sound.playLifeline();
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctOptionIndex);

    // Shuffle and pick 2 wrong options to eliminate
    const toEliminate = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
    setUsed5050(true);
    setLifeline5050Available(false);
  };

  // Lifeline: Hint
  const handleUseHint = () => {
    if (revealedHint || isAnswerSubmitted) return;
    sound.playLifeline();
    setRevealedHint(true);
    if (hintsAvailable > 0) {
      setHintsAvailable((prev) => prev - 1);
    }
  };

  // Submit Answer calculation
  const submitAnswer = (timedOut: boolean = false) => {
    if (isAnswerSubmitted) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    let isCorrect = false;

    if (!timedOut) {
      if (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') {
        isCorrect = selectedOption === currentQ.correctOptionIndex;
      } else if (currentQ.type === 'multiple_select') {
        const correctSet = new Set(currentQ.correctIndices || []);
        const userSet = new Set(selectedMultiOptions);
        isCorrect =
          correctSet.size === userSet.size &&
          [...correctSet].every((val) => userSet.has(val));
      } else if (currentQ.type === 'fill_blank') {
        const cleanInput = textAnswer.trim().toLowerCase();
        const accepted = (currentQ.acceptedAnswers || []).map((a) => a.trim().toLowerCase());
        isCorrect = accepted.includes(cleanInput);
      }
    }

    // Points calculation with streak multiplier
    const basePoints = currentQ.points || 10;
    let earnedPoints = 0;
    let newStreak = streak;

    if (isCorrect) {
      sound.playCorrect();
      newStreak = streak + 1;
      const multiplier = newStreak >= 5 ? 2 : newStreak >= 3 ? 1.5 : 1;
      const speedBonus = config.timerMode === 'per_question' && questionTimeLeft > 15 ? 2 : 0;
      earnedPoints = Math.round(basePoints * multiplier + speedBonus);
      setTotalScore((prev) => prev + earnedPoints);
    } else {
      sound.playIncorrect();
      newStreak = 0;
    }

    setStreak(newStreak);
    if (newStreak > bestStreak) {
      setBestStreak(newStreak);
    }

    const answerRecord: UserAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex: selectedOption !== null ? selectedOption : undefined,
      selectedOptionIndices: selectedMultiOptions.length > 0 ? selectedMultiOptions : undefined,
      textAnswer: textAnswer || undefined,
      isCorrect,
      timeSpentSeconds: timeSpent,
      usedHint: revealedHint,
      used5050,
      pointsEarned: earnedPoints,
    };

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: answerRecord,
    }));

    setIsAnswerSubmitted(true);

    // If "at_end" mode, automatically go to next question unless last
    if (config.revealMode === 'at_end') {
      setTimeout(() => {
        if (isLastQuestion) {
          finishQuiz({ ...userAnswers, [currentQ.id]: answerRecord });
        } else {
          setCurrentIdx((prev) => prev + 1);
        }
      }, 300);
    }
  };

  // Proceed to next question or finalize quiz
  const handleNextQuestion = () => {
    sound.playClick();
    if (isLastQuestion) {
      finishQuiz(userAnswers);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Finish and compute grade
  const finishQuiz = (finalAnswers: Record<string, UserAnswer>) => {
    sound.playFanfare();

    const totalQuestions = quiz.questions.length;
    let correctCount = 0;
    let calculatedScore = 0;
    let maxPossibleScore = 0;

    quiz.questions.forEach((q) => {
      const ans = finalAnswers[q.id];
      const pts = q.points || 10;
      maxPossibleScore += pts;
      if (ans && ans.isCorrect) {
        correctCount += 1;
        calculatedScore += ans.pointsEarned || pts;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    let grade = 'C';
    let performanceFeedback = 'Good effort! Review the questions you missed to sharpen your mastery.';

    if (percentage >= 95) {
      grade = 'S+';
      performanceFeedback = 'Phenomenal! Masterclass performance. You have complete mastery of this subject!';
    } else if (percentage >= 85) {
      grade = 'A+';
      performanceFeedback = 'Outstanding work! You demonstrated deep conceptual understanding and speed.';
    } else if (percentage >= 70) {
      grade = 'B';
      performanceFeedback = 'Great job! Strong fundamentals with just a few areas for quick revision.';
    } else if (percentage >= 50) {
      grade = 'C';
      performanceFeedback = 'Promising start! Check out the AI Tutor explanations below to strengthen key gaps.';
    } else {
      grade = 'D';
      performanceFeedback = 'Great learning opportunity. Study the flashcards and try retaking the quiz!';
    }

    const result: QuizResult = {
      id: `res_${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      score: calculatedScore,
      maxScore: maxPossibleScore,
      percentage,
      correctCount,
      totalQuestions,
      timeSpentTotalSeconds: totalQuizTimeElapsed,
      answers: finalAnswers,
      date: new Date().toISOString(),
      streakRecord: Math.max(bestStreak, streak),
      grade,
      performanceFeedback,
    };

    onComplete(result);
  };

  // Keyboard Shortcuts (1-4 for options, Enter for Submit/Next, H for hint)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.key >= '1' && e.key <= '4' && !isAnswerSubmitted && currentQ.options) {
        const optIndex = parseInt(e.key, 10) - 1;
        if (optIndex < currentQ.options.length && !eliminatedOptions.includes(optIndex)) {
          if (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') {
            setSelectedOption(optIndex);
          }
        }
      }

      if ((e.key === 'h' || e.key === 'H') && !revealedHint && !isAnswerSubmitted) {
        handleUseHint();
      }

      if (e.key === 'Enter') {
        if (!isAnswerSubmitted) {
          if (selectedOption !== null || selectedMultiOptions.length > 0 || textAnswer.trim()) {
            submitAnswer();
          }
        } else {
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAnswerSubmitted,
    selectedOption,
    selectedMultiOptions,
    textAnswer,
    currentQ,
    eliminatedOptions,
    revealedHint,
  ]);

  const maxQTime = currentQ.timeLimitSeconds || config.timeLimitPerQuestionSeconds || 30;
  const timerPercent = (questionTimeLeft / maxQTime) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {quiz.topic}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-sm sm:max-w-md">
            {quiz.title}
          </h2>
        </div>

        <button
          onClick={onExit}
          className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
        >
          Exit Quiz
        </button>
      </div>

      {/* Progress & Stats Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-3">
          
          {/* Question Index Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-sm">
              Question {currentIdx + 1} of {quiz.questions.length}
            </span>
            <span className="text-slate-400 capitalize hidden sm:inline">
              &bull; {currentQ.difficulty || 'Medium'} &bull; +{currentQ.points || 10} pts
            </span>
          </div>

          {/* Gamification: Score & Streak */}
          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                <span>Streak {streak}x!</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm">
              <Award className="w-4 h-4" />
              <span>{totalScore} pts</span>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
            style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Lifelines Bar & Per-Question Timer */}
      <div className="flex items-center justify-between gap-2 mb-6">
        
        {/* Lifelines */}
        <div className="flex items-center gap-2">
          {/* AI Hint Lifeline */}
          <button
            onClick={handleUseHint}
            disabled={revealedHint || isAnswerSubmitted}
            title="Get an AI Hint (Shortcut: H)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              revealedHint
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/90 hover:bg-slate-750 text-slate-300 border-slate-700 hover:border-amber-500/40'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Hint</span>
            {hintsAvailable > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200">
                {hintsAvailable}
              </span>
            )}
          </button>

          {/* 50/50 Lifeline */}
          {currentQ.type === 'multiple_choice' && (
            <button
              onClick={handleUse5050}
              disabled={!lifeline5050Available || isAnswerSubmitted || eliminatedOptions.length > 0}
              title="Eliminate 2 wrong answers"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                eliminatedOptions.length > 0
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800/90 hover:bg-slate-750 text-slate-300 border-slate-700 hover:border-purple-500/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>50/50</span>
            </button>
          )}
        </div>

        {/* Timer Badge */}
        {config.timerMode === 'per_question' && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm transition-all ${
              questionTimeLeft <= 5
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-slate-800/90 text-slate-200 border-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${questionTimeLeft <= 5 ? 'text-red-400' : 'text-indigo-400'}`} />
            <span>{questionTimeLeft}s</span>
          </div>
        )}
      </div>

      {/* Hint Alert Card if revealed */}
      {revealedHint && currentQ.hint && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-0.5">AI Hint:</span>
            {currentQ.hint}
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-6 relative">
        
        {/* Question Statement */}
        <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed mb-6">
          {currentQ.question}
        </h3>

        {/* OPTION TYPES */}

        {/* 1. Multiple Choice & True/False */}
        {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
          <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
            {currentQ.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === idx;
              const isEliminated = eliminatedOptions.includes(idx);
              const isCorrectOption = idx === currentQ.correctOptionIndex;

              let optionStyle =
                'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700/80 hover:border-indigo-500/50';

              if (isSelected && !isAnswerSubmitted) {
                optionStyle = 'bg-indigo-600/30 border-indigo-500 text-white ring-2 ring-indigo-500/40';
              }

              if (isAnswerSubmitted && config.revealMode === 'instant') {
                if (isCorrectOption) {
                  optionStyle =
                    'bg-emerald-500/20 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'bg-red-500/20 border-red-500 text-red-100 ring-2 ring-red-500/40';
                } else {
                  optionStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                }
              }

              if (isEliminated) {
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/40 text-slate-600 line-through opacity-40 select-none flex items-center justify-between"
                  >
                    <span>
                      <strong>{letter})</strong> {opt}
                    </span>
                    <span className="text-xs">Eliminated 50/50</span>
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!isAnswerSubmitted) {
                      sound.playClick();
                      setSelectedOption(idx);
                    }
                  }}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-150 group cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-300 group-hover:border-indigo-400 group-hover:text-white transition-colors flex-shrink-0">
                      {letter}
                    </span>
                    <span className="text-sm sm:text-base font-medium">{opt}</span>
                  </div>

                  {/* Status Indicator Icon */}
                  {isAnswerSubmitted && config.revealMode === 'instant' && (
                    <div>
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : null}
                    </div>
                  )}

                  {!isAnswerSubmitted && (
                    <span className="text-[11px] text-slate-500 hidden sm:inline group-hover:text-slate-300">
                      Press {idx + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Multiple Select (Choose all that apply) */}
        {currentQ.type === 'multiple_select' && (
          <div className="space-y-3">
            <p className="text-xs text-indigo-400 font-semibold mb-2">
              Select all options that apply:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedMultiOptions.includes(idx);
                const isCorrect = (currentQ.correctIndices || []).includes(idx);

                let style = 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700';
                if (isSelected && !isAnswerSubmitted) {
                  style = 'bg-indigo-600/30 border-indigo-500 text-white';
                }
                if (isAnswerSubmitted && config.revealMode === 'instant') {
                  if (isCorrect) {
                    style = 'bg-emerald-500/20 border-emerald-500 text-emerald-100';
                  } else if (isSelected && !isCorrect) {
                    style = 'bg-red-500/20 border-red-500 text-red-100';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isAnswerSubmitted) return;
                      sound.playClick();
                      setSelectedMultiOptions((prev) =>
                        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                      );
                    }}
                    disabled={isAnswerSubmitted}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${style}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Fill in the Blank */}
        {currentQ.type === 'fill_blank' && (
          <div className="space-y-4">
            <p className="text-xs text-indigo-400 font-semibold">Type your answer in the box below:</p>
            <div className="relative">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isAnswerSubmitted}
                placeholder="Type your answer here..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            {isAnswerSubmitted && currentQ.acceptedAnswers && (
              <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <strong className="text-white">Accepted Answers: </strong>
                {currentQ.acceptedAnswers.join(' or ')}
              </div>
            )}
          </div>
        )}

        {/* Instant Feedback Panel (When Answer is Submitted) */}
        {isAnswerSubmitted && config.revealMode === 'instant' && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in duration-200 space-y-4">
            
            {/* Status Banner */}
            <div
              className={`p-4 rounded-2xl flex items-start justify-between gap-3 ${
                userAnswers[currentQ.id]?.isCorrect
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/40 border border-red-500/40 text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {userAnswers[currentQ.id]?.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-base">
                    {userAnswers[currentQ.id]?.isCorrect
                      ? 'Correct! Excellent work!'
                      : 'Incorrect! Here is the breakdown:'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>

              {/* AI Tutor Button */}
              <button
                onClick={() => setTutorQuestion(currentQ)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-semibold transition-all flex-shrink-0"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask AI Tutor</span>
                <span className="sm:hidden">Tutor</span>
              </button>
            </div>

            {/* Key Takeaway */}
            {currentQ.keyTakeaway && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300">Core Takeaway: </span>
                  {currentQ.keyTakeaway}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Action Footer Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500 hidden sm:block">
          {!isAnswerSubmitted
            ? 'Select your answer and click submit'
            : 'Review explanation or press Enter to advance'}
        </div>

        {!isAnswerSubmitted ? (
          <button
            onClick={() => submitAnswer()}
            disabled={
              (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false')
                ? selectedOption === null
                : currentQ.type === 'multiple_select'
                ? selectedMultiOptions.length === 0
                : !textAnswer.trim()
            }
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <span>Submit Answer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLastQuestion ? 'View Final Results' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* AI Tutor Modal */}
      {tutorQuestion && (
        <AITutorModal
          question={tutorQuestion}
          selectedAnswerText={
            selectedOption !== null && currentQ.options
              ? currentQ.options[selectedOption]
              : textAnswer || undefined
          }
          topic={quiz.topic}
          onClose={() => setTutorQuestion(null)}
        />
      )}

    </div>
  );
};
