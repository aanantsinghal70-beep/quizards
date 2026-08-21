import React, { useState } from 'react';
import { Quiz, QuizConfig, QuizResult, QuizQuestion } from './types/quiz';
import { Navbar } from './components/Navbar';
import { QuizGenerator } from './components/QuizGenerator';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResults } from './components/QuizResults';
import { FlashcardMode } from './components/FlashcardMode';
import { QuizHistory } from './components/QuizHistory';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'generator' | 'player' | 'results' | 'flashcards' | 'history' | 'stats'
  >('generator');

  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Default fallback configuration if launched directly from library
  const defaultConfig: QuizConfig = {
    topic: currentQuiz?.topic || 'General Knowledge',
    difficulty: currentQuiz?.difficulty || 'medium',
    questionCount: currentQuiz?.questions.length || 5,
    questionTypes: ['multiple_choice'],
    tone: 'engaging',
    language: 'English',
    timerMode: 'per_question',
    timeLimitPerQuestionSeconds: 30,
    totalTimeLimitMinutes: 10,
    revealMode: 'instant',
  };

  const handleQuizGenerated = (quiz: Quiz, config: QuizConfig) => {
    setCurrentQuiz(quiz);
    setQuizConfig(config);
    setCurrentView('player');
  };

  const handleQuizCompleted = (result: QuizResult) => {
    setQuizResult(result);
    setCurrentView('results');
  };

  const handleRetakeAll = () => {
    if (!currentQuiz) return;
    setCurrentView('player');
  };

  const handleRetakeIncorrect = (incorrectQuestions: QuizQuestion[]) => {
    if (!currentQuiz || incorrectQuestions.length === 0) return;
    const filteredQuiz: Quiz = {
      ...currentQuiz,
      id: `quiz_retry_${Date.now()}`,
      title: `Practice Missed: ${currentQuiz.title}`,
      questions: incorrectQuestions,
    };
    setCurrentQuiz(filteredQuiz);
    setCurrentView('player');
  };

  const handleStudyFlashcards = (quiz?: Quiz) => {
    if (quiz) {
      setCurrentQuiz(quiz);
    }
    setCurrentView('flashcards');
  };

  const handleSelectQuizToPlay = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentView('player');
  };

  const handleSelectQuizToStudy = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentView('flashcards');
  };

  const handleNewQuiz = () => {
    setCurrentView('generator');
  };

  const handleReturnToQuiz = () => {
    if (currentQuiz) {
      setCurrentView('player');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        hasActiveQuiz={!!currentQuiz && currentView !== 'player'}
        onReturnToQuiz={handleReturnToQuiz}
        onNewQuiz={handleNewQuiz}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'generator' && (
          <QuizGenerator
            onQuizGenerated={handleQuizGenerated}
            onStudyFlashcards={handleStudyFlashcards}
          />
        )}

        {currentView === 'player' && currentQuiz && (
          <QuizPlayer
            quiz={currentQuiz}
            config={quizConfig || defaultConfig}
            onComplete={handleQuizCompleted}
            onExit={handleNewQuiz}
          />
        )}

        {currentView === 'results' && currentQuiz && quizResult && (
          <QuizResults
            quiz={currentQuiz}
            result={quizResult}
            onRetakeAll={handleRetakeAll}
            onRetakeIncorrect={handleRetakeIncorrect}
            onStudyFlashcards={() => handleStudyFlashcards(currentQuiz)}
            onNewQuiz={handleNewQuiz}
          />
        )}

        {currentView === 'flashcards' && currentQuiz && (
          <FlashcardMode
            quiz={currentQuiz}
            onExit={handleNewQuiz}
            onStartQuiz={() => setCurrentView('player')}
          />
        )}

        {(currentView === 'history' || currentView === 'stats') && (
          <QuizHistory
            onSelectQuizToPlay={handleSelectQuizToPlay}
            onSelectQuizToStudy={handleSelectQuizToStudy}
            onNewQuiz={handleNewQuiz}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>QuizMind AI &bull; Intelligent Quiz Engine &amp; Study Companion</span>
          <span>Powered by Gemini 3.7 Flash</span>
        </div>
      </footer>
    </div>
  );
}
