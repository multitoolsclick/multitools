import React, { useState } from 'react';
import { Layers, Loader2, Sparkles, Plus, Trash2, Tag, Filter } from 'lucide-react';
import { generateText } from '../services/gemini';
import { cn } from '../lib/utils';

interface OrganizedItem {
  category: string;
  items: string[];
}

export default function Organizer() {
  const [input, setInput] = useState('');
  const [organizedData, setOrganizedData] = useState<OrganizedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOrganize = async () => {
    if (!input.trim()) return;
    setIsLoading(true);

    try {
      const prompt = `Organize the following raw data into logical categories. Return the result as a JSON array of objects with 'category' (string) and 'items' (string array) properties. 
      Data: ${input}`;
      
      const result = await generateText(prompt, "You are a data organization expert. Return ONLY valid JSON.");
      
      // Clean up the response to ensure it's valid JSON
      const jsonStr = result?.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr || '[]');
      setOrganizedData(parsed);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      // Fallback or error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Layers className="w-6 h-6 text-orange-500" /> Raw Data Input
            </h3>
            <p className="text-sm text-black/40">Paste lists, notes, or unorganized text below.</p>
            
            <textarea
              className="w-full h-80 bg-black/5 border-none rounded-2xl p-6 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all resize-none placeholder:text-black/10"
              placeholder="e.g., Buy milk, Call John, Finish report, Meeting at 3pm, Pay bills..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button
              onClick={handleOrganize}
              disabled={isLoading || !input.trim()}
              className="w-full py-4 bg-orange-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Organize Data
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-500" /> Organized View
            </h3>
            {organizedData.length > 0 && (
              <button 
                onClick={() => setOrganizedData([])}
                className="text-xs font-bold text-black/40 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-[2rem] border border-black/5 p-12 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <p className="font-bold text-black/60">Categorizing items...</p>
              </div>
            ) : organizedData.length > 0 ? (
              organizedData.map((group, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                    <h4 className="font-bold text-orange-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> {group.category}
                    </h4>
                    <span className="text-xs font-bold text-orange-400 bg-white px-2 py-1 rounded-lg">
                      {group.items.length} items
                    </span>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 bg-black/[0.02] rounded-xl text-sm text-black/70 hover:bg-black/[0.04] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[2rem] border border-black/5 p-20 flex flex-col items-center justify-center text-center gap-4">
                <Layers className="w-16 h-16 text-black/5" />
                <p className="text-black/30 max-w-[200px]">Organized categories will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
