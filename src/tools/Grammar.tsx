import React, { useState } from 'react';
import { CheckCircle, Loader2, Sparkles, Copy, Check, RefreshCw, Type } from 'lucide-react';
import { generateText } from '../services/gemini';
import { cn } from '../lib/utils';

export default function Grammar() {
  const [text, setText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'professional' | 'casual' | 'academic' | 'creative'>('professional');

  const handleCorrect = async () => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      const prompt = `Correct the grammar, spelling, and punctuation of the following text. Also, adjust the tone to be ${tone}. Return only the corrected text.\n\nText: ${text}`;
      const result = await generateText(prompt, "You are an expert editor and grammarian.");
      setCorrectedText(result || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Type className="w-5 h-5 text-green-500" /> Original Text
            </h3>
            <textarea
              className="w-full h-64 bg-black/5 border-none rounded-2xl p-6 text-lg focus:ring-2 focus:ring-green-500/20 transition-all resize-none placeholder:text-black/10"
              placeholder="Paste text to correct..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <h4 className="font-bold">Tone & Style</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['professional', 'casual', 'academic', 'creative'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    tone === t 
                      ? "bg-black text-white shadow-lg" 
                      : "bg-black/5 text-black/40 hover:bg-black/10"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={handleCorrect}
              disabled={isLoading || !text.trim()}
              className="w-full py-4 bg-green-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50 transition-all shadow-xl shadow-green-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Correct & Refine
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" /> Corrected Version
            </h3>
            <div className="flex gap-2">
              {correctedText && (
                <>
                  <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40" />}
                  </button>
                  <button 
                    onClick={() => setCorrectedText('')}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-black/40" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 p-8 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                <p className="font-bold text-black/60">Polishing your writing...</p>
              </div>
            ) : correctedText ? (
              <div className="prose prose-sm max-w-none">
                <div className="text-lg leading-relaxed text-black/80 whitespace-pre-wrap">
                  {correctedText}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/20 gap-4">
                <CheckCircle className="w-16 h-16 opacity-10" />
                <p className="max-w-[200px]">Your corrected text will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
