import React, { useState } from 'react';
import { Files, Merge, Scissors, RotateCw, Loader2, Download, Trash2, FileText, CheckCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { naturalSort } from '../lib/utils';

export default function PDFManager() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => {
      const combined = [...prev, ...selectedFiles];
      return naturalSort(combined, f => f.name);
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsLoading(true);

    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Files className="w-6 h-6 text-rose-500" /> PDF Files
              </h3>
              <span className="text-xs font-bold text-black/20 uppercase tracking-widest">{files.length} selected</span>
            </div>

            <div className="space-y-3">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-black/[0.02] rounded-2xl border border-black/5 group hover:bg-black/[0.04] transition-all">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{file.name}</p>
                    <p className="text-xs text-black/40">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="block cursor-pointer group">
                <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} />
                <div className="py-8 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-rose-500/50 group-hover:bg-rose-50/50 transition-all">
                  <PlusIcon className="w-6 h-6 text-black/20 group-hover:text-rose-500" />
                  <span className="text-sm font-bold text-black/40 group-hover:text-black">Add more PDFs</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <h4 className="font-bold">Operations</h4>
            <div className="space-y-2">
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || isLoading}
                className="w-full p-4 rounded-2xl bg-rose-500 text-white font-bold flex items-center justify-between hover:bg-rose-600 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/20"
              >
                <div className="flex items-center gap-3">
                  <Merge className="w-5 h-5" />
                  <span>Merge PDFs</span>
                </div>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
              
              <button disabled className="w-full p-4 rounded-2xl bg-black/5 text-black/40 font-bold flex items-center justify-between cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5" />
                  <span>Split PDF</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest">Soon</span>
              </button>

              <button disabled className="w-full p-4 rounded-2xl bg-black/5 text-black/40 font-bold flex items-center justify-between cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <RotateCw className="w-5 h-5" />
                  <span>Rotate Pages</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest">Soon</span>
              </button>
            </div>
          </div>

          {resultUrl && (
            <div className="bg-green-500 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                <h4 className="font-bold">PDF Ready</h4>
              </div>
              <p className="text-sm text-white/80">Your files have been successfully merged.</p>
              <a 
                href={resultUrl} 
                download="merged_document.pdf"
                className="block w-full py-4 bg-white text-green-500 rounded-full text-center font-bold hover:bg-green-50 transition-all"
              >
                Download Result
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
