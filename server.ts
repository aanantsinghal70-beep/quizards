import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Generate Quiz API endpoint
  app.post('/api/generate-quiz', async (req, res) => {
    try {
      const {
        topic,
        customContext,
        difficulty = 'medium',
        questionCount = 5,
        questionTypes = ['multiple_choice'],
        tone = 'engaging',
        language = 'English',
        targetAudience = 'general',
      } = req.body;

      if (!topic && !customContext) {
        return res.status(400).json({ error: 'Topic or context text is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please ensure the API key is provided.',
        });
      }

      const count = Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 25);

      const prompt = `Create a high quality, well-structured, educational, and engaging quiz with exactly ${count} questions.
Topic: "${topic || 'Provided Context'}"
${customContext ? `Reference context / study notes to base questions on:\n${customContext}\n` : ''}
Difficulty Level: ${difficulty} (easy, medium, hard, expert, or progressive)
Question Formats allowed: ${Array.isArray(questionTypes) ? questionTypes.join(', ') : questionTypes}
Tone/Style: ${tone}
Language: Output all questions, options, explanations, and hints in ${language}.
Target Audience: ${targetAudience}

Requirements for the questions:
1. Questions must be factually accurate, clear, and unambiguous.
2. For "multiple_choice", provide exactly 4 distinct options (A, B, C, D) with exactly 1 correct answer (specified as index 0, 1, 2, or 3).
3. For "true_false", provide options ["True", "False"] with correctOptionIndex (0 or 1).
4. For "multiple_select", provide 4-5 options and specify multiple correctIndices (e.g., [0, 2]).
5. For "fill_blank", provide the question with "____" blank and a list of accepted answers in acceptedAnswers.
6. Provide a concise, clear "hint" for each question that assists thinking without giving away the final answer.
7. Provide a detailed, insightful "explanation" explaining WHY the correct answer is right and why common misconceptions are wrong.
8. Include a "keyTakeaway" summarizing the core educational principle in 1-2 punchy sentences.
9. Provide an appropriate estimated time in seconds (e.g., 20-45s) for each question.
10. Generate a catchy, creative Quiz Title and a 1-2 sentence subtitle/description.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert curriculum designer and master quiz architect. You generate accurate, intellectually stimulating, and balanced quizzes with crystal-clear options and rich explanations.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Creative and catchy title for the quiz' },
              description: { type: Type.STRING, description: 'Brief summary of what this quiz covers' },
              topic: { type: Type.STRING, description: 'The main topic covered' },
              difficulty: { type: Type.STRING, description: 'Assigned difficulty level' },
              estimatedMinutes: { type: Type.NUMBER, description: 'Estimated time to complete in minutes' },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-5 relevant keywords or tags',
              },
              questions: {
                type: Type.ARRAY,
                description: 'List of quiz questions',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'Unique question id like q1, q2' },
                    type: {
                      type: Type.STRING,
                      description: 'Type of question: multiple_choice, true_false, multiple_select, or fill_blank',
                    },
                    question: { type: Type.STRING, description: 'The question text' },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Array of option choices (required for multiple_choice, true_false, multiple_select)',
                    },
                    correctOptionIndex: {
                      type: Type.INTEGER,
                      description: '0-based index of the correct option for multiple_choice and true_false',
                    },
                    correctIndices: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                      description: 'Array of 0-based indices for multiple_select questions',
                    },
                    acceptedAnswers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Accepted string answers for fill_blank questions (case-insensitive matches)',
                    },
                    hint: { type: Type.STRING, description: 'Subtle educational hint' },
                    explanation: { type: Type.STRING, description: 'Comprehensive explanation of the answer' },
                    keyTakeaway: { type: Type.STRING, description: 'Key memorable takeaway point' },
                    points: { type: Type.INTEGER, description: 'Point value, e.g. 10 or 20' },
                    timeLimitSeconds: { type: Type.INTEGER, description: 'Recommended seconds limit e.g. 30' },
                    difficulty: { type: Type.STRING, description: 'easy, medium, or hard' },
                  },
                  required: ['id', 'type', 'question', 'explanation', 'hint'],
                },
              },
            },
            required: ['title', 'description', 'topic', 'questions'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsedQuiz = JSON.parse(responseText);

      // Ensure IDs and defaults exist
      if (parsedQuiz.questions && Array.isArray(parsedQuiz.questions)) {
        parsedQuiz.questions = parsedQuiz.questions.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `q_${Date.now()}_${idx}`,
          points: q.points || 10,
          timeLimitSeconds: q.timeLimitSeconds || 30,
          options: q.options || [],
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
        }));
      }

      parsedQuiz.id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      parsedQuiz.createdAt = new Date().toISOString();

      res.json(parsedQuiz);
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate quiz. Please try again with a different topic.',
      });
    }
  });

  // Deep AI Explanation / Tutor endpoint
  app.post('/api/explain-question', async (req, res) => {
    try {
      const { question, options, selectedAnswer, correctAnswer, topic, userQuestion } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const prompt = `You are a friendly, deeply knowledgeable AI Master Tutor.
A student is reviewing a quiz question on the topic: "${topic || 'General Knowledge'}".

Question: "${question}"
Options: ${JSON.stringify(options || [])}
Correct Answer: "${correctAnswer}"
Student's Selected Answer: "${selectedAnswer || 'Not provided'}"
${userQuestion ? `Student's specific follow-up question: "${userQuestion}"` : ''}

Please provide:
1. A clear breakdown of why the correct answer is right.
2. If the student made a mistake, explain why the common misconception occurs and why the student's choice was incorrect.
3. A real-world example, analogy, or mental model to make the concept stick permanently.
4. Two quick follow-up trivia facts or memory hooks related to this concept.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an inspiring, encouraging educational tutor. Keep formatting readable with clean markdown, bullet points, and bold headers.',
        },
      });

      res.json({
        explanation: response.text || 'Unable to generate detailed explanation at this time.',
      });
    } catch (error: any) {
      console.error('Error explaining question:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate explanation.' });
    }
  });

  // Suggest topics / autocomplete
  app.post('/api/suggest-topics', async (req, res) => {
    try {
      const { query = '', category = 'all' } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ suggestions: [] });
      }

      const prompt = `Suggest 6 intriguing, specific, and fun quiz topics based on input query: "${query}" in category "${category}".
Return a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      const suggestions = JSON.parse(response.text?.trim() || '[]');
      res.json({ suggestions });
    } catch (error) {
      res.json({ suggestions: [] });
    }
  });

  // Serve Frontend
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
