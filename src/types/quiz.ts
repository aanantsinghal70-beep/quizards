export type QuestionType = 'multiple_choice' | 'true_false' | 'multiple_select' | 'fill_blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'progressive';

export type QuizTone = 'engaging' | 'academic' | 'humorous' | 'masterclass' | 'kid_friendly';

export type TimerMode = 'per_question' | 'total_quiz' | 'none';

export type RevealMode = 'instant' | 'at_end';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctOptionIndex: number;
  correctIndices?: number[]; // For multiple_select
  acceptedAnswers?: string[]; // For fill_blank
  hint: string;
  explanation: string;
  keyTakeaway?: string;
  points?: number;
  timeLimitSeconds?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  userNotes?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: DifficultyLevel;
  estimatedMinutes?: number;
  tags: string[];
  questions: QuizQuestion[];
  createdAt: string;
  customContext?: string;
}

export interface QuizConfig {
  topic: string;
  customContext?: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  tone: QuizTone;
  language: string;
  timerMode: TimerMode;
  timeLimitPerQuestionSeconds: number;
  totalTimeLimitMinutes: number;
  revealMode: RevealMode;
  targetAudience?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex?: number;
  selectedOptionIndices?: number[];
  textAnswer?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  usedHint: boolean;
  used5050: boolean;
  pointsEarned: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  topic: string;
  difficulty: DifficultyLevel;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentTotalSeconds: number;
  answers: Record<string, UserAnswer>;
  date: string;
  streakRecord: number;
  grade: string;
  performanceFeedback: string;
}

export interface QuizHistoryItem {
  id: string;
  quiz: Quiz;
  result: QuizResult;
  completedAt: string;
}

export interface UserStats {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalPoints: number;
  bestStreak: number;
  quizzesHistory: QuizHistoryItem[];
  savedQuizzes: Quiz[];
}
