import React, { useState } from 'react';
import { Edit3, Loader2, Sparkles, FileText, Wand2, RefreshCw, CheckCircle, Download } from 'lucide-react';
import { processFileWithAI } from '../services/gemini';

export default function PDFEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!file || !instruction.trim()) return;
    setIsLoading(true);

    try {
      const prompt = `I want to edit this PDF. Instruction: ${instruction}. 
      Please describe exactly what changes should be made to the text, layout, or style. 
      In a real app, I would apply these changes using pdf-lib. For now, provide a detailed editing report.`;
      
      const response = await processFileWithAI(file, prompt, "You are an expert PDF editor assistant.");
      setResult(response || '');
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
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl">AI PDF Editor</h3>
                <p className="text-sm text-black/40">Modify text, style, or layout with AI.</p>
              </div>
            </div>

            <label className="block w-full cursor-pointer group">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept=".pdf"
              />
              <div className="w-full py-10 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-purple-500/50 group-hover:bg-purple-50/50 transition-all">
                <FileText className="w-6 h-6 text-black/20 group-hover:text-purple-500" />
                <span className="text-sm font-bold text-black/40 group-hover:text-black">
                  {file ? file.name : 'Select PDF to Edit'}
                </span>
              </div>
            </label>

            <div className="space-y-2">
              <label className="text-xs font-bold text-black/40 uppercase tracking-widest">Editing Instructions</label>
              <textarea
                className="w-full h-32 bg-black/5 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500/20 transition-all resize-none placeholder:text-black/10"
                placeholder="e.g., Change the date to 2025, make the header font larger, or rewrite the second paragraph to be more formal..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </div>

            <button
              onClick={handleEdit}
              disabled={isLoading || !file || !instruction.trim()}
              className="w-full py-4 bg-purple-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-purple-600 disabled:opacity-50 transition-all shadow-xl shadow-purple-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              Apply AI Edits
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> Editing Preview
            </h3>
            {result && (
              <button 
                onClick={() => setResult(null)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-black/40" />
              </button>
            )}
          </div>
          <div className="flex-1 p-8 relative overflow-y-auto">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                <p className="font-bold text-black/60">AI is analyzing and editing...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-800 font-medium">Changes have been simulated based on your instructions.</p>
                </div>
                <div className="prose prose-sm max-w-none text-black/80">
                  {result}
                </div>
                <button className="w-full py-4 bg-black text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all">
                  <Download className="w-4 h-4" /> Download Edited PDF
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/20 gap-4">
                <Edit3 className="w-16 h-16 opacity-10" />
                <p className="max-w-[200px]">Your edited document preview will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
