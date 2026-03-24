import React, { useState } from 'react';
import { Wand2, Download, FileText, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { processFileWithAI } from '../services/gemini';

export default function Summarizer() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<'bullet' | 'paragraph' | 'executive'>('bullet');

  const handleSummarize = async () => {
    if (!file && !text) return;
    setIsLoading(true);

    try {
      let result = '';
      const prompt = `Summarize the following content as a ${summaryType}. Be concise and highlight key insights.`;
      
      if (file) {
        result = await processFileWithAI(file, prompt);
      } else {
        const { generateText } = await import('../services/gemini');
        result = await generateText(`${prompt}\n\nContent: ${text}`);
      }
      setSummary(result || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" /> Input Content
            </h3>
            
            <textarea
              className="w-full h-64 bg-black/5 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none"
              placeholder="Paste your text here or upload a document..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-black/5" />
              <span className="text-xs font-bold text-black/20 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-black/5" />
            </div>

            <label className="block w-full cursor-pointer group">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept=".pdf,.docx,.txt"
              />
              <div className="w-full py-4 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-yellow-500/50 group-hover:bg-yellow-50/50 transition-all">
                <Download className="w-6 h-6 text-black/20 group-hover:text-yellow-500" />
                <span className="text-sm font-medium text-black/40 group-hover:text-black">
                  {file ? file.name : 'Upload PDF, DOCX, or TXT'}
                </span>
              </div>
            </label>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <h4 className="font-bold">Summary Options</h4>
            <div className="grid grid-cols-3 gap-2">
              {(['bullet', 'paragraph', 'executive'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSummaryType(type)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    summaryType === type 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-black/5 text-black/40 hover:bg-black/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={handleSummarize}
              disabled={isLoading || (!text && !file)}
              className="w-full py-4 bg-yellow-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-yellow-600 disabled:opacity-50 transition-all shadow-xl shadow-yellow-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              Generate Summary
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" /> AI Summary
            </h3>
            {summary && (
              <button 
                onClick={() => setSummary('')}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-black/40" />
              </button>
            )}
          </div>
          <div className="flex-1 p-8 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                <p className="font-bold text-black/60">Synthesizing insights...</p>
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none prose-yellow">
                <div className="whitespace-pre-wrap leading-relaxed text-black/80">
                  {summary}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/20 gap-4">
                <Sparkles className="w-16 h-16 opacity-10" />
                <p className="max-w-[200px]">Your intelligent summary will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
