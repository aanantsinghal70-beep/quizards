import { Quiz, QuizConfig } from '../types/quiz';

export interface GenerateQuizParams {
  topic: string;
  customContext?: string;
  difficulty?: string;
  questionCount?: number;
  questionTypes?: string[];
  tone?: string;
  language?: string;
  targetAudience?: string;
}

export interface ExplainQuestionParams {
  question: string;
  options?: string[];
  selectedAnswer?: string;
  correctAnswer: string;
  topic?: string;
  userQuestion?: string;
}

export async function generateQuizAPI(params: GenerateQuizParams): Promise<Quiz> {
  const response = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const data: Quiz = await response.json();
  return data;
}

export async function explainQuestionAPI(params: ExplainQuestionParams): Promise<{ explanation: string }> {
  const response = await fetch('/api/explain-question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate explanation');
  }

  return response.json();
}

export async function suggestTopicsAPI(query: string, category: string = 'all'): Promise<string[]> {
  try {
    const response = await fetch('/api/suggest-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, category }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.suggestions || [];
  } catch {
    return [];
  }
}

// Built-in Curated Quick-Picks
export const PRESET_TOPICS = [
  {
    category: 'Science & Tech',
    icon: 'Atom',
    color: 'from-blue-500 to-cyan-500',
    topics: [
      'Quantum Physics & Entanglement',
      'Artificial Intelligence & Neural Networks',
      'Space Exploration & Mars Missions',
      'Human Brain & Neuroscience',
      'CRISPR & Genetic Engineering',
    ],
  },
  {
    category: 'History & Civics',
    icon: 'Landmark',
    color: 'from-amber-500 to-orange-500',
    topics: [
      'Ancient Roman Republic & Empire',
      'World War II Cryptography & Enigma',
      'The Renaissance & Golden Age of Art',
      'Ancient Egypt: Dynasties & Hieroglyphs',
      'Space Race: Cold War Moon Landing',
    ],
  },
  {
    category: 'Coding & Dev',
    icon: 'Code',
    color: 'from-emerald-500 to-teal-500',
    topics: [
      'Modern JavaScript & TypeScript ES2024',
      'React Architecture & Modern Hooks',
      'System Design & Microservices',
      'Data Structures & Algorithmic Complexity',
      'Database Indexing & SQL Mastery',
    ],
  },
  {
    category: 'Pop Culture & Trivia',
    icon: 'Sparkles',
    color: 'from-purple-500 to-pink-500',
    topics: [
      'Cinema Masterpieces & Oscar Winners',
      'World Mythology: Greek, Norse & Egyptian',
      'Global Geography: Capitals & Natural Wonders',
      'Music History: From 80s Rock to 2000s Pop',
      'Culinary Arts & World Cuisine Origins',
    ],
  },
];
