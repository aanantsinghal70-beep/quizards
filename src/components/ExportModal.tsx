import React, { useState } from 'react';
import { Quiz } from '../types/quiz';
import { Printer, Copy, Check, Download, FileText, X, Share2, Sparkles } from 'lucide-react';

interface ExportModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ quiz, onClose }) => {
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    let md = `# ${quiz.title}\n\n`;
    md += `**Topic:** ${quiz.topic} | **Difficulty:** ${quiz.difficulty} | **Questions:** ${quiz.questions.length}\n`;
    md += `*${quiz.description}*\n\n---\n\n`;

    quiz.questions.forEach((q, idx) => {
      md += `### Question ${idx + 1}: ${q.question}\n\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          md += `- [ ] **${letter})** ${opt}\n`;
        });
      } else if (q.type === 'fill_blank') {
        md += `*Answer: _________________________________*\n`;
      }

      if (includeAnswers) {
        md += `\n> **Correct Answer:** `;
        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          md += `${String.fromCharCode(65 + q.correctOptionIndex)}) ${q.options[q.correctOptionIndex]}\n`;
        } else if (q.type === 'multiple_select' && q.correctIndices) {
          md += `${q.correctIndices.map((i) => `${String.fromCharCode(65 + i)}) ${q.options[i]}`).join(', ')}\n`;
        } else if (q.type === 'fill_blank' && q.acceptedAnswers) {
          md += `${q.acceptedAnswers.join(' / ')}\n`;
        }
        md += `> **Explanation:** ${q.explanation}\n`;
        if (q.keyTakeaway) {
          md += `> **Key Takeaway:** ${q.keyTakeaway}\n`;
        }
      }
      md += `\n---\n\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_quiz.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${quiz.title} - QuizMind AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
            h1 { font-size: 24px; margin-bottom: 4px; color: #1e293b; }
            .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .question-block { margin-bottom: 24px; page-break-inside: avoid; }
            .q-title { font-weight: 600; font-size: 16px; margin-bottom: 10px; }
            .options { list-style: none; padding-left: 0; }
            .option { margin-bottom: 8px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; }
            .answer-key { margin-top: 40px; page-break-before: always; border-top: 2px solid #334155; padding-top: 20px; }
            .explanation { font-size: 13px; color: #475569; margin-top: 4px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 12px; font-weight: bold; margin-right: 6px; }
          </style>
        </head>
        <body>
          <h1>${quiz.title}</h1>
          <div class="meta">
            <span><strong>Topic:</strong> ${quiz.topic}</span> &bull; 
            <span><strong>Difficulty:</strong> ${quiz.difficulty.toUpperCase()}</span> &bull; 
            <span><strong>Questions:</strong> ${quiz.questions.length}</span>
            <div style="margin-top: 6px; font-style: italic;">${quiz.description}</div>
          </div>

          <div class="questions">
            ${quiz.questions
              .map(
                (q, idx) => `
              <div class="question-block">
                <div class="q-title"><span class="badge">Q${idx + 1}</span> ${q.question}</div>
                ${
                  q.options && q.options.length > 0
                    ? `<ul class="options">
                        ${q.options
                          .map(
                            (opt, oIdx) => `
                          <li class="option">
                            <strong>${String.fromCharCode(65 + oIdx)})</strong> ${opt}
                          </li>
                        `
                          )
                          .join('')}
                      </ul>`
                    : `<div style="border-bottom: 1px dashed #94a3b8; height: 30px; margin: 15px 0;"></div>`
                }
              </div>
            `
              )
              .join('')}
          </div>

          ${
            includeAnswers
              ? `
            <div class="answer-key">
              <h2>Answer Key & Explanations</h2>
              ${quiz.questions
                .map(
                  (q, idx) => `
                <div style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                  <div><strong>Q${idx + 1}:</strong> 
                    ${
                      q.type === 'multiple_choice' || q.type === 'true_false'
                        ? `${String.fromCharCode(65 + q.correctOptionIndex)}) ${q.options[q.correctOptionIndex]}`
                        : q.type === 'multiple_select' && q.correctIndices
                        ? q.correctIndices.map((i) => `${String.fromCharCode(65 + i)}) ${q.options[i]}`).join(', ')
                        : q.acceptedAnswers?.join(' / ')
                    }
                  </div>
                  <div class="explanation"><em>Explanation:</em> ${q.explanation}</div>
                  ${q.keyTakeaway ? `<div class="explanation"><strong>Key Concept:</strong> ${q.keyTakeaway}</div>` : ''}
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Export & Print Quiz</h3>
              <p className="text-xs text-slate-400">Print worksheets, copy markdown, or export JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Options toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
            <div>
              <p className="text-sm font-semibold text-white">Include Answer Key & Explanations</p>
              <p className="text-xs text-slate-400">Append correct answers & explanations to print/export</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={(e) => setIncludeAnswers(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Export Action Cards */}
          <div className="grid grid-cols-1 gap-3">
            
            {/* Print Action */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Print Test Paper</h4>
                  <p className="text-xs text-slate-400">Formatted cleanly for PDF printing or classroom paper tests</p>
                </div>
              </div>
              <span className="text-xs font-medium text-indigo-400 group-hover:translate-x-0.5 transition-transform">Print &rarr;</span>
            </button>

            {/* Markdown Copy */}
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  {copied ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {copied ? 'Markdown Copied to Clipboard!' : 'Copy as Markdown'}
                  </h4>
                  <p className="text-xs text-slate-400">Formatted for Notion, Obsidian, GitHub, or Discord</p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-400">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>

            {/* JSON Download */}
            <button
              onClick={handleDownloadJSON}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Download JSON</h4>
                  <p className="text-xs text-slate-400">Raw quiz data with questions, answers, and tags</p>
                </div>
              </div>
              <span className="text-xs font-medium text-purple-400">Download</span>
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
