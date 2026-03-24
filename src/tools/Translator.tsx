import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Loader2, Copy, Check, Volume2 } from 'lucide-react';
import { generateText, textToSpeech } from '../services/gemini';
import { cn } from '../lib/utils';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 
  'Italian', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Bengali', 'Vietnamese'
];

export default function Translator() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('Auto-detect');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);

    try {
      const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Preserve the original tone, idioms, and context. Only return the translated text.\n\nText: ${sourceText}`;
      const result = await generateText(prompt, "You are a professional translator with expertise in 100+ languages.");
      setTranslatedText(result || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (!translatedText || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioUrl = await textToSpeech(translatedText);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'Auto-detect') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Language Selectors */}
      <div className="flex items-center justify-center gap-4">
        <select 
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="bg-white border border-black/5 rounded-2xl px-6 py-3 font-bold text-sm shadow-sm focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
        >
          <option>Auto-detect</option>
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>

        <button 
          onClick={swapLanguages}
          className="p-3 bg-white border border-black/5 rounded-full hover:bg-black/5 transition-all shadow-sm"
        >
          <ArrowRightLeft className="w-5 h-5 text-cyan-500" />
        </button>

        <select 
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-white border border-black/5 rounded-2xl px-6 py-3 font-bold text-sm shadow-sm focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
        >
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
            <span className="text-xs font-bold uppercase tracking-widest text-black/40">{sourceLang}</span>
            <span className="text-xs text-black/20">{sourceText.length} characters</span>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Type or paste text to translate..."
            className="flex-1 min-h-[300px] p-6 text-lg border-none focus:ring-0 resize-none placeholder:text-black/10"
          />
          <div className="p-4 bg-black/[0.02] flex justify-end">
            <button 
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              className="px-8 py-3 bg-cyan-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-cyan-600 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              Translate
            </button>
          </div>
        </div>

        {/* Target */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
            <span className="text-xs font-bold uppercase tracking-widest text-black/40">{targetLang}</span>
            <div className="flex gap-2">
              <button 
                onClick={handleSpeak}
                disabled={!translatedText || isSpeaking}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors disabled:opacity-30"
              >
                <Volume2 className={cn("w-4 h-4", isSpeaking ? "text-cyan-500 animate-pulse" : "text-black/40")} />
              </button>
              <button 
                onClick={handleCopy}
                disabled={!translatedText}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors disabled:opacity-30"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40" />}
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 text-lg leading-relaxed text-black/80 min-h-[300px] whitespace-pre-wrap">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                <div className="w-12 h-2 bg-black/10 rounded-full animate-pulse" />
                <div className="w-24 h-2 bg-black/10 rounded-full animate-pulse" />
                <div className="w-16 h-2 bg-black/10 rounded-full animate-pulse" />
              </div>
            ) : translatedText || (
              <span className="text-black/10 italic">Translation will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
