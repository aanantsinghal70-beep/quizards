import React, { useState, useEffect } from 'react';
import {
  Quiz,
  QuizConfig,
  DifficultyLevel,
  QuizTone,
  QuestionType,
  TimerMode,
  RevealMode
} from '../types/quiz';
import {
  Sparkles,
  Zap,
  SlidersHorizontal,
  FileText,
  HelpCircle,
  Clock,
  Globe,
  Loader2,
  Dice5,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  BookOpen,
  Atom,
  Landmark,
  Code,
  Flame,
  AlertCircle
} from 'lucide-react';
import { generateQuizAPI, PRESET_TOPICS, suggestTopicsAPI } from '../services/api';
import { sound } from '../services/sound';

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: Quiz, config: QuizConfig) => void;
  onStudyFlashcards: (quiz: Quiz) => void;
}

const RANDOM_TOPIC_IDEAS = [
  'Quantum Computing & Superposition',
  'Ancient Roman Gladiators & Colosseum',
  'Modern JavaScript & React 19 Features',
  'Human Cardiovascular System',
  'The Science of Black Holes & Relativity',
  'World War II Cryptography & Enigma',
  'Origins of Culinary Spices & Silk Road',
  'Machine Learning & Neural Networks',
  'Psychology of Cognitive Biases',
  'Global Geography: Ocean Trenches & Volcanoes',
  'Formula 1 Aerodynamics & Telemetry',
  'Cybersecurity: Zero-Day Exploits & Cryptography',
  'Cellular Biology & ATP Synthesis',
  'Philosophy of Stoicism & Marcus Aurelius',
  'Taylor Swift discography and music theory'
];

const LOADING_STEPS = [
  'Analyzing your topic & crafting questions...',
  'Generating plausible options and distractors...',
  'Writing comprehensive educational explanations...',
  'Synthesizing hints and key concept takeaways...',
  'Polishing question balance & formatting...'
];

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  onQuizGenerated,
  onStudyFlashcards,
}) => {
  // Input mode: topic vs custom pasted context
  const [inputMode, setInputMode] = useState<'topic' | 'context'>('topic');
  const [topic, setTopic] = useState('');
  const [customContext, setCustomContext] = useState('');
  
  // Customization Options
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
  ]);
  const [tone, setTone] = useState<QuizTone>('engaging');
  const [language, setLanguage] = useState<string>('English');
  const [timerMode, setTimerMode] = useState<TimerMode>('per_question');
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState<number>(30);
  const [revealMode, setRevealMode] = useState<RevealMode>('instant');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Status & Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle Random Surprise
  const handleRandomTopic = () => {
    sound.playClick();
    const rand = RANDOM_TOPIC_IDEAS[Math.floor(Math.random() * RANDOM_TOPIC_IDEAS.length)];
    setTopic(rand);
    setInputMode('topic');
  };

  // Toggle question types
  const toggleQuestionType = (type: QuestionType) => {
    sound.playClick();
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  // Generate Quiz Trigger
  const handleGenerate = async (presetTopic?: string) => {
    const finalTopic = presetTopic || topic;
    
    if (inputMode === 'topic' && !finalTopic.trim()) {
      setErrorMessage('Please enter a topic for your quiz or choose from the quick picks.');
      return;
    }
    if (inputMode === 'context' && !customContext.trim()) {
      setErrorMessage('Please paste your study notes or text context to generate questions.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setLoadingStepIdx(0);
    sound.playClick();

    const config: QuizConfig = {
      topic: finalTopic,
      customContext: inputMode === 'context' ? customContext : undefined,
      difficulty,
      questionCount,
      questionTypes,
      tone,
      language,
      timerMode,
      timeLimitPerQuestionSeconds: timeLimitPerQuestion,
      totalTimeLimitMinutes: 10,
      revealMode,
    };

    try {
      const generatedQuiz = await generateQuizAPI({
        topic: finalTopic,
        customContext: inputMode === 'context' ? customContext : undefined,
        difficulty,
        questionCount,
        questionTypes,
        tone,
        language,
      });

      setIsLoading(false);
      sound.playFanfare();
      onQuizGenerated(generatedQuiz, config);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setErrorMessage(
        err.message || 'Failed to generate quiz. Please ensure topic is valid and try again.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          AI-Powered Quiz Architect
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Test Your Mastery on{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Any Subject
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Type any topic, idea, or paste study notes. Gemini 3.7 will craft a customized,
          interactive quiz with hints, timer modes, and deep explanations.
        </p>
      </div>

      {/* Main Generator Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Selector Tabs (Topic vs Custom Notes) */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setInputMode('topic');
              sound.playClick();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              inputMode === 'topic'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Enter Topic / Idea
          </button>
          <button
            onClick={() => {
              setInputMode('context');
              sound.playClick();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              inputMode === 'context'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Study Notes / Document Text
          </button>
        </div>

        {/* Input Field: Topic Mode */}
        {inputMode === 'topic' ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Quiz Topic or Concept
              </label>
              <button
                onClick={handleRandomTopic}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                <Dice5 className="w-3.5 h-3.5" />
                Surprise Me
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                placeholder="e.g. Quantum Physics, World War II, React Hooks, French Cinema, Neurobiology..."
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-2xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>
          </div>
        ) : (
          /* Input Field: Custom Context Paste Mode */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Paste Your Study Material / Lecture Notes
              </label>
              <span className="text-[11px] text-slate-500">
                Questions will be derived directly from this text
              </span>
            </div>
            <textarea
              rows={4}
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Paste article text, study summary, book chapter notes, or lecture transcript here..."
              className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none"
            />
          </div>
        )}

        {/* Primary Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="easy">Easy (Foundations & Intro)</option>
              <option value="medium">Medium (Standard Academic)</option>
              <option value="hard">Hard (Advanced & Deep)</option>
              <option value="expert">Expert (Mastery / Tricky)</option>
              <option value="progressive">Progressive (Gets harder)</option>
            </select>
          </div>

          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Question Count</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setQuestionCount(num);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    questionCount === num
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {num}Q
                </button>
              ))}
            </div>
          </div>

          {/* Timer Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Timer Mode</label>
            <select
              value={timerMode}
              onChange={(e) => setTimerMode(e.target.value as TimerMode)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="per_question">Per Question Timer (30s)</option>
              <option value="none">Untimed (Relaxed Study)</option>
            </select>
          </div>

        </div>

        {/* Question Types Toggle Pills */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-300">Question Formats Allowed</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'multiple_choice', label: 'Multiple Choice (4-options)' },
              { id: 'true_false', label: 'True / False' },
              { id: 'multiple_select', label: 'Multi-Select (Choose all)' },
              { id: 'fill_blank', label: 'Fill in the Blank' },
            ].map((t) => {
              const isSelected = questionTypes.includes(t.id as QuestionType);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleQuestionType(t.id as QuestionType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings (Tone, Language, Reveal Mode)'}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
              
              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tone & Personality</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as QuizTone)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="engaging">Engaging & Fun</option>
                  <option value="academic">Academic & Strict Exam</option>
                  <option value="masterclass">Masterclass Challenge</option>
                  <option value="kid_friendly">Kid-Friendly</option>
                  <option value="humorous">Witty & Humorous</option>
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Portuguese">Portuguese (Português)</option>
                  <option value="Mandarin">Chinese (中文)</option>
                  <option value="Italian">Italian (Italiano)</option>
                </select>
              </div>

              {/* Reveal Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Feedback Delivery</label>
                <select
                  value={revealMode}
                  onChange={(e) => setRevealMode(e.target.value as RevealMode)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="instant">Instant Explanations (Learn as you go)</option>
                  <option value="at_end">Exam Mode (Reveal results at end)</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Generation Error</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading ? (
          <div className="py-8 px-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-4 animate-in fade-in duration-200">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Brain className="w-6 h-6 text-indigo-400 absolute" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Crafting Your Custom Quiz</h3>
              <p className="text-xs text-indigo-300 font-medium animate-pulse">
                {LOADING_STEPS[loadingStepIdx]}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Gemini 3.7 is synthesizing verified answers, smart distractors, and educational hints...
            </p>
          </div>
        ) : (
          /* Generate Action Button */
          <button
            onClick={() => handleGenerate()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
            <span>Generate & Start Quiz</span>
          </button>
        )}

      </div>

      {/* Curated Preset Topic Packs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Trending & Curated Topic Packs
          </h2>
          <span className="text-xs text-slate-500">1-click instant quiz launch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRESET_TOPICS.map((pack) => {
            const IconComponent =
              pack.icon === 'Atom'
                ? Atom
                : pack.icon === 'Landmark'
                ? Landmark
                : pack.icon === 'Code'
                ? Code
                : Sparkles;

            return (
              <div
                key={pack.category}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{pack.category}</h3>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {pack.topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTopic(t);
                        setInputMode('topic');
                        handleGenerate(t);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500/40 text-xs font-medium transition-all text-left truncate max-w-full"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
