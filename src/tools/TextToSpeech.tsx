import React, { useState } from 'react';
import { Volume2, Play, Download, Loader2, User, Settings2, Trash2 } from 'lucide-react';
import { textToSpeech } from '../services/gemini';
import { cn } from '../lib/utils';

const VOICES: { id: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'; name: string; desc: string }[] = [
  { id: 'Kore', name: 'Kore', desc: 'Warm & Professional' },
  { id: 'Puck', name: 'Puck', desc: 'Energetic & Bright' },
  { id: 'Charon', name: 'Charon', desc: 'Deep & Authoritative' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Calm & Steady' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Soft & Ethereal' },
];

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<typeof VOICES[0]>(VOICES[0]);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setAudioUrl(null);

    try {
      const url = await textToSpeech(text, selectedVoice.id);
      setAudioUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-violet-500" /> Text to Speak
              </h3>
              <span className="text-xs text-black/20 font-mono">{text.length} / 5000</span>
            </div>
            <textarea
              className="w-full h-80 bg-black/5 border-none rounded-2xl p-6 text-lg focus:ring-2 focus:ring-violet-500/20 transition-all resize-none placeholder:text-black/10"
              placeholder="Enter text to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !text.trim()}
                className="px-10 py-4 bg-violet-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-violet-600 disabled:opacity-50 transition-all shadow-xl shadow-violet-500/20"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Generate Audio
              </button>
            </div>
          </div>
        </div>

        {/* Settings & Output */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <h4 className="font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-violet-500" /> Select Voice
            </h4>
            <div className="space-y-2">
              {VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all border flex flex-col gap-1",
                    selectedVoice.id === voice.id 
                      ? "bg-violet-50 border-violet-200 ring-1 ring-violet-200" 
                      : "bg-white border-black/5 hover:bg-black/5"
                  )}
                >
                  <span className={cn("font-bold text-sm", selectedVoice.id === voice.id ? "text-violet-600" : "text-black")}>
                    {voice.name}
                  </span>
                  <span className="text-xs text-black/40">{voice.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {audioUrl && (
            <div className="bg-violet-500 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-violet-500/20">
              <h4 className="font-bold flex items-center gap-2">
                <Play className="w-4 h-4" /> Preview
              </h4>
              <audio controls src={audioUrl} className="w-full h-10 accent-white" />
              <div className="flex gap-2">
                <a 
                  href={audioUrl} 
                  download="speech.mp3"
                  className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-center text-sm font-bold transition-all"
                >
                  Download MP3
                </a>
                <button 
                  onClick={() => setAudioUrl(null)}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
