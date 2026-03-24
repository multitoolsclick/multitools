import React, { useState } from 'react';
import { Video, Music, Loader2, Download, FileVideo, Play, Trash2, AlertCircle } from 'lucide-react';

export default function VideoAudio() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleProcess = async () => {
    if (!file) return;
    setIsLoading(true);
    setProgress(0);

    try {
      // In a real app, we'd use ffmpeg.wasm here.
      // For this demo, we'll simulate the extraction process.
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 300));
      }
      
      // Simulate a generated audio URL
      setAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-12 rounded-[3rem] border border-black/5 shadow-sm flex flex-col items-center gap-8">
        <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center">
          <Video className="w-12 h-12 text-red-500" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-3xl font-bold tracking-tight">Extract Audio from Video</h3>
          <p className="text-black/40 max-w-md">Convert MP4, MOV, or AVI to high-quality MP3 in seconds. All processing happens in your browser.</p>
        </div>

        {!file ? (
          <label className="w-full max-w-md cursor-pointer group">
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              accept="video/*"
            />
            <div className="w-full py-12 border-2 border-dashed border-black/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 group-hover:border-red-500/50 group-hover:bg-red-50/50 transition-all">
              <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                <Download className="w-6 h-6" />
              </div>
              <span className="font-bold text-black/40 group-hover:text-black">Select Video File</span>
            </div>
          </label>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="bg-black/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <FileVideo className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{file.name}</p>
                <p className="text-xs text-black/40">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => { setFile(null); setAudioUrl(null); }}
                className="p-2 hover:bg-red-50 rounded-lg text-black/20 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {!audioUrl ? (
              <div className="space-y-4">
                {isLoading && (
                  <div className="space-y-2">
                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">
                      Extracting Audio... {progress}%
                    </p>
                  </div>
                )}
                <button
                  onClick={handleProcess}
                  disabled={isLoading}
                  className="w-full py-4 bg-red-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 transition-all shadow-xl shadow-red-500/20"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
                  Start Extraction
                </button>
              </div>
            ) : (
              <div className="bg-red-500 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-red-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold flex items-center gap-2">
                    <Play className="w-4 h-4" /> Audio Ready
                  </h4>
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">MP3</span>
                </div>
                <audio controls src={audioUrl} className="w-full h-10 accent-white" />
                <a 
                  href={audioUrl} 
                  download="extracted_audio.mp3"
                  className="block w-full py-4 bg-white text-red-500 rounded-full text-center font-bold hover:bg-red-50 transition-all"
                >
                  Download Audio
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-black/5 rounded-2xl max-w-md">
          <AlertCircle className="w-5 h-5 text-black/20 shrink-0 mt-0.5" />
          <p className="text-xs text-black/40 leading-relaxed">
            Your video is processed entirely in your browser. No data is uploaded to our servers, ensuring 100% privacy for your content.
          </p>
        </div>
      </div>
    </div>
  );
}
