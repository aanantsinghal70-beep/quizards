import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Loader2, X, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';
import { explainQuestionAPI } from '../services/api';
import { QuizQuestion } from '../types/quiz';

interface AITutorModalProps {
  question: QuizQuestion;
  selectedAnswerText?: string;
  topic: string;
  onClose: () => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({
  question,
  selectedAnswerText,
  topic,
  onClose,
}) => {
  const getCorrectAnswerText = () => {
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      return question.options[question.correctOptionIndex] || 'Correct answer';
    }
    if (question.type === 'multiple_select' && question.correctIndices) {
      return question.correctIndices.map((idx) => question.options[idx]).join(', ');
    }
    if (question.type === 'fill_blank' && question.acceptedAnswers) {
      return question.acceptedAnswers.join(' or ');
    }
    return 'Correct answer';
  };

  const correctAnswerText = getCorrectAnswerText();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello! I'm your AI Master Tutor. Let's explore this question:\n\n**"${question.question}"**\n\n- **Correct Answer:** *${correctAnswerText}*\n${
        selectedAnswerText ? `- **Your Selection:** *${selectedAnswerText}*\n` : ''
      }\n**Standard Explanation:**\n${question.explanation}\n\nAsk me anything! For example: *"Why is this correct?", "Can you explain with a real-life analogy?", "What's the difference between option A and B?"*`,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || loading) return;

    const newMsgs: Message[] = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMsgs);
    setInputText('');
    setLoading(true);

    try {
      const res = await explainQuestionAPI({
        question: question.question,
        options: question.options,
        selectedAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        topic,
        userQuestion: textToSend,
      });

      setMessages((prev) => [...prev, { sender: 'ai', text: res.explanation }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `I ran into an issue connecting to the AI model: ${err.message || 'Please try again in a moment.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                AI Deep Dive Tutor
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.7
                </span>
              </h3>
              <p className="text-xs text-slate-400">Master this concept with analogies and in-depth answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex-shrink-0 flex items-center justify-center text-white mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none prose prose-invert prose-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex-shrink-0 flex items-center justify-center text-white mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-indigo-400 text-sm py-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center text-white animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>AI Tutor is crafting explanation...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-slate-400 font-medium whitespace-nowrap">Suggested:</span>
          <button
            onClick={() => handleSendMessage("Explain this with a simple real-world analogy.")}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            💡 Real-world analogy
          </button>
          <button
            onClick={() => handleSendMessage("Why are the other options incorrect?")}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            ❌ Why are other options wrong?
          </button>
          <button
            onClick={() => handleSendMessage("Give me a memorable mental hook or mnemonic for this.")}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            🧠 Memory hook
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask your AI Tutor about this question..."
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
