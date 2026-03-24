import React, { useState } from 'react';
import { Target, Loader2, Sparkles, Download, FileText, Layout, TrendingUp, AlertCircle } from 'lucide-react';
import { generateText } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export default function Planner() {
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsLoading(true);

    try {
      const prompt = `Generate a comprehensive strategic plan based on this description: ${description}. 
      Include:
      1. Executive Summary
      2. SWOT Analysis
      3. Key Objectives
      4. Action Items & Timeline
      5. Resource Allocation
      6. Risk Assessment
      Use professional business language and markdown formatting.`;
      
      const result = await generateText(prompt, "You are a world-class strategic consultant and business planner.");
      setPlan(result || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Target className="w-6 h-6 text-emerald-500" /> Strategic Brief
              </h3>
              <p className="text-sm text-black/40">Describe your project, business idea, or challenge.</p>
            </div>

            <textarea
              className="w-full h-64 bg-black/5 border-none rounded-2xl p-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none placeholder:text-black/10"
              placeholder="e.g., We are launching a sustainable coffee brand in Berlin targeting Gen Z..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button
              onClick={handleGenerate}
              disabled={isLoading || !description.trim()}
              className="w-full py-4 bg-emerald-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Plan
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-black/5 flex flex-col items-center gap-2 text-center">
              <Layout className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold text-black/60 uppercase">SWOT</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-black/5 flex flex-col items-center gap-2 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold text-black/60 uppercase">Growth</span>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-black/5 shadow-sm flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" /> Strategic Report
            </h3>
            {plan && (
              <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-black/80 transition-all">
                <Download className="w-3 h-3" /> Export PDF
              </button>
            )}
          </div>
          <div className="flex-1 p-8 relative overflow-y-auto max-h-[800px]">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="font-bold text-black/60">Synthesizing strategy...</p>
              </div>
            ) : plan ? (
              <div className="prose prose-emerald max-w-none">
                <ReactMarkdown>{plan}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/20 gap-4">
                <Target className="w-16 h-16 opacity-10" />
                <p className="max-w-[250px]">Your comprehensive strategic plan will be generated here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
