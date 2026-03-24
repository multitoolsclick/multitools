import React, { useState, useMemo } from 'react';
import { Image as ImageIcon, Loader2, Download, Trash2, FileText, File as FileIcon, Plus, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { processFileWithAI } from '../services/gemini';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { cn, naturalSort } from '../lib/utils';

interface ProcessedImage {
  id: string;
  sequenceNumber: number;
  file: File;
  preview: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'quota_exceeded';
}

const LANGUAGES = [
  'Auto-detect', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 
  'Italian', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Bengali', 'Vietnamese'
];

export default function ImageToText() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedLang, setSelectedLang] = useState('Auto-detect');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const combinedText = useMemo(() => {
    return images
      .filter(img => img.status === 'completed')
      .map((img, index) => `[Image ${index + 1}: ${img.file.name}]\n\n${img.text}`)
      .join('\n\n' + '='.repeat(40) + '\n\n');
  }, [images]);

  const handleCopyAll = () => {
    if (!combinedText) return;
    navigator.clipboard.writeText(combinedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAllProcessed = useMemo(() => {
    return images.length > 0 && images.every(img => img.status === 'completed' || img.status === 'error' || img.status === 'quota_exceeded');
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const sortedFiles = naturalSort(files, f => f.name);
    
    setImages(prev => {
      const startNumber = prev.length > 0 ? Math.max(...prev.map(img => img.sequenceNumber)) + 1 : 1;
      const newImages: ProcessedImage[] = sortedFiles.map((file, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        sequenceNumber: startNumber + index,
        file,
        preview: URL.createObjectURL(file),
        text: '',
        status: 'pending'
      }));
      return [...prev, ...newImages];
    });
  };

  const processImage = async (id: string): Promise<boolean> => {
    const image = images.find(img => img.id === id);
    if (!image || image.status === 'processing') return true;

    setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'processing' } : img));

    try {
      const langInstruction = selectedLang === 'Auto-detect' 
        ? "Detect the language automatically and provide the text in that same language."
        : `The text is in ${selectedLang}. Please extract it accurately in ${selectedLang}.`;

      const prompt = `Extract all text from this image. Maintain the original formatting, layout, and structure as much as possible. ${langInstruction} Arrange the text based on the visual context of the image. Do not add any explanations, just the extracted text.`;
      const text = await processFileWithAI(image.file, prompt);
      
      setImages(prev => prev.map(img => img.id === id ? { 
        ...img, 
        text: text || '', 
        status: 'completed' 
      } : img));
      return true;
    } catch (error: any) {
      console.error('Error processing image:', error);
      const isQuota = error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429');
      setImages(prev => prev.map(img => img.id === id ? { 
        ...img, 
        status: isQuota ? 'quota_exceeded' : 'error' 
      } : img));
      return false;
    }
  };

  const processAll = async (startIndex = 0) => {
    setIsProcessingAll(true);
    setIsPaused(false);
    setErrorInfo(null);
    
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error' || img.status === 'quota_exceeded');
    
    for (let i = startIndex; i < pendingImages.length; i++) {
      const img = pendingImages[i];
      const success = await processImage(img.id);
      
      if (!success) {
        setIsProcessingAll(false);
        setIsPaused(true);
        setErrorInfo({ id: img.id, name: img.file.name });
        return; // Stop processing further
      }
    }
    setIsProcessingAll(false);
  };

  const handleRetry = () => {
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error' || img.status === 'quota_exceeded');
    const currentIndex = pendingImages.findIndex(img => img.id === errorInfo?.id);
    if (currentIndex !== -1) {
      processAll(currentIndex);
    } else {
      processAll(0);
    }
  };

  const handleContinue = () => {
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error' || img.status === 'quota_exceeded');
    // Find the index of the image that failed to resume from there
    const nextIndex = pendingImages.findIndex(img => img.id === errorInfo?.id);
    if (nextIndex !== -1) {
      processAll(nextIndex + 1);
    } else {
      processAll(0);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id === id);
      filtered.forEach(img => URL.revokeObjectURL(img.preview));
      return prev.filter(img => img.id !== id);
    });
  };

  const downloadAsText = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image || !image.text) return;

    const blob = new Blob([image.text], { type: 'text/plain' });
    saveAs(blob, `${image.file.name.split('.')[0]}.txt`);
  };

  const downloadAsWord = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image || !image.text) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: image.text.split('\n').map(line => 
          new Paragraph({
            children: [new TextRun(line)],
          })
        ),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${image.file.name.split('.')[0]}.docx`);
  };

  const downloadAllAsText = () => {
    const completedImages = images.filter(img => img.status === 'completed');
    if (completedImages.length === 0) return;

    const combinedText = completedImages.map(img => `--- ${img.file.name} ---\n\n${img.text}`).join('\n\n\n');
    const blob = new Blob([combinedText], { type: 'text/plain' });
    saveAs(blob, `extracted_text_all.txt`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Image to Text (OCR)</h2>
          <p className="text-black/50">Upload images to extract text with original formatting.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-full px-4 py-2 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">Language:</span>
            <select 
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer outline-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <label className="px-6 py-3 bg-black text-white rounded-full font-bold flex items-center gap-2 cursor-pointer hover:bg-black/80 transition-all">
            <Plus className="w-4 h-4" /> Add Images
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          {images.length > 0 && (
            <button 
              onClick={() => processAll(0)}
              disabled={isProcessingAll}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Process All
            </button>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <div className="bg-[#F5F5F0] border-2 border-dashed border-black/10 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-black/20" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-xl">No images uploaded</h3>
            <p className="text-black/40 max-w-xs">Drag and drop your images here or use the "Add Images" button above.</p>
          </div>
        </div>
      ) : !isAllProcessed ? (
        <div className="bg-white rounded-[2rem] border border-black/5 p-12 flex flex-col items-center justify-center text-center gap-6 shadow-sm">
          {isPaused ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-2xl text-amber-900">Processing Paused</h3>
                <p className="text-black/60 max-w-sm mx-auto">
                  An error occurred while processing <span className="font-bold text-black">"{errorInfo?.name}"</span>. 
                  Would you like to skip this file and continue with the rest?
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => { setIsPaused(false); setIsProcessingAll(false); setErrorInfo(null); }}
                  className="px-8 py-3 bg-black/5 text-black rounded-full font-bold hover:bg-black/10 transition-all"
                >
                  Stop
                </button>
                <button 
                  onClick={handleRetry}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry This File
                </button>
                <button 
                  onClick={handleContinue}
                  className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-black/80 transition-all"
                >
                  Skip & Continue
                </button>
              </div>
            </div>
          ) : images.length === 1 ? (
            <div className="flex flex-col md:flex-row items-center gap-8 max-w-2xl text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-48 h-48 rounded-[2rem] overflow-hidden border border-black/5 shadow-lg relative bg-black/5">
                <img src={images[0].preview} alt="Preview" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing
                </div>
                <h3 className="font-bold text-3xl tracking-tight">Extracting text...</h3>
                <p className="text-black/40 leading-relaxed">
                  Our AI is currently analyzing <span className="text-black font-medium">{images[0].file.name}</span> to extract all text while preserving its original layout and formatting.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-2xl">Processing Bulk Upload</h3>
                  <p className="text-black/40 text-sm max-w-sm">
                    Extracting text from {images.length} images. Please keep this tab open.
                  </p>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-black/30">
                  <span>Overall Progress</span>
                  <span>{Math.round((images.filter(img => img.status === 'completed' || img.status === 'error' || img.status === 'quota_exceeded').length / images.length) * 100)}%</span>
                </div>
                <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500" 
                    style={{ width: `${(images.filter(img => img.status === 'completed' || img.status === 'error' || img.status === 'quota_exceeded').length / images.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-center text-xs font-bold text-indigo-600">
                  {images.filter(img => img.status === 'completed' || img.status === 'error' || img.status === 'quota_exceeded').length} of {images.length} files processed
                </p>
              </div>

              {/* Individual Progress Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-black/5 bg-black/5 group">
                    <img src={img.preview} alt="" className={cn("w-full h-full object-cover transition-opacity", img.status === 'processing' ? 'opacity-40' : 'opacity-20')} />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                      {img.status === 'processing' ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">Extracting...</span>
                        </div>
                      ) : img.status === 'completed' ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-bold text-green-600 uppercase">Done</span>
                        </div>
                      ) : img.status === 'pending' ? (
                        <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Waiting</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                          <span className="text-[10px] font-bold text-red-600 uppercase">Failed</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        #{img.sequenceNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Bulk Extraction Complete</h3>
                <p className="text-black/40 text-sm">All text has been merged into the single view below.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleCopyAll}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-black/80 transition-all shadow-xl"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy All Data'}
              </button>
              <button 
                onClick={downloadAllAsText}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                <Download className="w-4 h-4" />
                Download TXT
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-[3rem] border border-black/5 p-10 shadow-2xl relative">
            <div className="max-h-[600px] overflow-auto pr-6 custom-scrollbar">
              <pre className="whitespace-pre-wrap font-mono text-sm text-black/80 leading-relaxed">
                {combinedText}
              </pre>
            </div>
          </div>

          {/* Individual Previews (Minimized) */}
          <div className="pt-8 border-t border-black/5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-black/30">Source Images ({images.length})</h4>
              <div className="flex gap-4 items-center">
                {images.some(img => img.status === 'error' || img.status === 'quota_exceeded') && (
                  <button 
                    onClick={() => processAll(0)}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry All Failed
                  </button>
                )}
                <button 
                  onClick={() => setImages([])}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {images.map((img, idx) => (
                <div key={img.id} className={`aspect-square bg-black/5 rounded-2xl overflow-hidden border relative group ${img.status === 'error' || img.status === 'quota_exceeded' ? 'border-red-200' : 'border-black/5'}`}>
                  <img src={img.preview} alt="" className={`w-full h-full object-cover transition-opacity ${img.status === 'error' || img.status === 'quota_exceeded' ? 'opacity-40' : 'opacity-60 group-hover:opacity-100'}`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                      #{img.sequenceNumber}
                    </span>
                    {(img.status === 'error' || img.status === 'quota_exceeded') && (
                      <button 
                        onClick={() => {
                          setErrorInfo({ id: img.id, name: img.file.name });
                          processImage(img.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        title="Retry processing this image"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
