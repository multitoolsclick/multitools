import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { TOOLS } from './constants';
import { Tool, ToolCategory } from './types';
import { cn } from './lib/utils';

// Tool Components (to be implemented)
import Transcriber from './tools/Transcriber';
import ImageToText from './tools/ImageToText';
import PDFCopilot from './tools/PDFCopilot';
import PDFEditor from './tools/PDFEditor';
import Whiteboard from './tools/Whiteboard';
import Organizer from './tools/Organizer';
import Planner from './tools/Planner';
import Translator from './tools/Translator';
import Grammar from './tools/Grammar';
import PDFManager from './tools/PDFManager';
import PDFConverter from './tools/PDFConverter';
import ExportSheets from './tools/ExportSheets';
import VideoAudio from './tools/VideoAudio';
import TextToSpeech from './tools/TextToSpeech';
import Summarizer from './tools/Summarizer';

const CATEGORIES: { id: ToolCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Tools' },
  { id: 'document', label: 'Documents' },
  { id: 'media', label: 'Media' },
  { id: 'writing', label: 'Writing' },
  { id: 'planning', label: 'Planning' },
  { id: 'data', label: 'Data' },
];

export default function App() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const renderTool = () => {
    if (!selectedTool) return null;
    switch (selectedTool.id) {
      case 'transcriber': return <Transcriber />;
      case 'image-to-text': return <ImageToText />;
      case 'pdf-copilot': return <PDFCopilot />;
      case 'pdf-editor': return <PDFEditor />;
      case 'whiteboard': return <Whiteboard />;
      case 'organizer': return <Organizer />;
      case 'planner': return <Planner />;
      case 'translator': return <Translator />;
      case 'grammar': return <Grammar />;
      case 'pdf-manager': return <PDFManager />;
      case 'pdf-converter': return <PDFConverter />;
      case 'export-sheets': return <ExportSheets />;
      case 'video-audio': return <VideoAudio />;
      case 'tts': return <TextToSpeech />;
      case 'summarizer': return <Summarizer />;
      default: return <div className="p-8 text-center">Tool coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setSelectedTool(null)}
          >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Icons.Zap className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">MultiTools</h1>
          </div>
          
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full bg-black/5 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-black/10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <Icons.Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!selectedTool ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4 py-12">
                <h2 className="text-5xl font-bold tracking-tight md:text-6xl">
                  Everything you need, <br />
                  <span className="text-black/40 italic serif">powered by AI.</span>
                </h2>
                <p className="text-lg text-black/60 max-w-2xl mx-auto">
                  A comprehensive suite of tools for processing audio, video, documents, and data.
                  Fast, secure, and intelligent.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 justify-center">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      activeCategory === cat.id
                        ? "bg-black text-white shadow-lg"
                        : "bg-white text-black/60 hover:bg-black/5 border border-black/5"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTools.map((tool) => {
                  const Icon = Icons[tool.icon as keyof typeof Icons] as any;
                  return (
                    <motion.div
                      key={tool.id}
                      layoutId={tool.id}
                      onClick={() => setSelectedTool(tool)}
                      whileHover={{ y: -4 }}
                      className="group bg-white p-6 rounded-3xl border border-black/5 hover:border-black/10 hover:shadow-xl transition-all cursor-pointer flex flex-col gap-4"
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", tool.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-black transition-colors">{tool.name}</h3>
                        <p className="text-sm text-black/50 line-clamp-2">{tool.description}</p>
                      </div>
                      <div className="mt-auto pt-4 flex items-center text-xs font-bold uppercase tracking-widest text-black/30 group-hover:text-black transition-colors">
                        Open Tool <Icons.ArrowRight className="ml-2 w-3 h-3" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tool-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-black/5 shadow-2xl overflow-hidden min-h-[70vh] flex flex-col"
            >
              {/* Tool Header */}
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedTool(null)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  >
                    <Icons.ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", selectedTool.color)}>
                      {React.createElement(Icons[selectedTool.icon as keyof typeof Icons] as any, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-none">{selectedTool.name}</h2>
                      <p className="text-sm text-black/40 mt-1">{selectedTool.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-black/80 transition-colors">
                    Share
                  </button>
                </div>
              </div>

              {/* Tool Content */}
              <div className="flex-1 overflow-auto p-8">
                {renderTool()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-black/5 text-center">
        <p className="text-black/40 text-sm">
          &copy; 2026 MultiTools. Built with Google Gemini.
        </p>
      </footer>
    </div>
  );
}
