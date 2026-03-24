import React, { useState, useRef } from 'react';
import { Send, FileText, Loader2, User, Bot, Paperclip } from 'lucide-react';
import { processFileWithAI } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PDFCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessages([{ role: 'assistant', content: `I've loaded **${selectedFile.name}**. How can I help you with it?` }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !file) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await processFileWithAI(
        file,
        userMessage,
        "You are a helpful PDF assistant. Answer questions based on the provided PDF content. Use markdown for formatting."
      );
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'Sorry, I couldn\'t process that.' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not process the PDF.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20">
          <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center">
            <FileText className="w-10 h-10 text-indigo-500" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Upload a PDF to start chatting</h3>
            <p className="text-black/40">Ask questions, summarize, or extract data from any document.</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-black text-white rounded-full font-bold flex items-center gap-2 hover:bg-black/80 transition-all shadow-xl"
          >
            <Paperclip className="w-5 h-5" /> Select PDF File
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-[#F5F5F0] rounded-[2rem] border border-black/5 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white border border-black/5 rounded-tl-none shadow-sm'
                }`}>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-black/5">
            <div className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask anything about ${file.name}...`}
                className="flex-1 bg-black/5 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-black/80 disabled:opacity-50 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
