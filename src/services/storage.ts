import { Quiz, QuizHistoryItem, QuizResult, UserStats } from '../types/quiz';

const HISTORY_KEY = 'quizmind_history';
const SAVED_QUIZZES_KEY = 'quizmind_saved_quizzes';

export const storage = {
  getHistory(): QuizHistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuizResult(quiz: Quiz, result: QuizResult): QuizHistoryItem {
    const history = this.getHistory();
    const item: QuizHistoryItem = {
      id: `hist_${Date.now()}`,
      quiz,
      result,
      completedAt: new Date().toISOString(),
    };
    
    // Keep most recent 50 items
    const updated = [item, ...history].slice(0, 50);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage full, dropping older items', e);
    }
    return item;
  },

  getSavedQuizzes(): Quiz[] {
    try {
      const data = localStorage.getItem(SAVED_QUIZZES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuiz(quiz: Quiz): boolean {
    const saved = this.getSavedQuizzes();
    // Check if already exists
    const exists = saved.some((q) => q.id === quiz.id);
    if (!exists) {
      const updated = [quiz, ...saved];
      try {
        localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(updated));
        return true;
      } catch {}
    }
    return false;
  },

  removeSavedQuiz(quizId: string) {
    const saved = this.getSavedQuizzes();
    const filtered = saved.filter((q) => q.id !== quizId);
    try {
      localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(filtered));
    } catch {}
  },

  isQuizSaved(quizId: string): boolean {
    const saved = this.getSavedQuizzes();
    return saved.some((q) => q.id === quizId);
  },

  getUserStats(): UserStats {
    const history = this.getHistory();
    const savedQuizzes = this.getSavedQuizzes();

    let totalPoints = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
    let bestStreak = 0;

    history.forEach((item) => {
      totalPoints += item.result.score || 0;
      totalCorrect += item.result.correctCount || 0;
      totalQuestions += item.result.totalQuestions || 0;
      if (item.result.streakRecord > bestStreak) {
        bestStreak = item.result.streakRecord;
      }
    });

    return {
      totalQuizzesTaken: history.length,
      totalQuestionsAnswered: totalQuestions,
      totalCorrectAnswers: totalCorrect,
      totalPoints,
      bestStreak,
      quizzesHistory: history,
      savedQuizzes,
    };
  },

  clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }
};
