import React, { useState } from 'react';
import { Mic, Square, Loader2, Play, Download, Trash2, Globe } from 'lucide-react';
import { processFileWithAI } from '../services/gemini';

export default function Transcriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        setIsLoading(true);
        try {
          const prompt = "Please transcribe this audio accurately with timestamps.";
          const result = await processFileWithAI(audioBlob, prompt, undefined, "gemini-3.1-pro-preview");
          setTranscription(result || 'No transcription generated.');
        } catch (err) {
          console.error("Transcription error:", err);
          setTranscription("Error: Failed to transcribe recording.");
        } finally {
          setIsLoading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      setAudioUrl(URL.createObjectURL(file));
      const prompt = "Please transcribe this audio file accurately with timestamps. Identify speakers if possible.";
      const result = await processFileWithAI(file, prompt, undefined, "gemini-3.1-pro-preview");
      setTranscription(result || 'No transcription generated.');
    } catch (err) {
      console.error("Transcription error:", err);
      setTranscription("Error: Failed to transcribe audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-[#F5F5F0] p-8 rounded-[2rem] border border-black/5 flex flex-col items-center justify-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-black'}`}>
              <Mic className="text-white w-10 h-10" />
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-xl">{isRecording ? 'Recording...' : 'Ready to Transcribe'}</h3>
              <p className="text-black/40 text-sm">Capture live audio or upload a file</p>
            </div>

            <div className="flex gap-3">
              {!isRecording ? (
                <button 
                  onClick={handleStartRecording}
                  className="px-6 py-3 bg-black text-white rounded-full font-bold flex items-center gap-2 hover:bg-black/80 transition-all"
                >
                  <Mic className="w-4 h-4" /> Start Recording
                </button>
              ) : (
                <button 
                  onClick={handleStopRecording}
                  className="px-6 py-3 bg-red-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-red-600 transition-all"
                >
                  <Square className="w-4 h-4" /> Stop Recording
                </button>
              )}
            </div>

            <div className="w-full pt-6 border-t border-black/5 space-y-4">
              {audioUrl && (
                <div className="bg-black/5 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Last Processed Audio</p>
                  <audio src={audioUrl} controls className="w-full h-8" />
                </div>
              )}
              <label className="block text-center cursor-pointer group">
                <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileUpload} />
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-black/40 group-hover:text-black transition-colors">
                  <Download className="w-4 h-4" /> Or upload audio/video file
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Globe className="w-4 h-4" /> Settings
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Language</span>
                <select className="bg-black/5 rounded-lg px-2 py-1 font-medium">
                  <option>Auto-detect</option>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Timestamps</span>
                <input type="checkbox" defaultChecked className="accent-black" />
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-[2rem] border border-black/5 flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-bold">Transcription</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setTranscription('')}
                className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
                <p className="font-medium text-black/60">AI is processing your audio...</p>
              </div>
            ) : transcription ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-black/80">
                {transcription}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/30 gap-4">
                <Play className="w-12 h-12 opacity-20" />
                <p>Your transcription will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
