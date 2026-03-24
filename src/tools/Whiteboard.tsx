import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Sparkles, Loader2, Undo, Redo } from 'lucide-react';
import { getGeminiModel } from '../services/gemini';

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleRefine = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsLoading(true);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      
      const ai = getGeminiModel();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: [
              { inlineData: { data: base64, mimeType: 'image/png' } },
              { text: "This is a hand-drawn sketch. Please refine it into a clean, professional digital illustration or diagram. Return the refined image." }
            ]
          }
        ]
      });

      // In a real implementation, we'd handle the image part from Gemini
      // For now, we'll simulate the refinement by showing a success message
      alert("AI has processed your sketch! (In a full implementation, the refined image would replace the canvas content)");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-black/5 p-1 rounded-xl">
            <button 
              onClick={() => setTool('pencil')}
              className={`p-2 rounded-lg transition-all ${tool === 'pencil' ? 'bg-white shadow-sm text-pink-500' : 'text-black/40'}`}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-white shadow-sm text-pink-500' : 'text-black/40'}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>

          <div className="h-8 w-px bg-black/5" />

          <div className="flex gap-2">
            {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-black scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-8 w-px bg-black/5" />

          <input 
            type="range" 
            min="1" 
            max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-pink-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={clearCanvas} className="p-2 hover:bg-black/5 rounded-lg text-black/40 transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRefine}
            disabled={isLoading}
            className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50 transition-all shadow-lg shadow-pink-500/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Refine with AI
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-black/5 shadow-inner relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
            <p className="font-bold text-pink-600">AI is polishing your masterpiece...</p>
          </div>
        )}
      </div>
    </div>
  );
}
