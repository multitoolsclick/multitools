import React, { useState } from 'react';
import { Image, FileText, Loader2, Download, RefreshCw, ArrowRight, ArrowLeftRight, CheckCircle, Plus, Trash2, Files } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { naturalSort } from '../lib/utils';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Set up pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PDFConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'pdf-to-img' | 'img-to-pdf'>('pdf-to-img');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (mode === 'pdf-to-img') {
      setFiles(selectedFiles.slice(0, 1));
    } else {
      setFiles(prev => naturalSort([...prev, ...selectedFiles], f => f.name));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setResultUrls([]);
    setZipUrl(null);

    try {
      if (mode === 'img-to-pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const file of files) {
          const imgBytes = await file.arrayBuffer();
          let image;
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(imgBytes);
          } else {
            image = await pdfDoc.embedPng(imgBytes);
          }
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setResultUrls([URL.createObjectURL(blob)]);
      } else {
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const urls: string[] = [];
        const zip = new JSZip();

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport, canvas: canvas }).promise;
          const dataUrl = canvas.toDataURL('image/png');
          urls.push(dataUrl);

          // Add to zip
          const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
          zip.file(`${i}.png`, base64Data, { base64: true });
        }

        setResultUrls(urls);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setZipUrl(URL.createObjectURL(zipBlob));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-12 rounded-[3rem] border border-black/5 shadow-sm flex flex-col items-center gap-8">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${mode === 'pdf-to-img' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-black/5 text-black/20'}`}>
            <FileText className="w-10 h-10" />
          </div>
          <button 
            onClick={() => {
              setMode(mode === 'pdf-to-img' ? 'img-to-pdf' : 'pdf-to-img');
              setFiles([]);
              setResultUrls([]);
              setZipUrl(null);
            }}
            className="p-4 bg-black/5 rounded-full hover:bg-black/10 transition-all"
          >
            <ArrowLeftRight className="w-6 h-6 text-amber-500" />
          </button>
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${mode === 'img-to-pdf' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-black/5 text-black/20'}`}>
            <Image className="w-10 h-10" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-3xl font-bold tracking-tight">
            {mode === 'pdf-to-img' ? 'PDF to Image' : 'Image to PDF'}
          </h3>
          <p className="text-black/40 max-w-md">
            {mode === 'pdf-to-img' 
              ? 'Convert each page of your PDF into high-quality images.' 
              : 'Combine your images into a single, professional PDF document.'}
          </p>
        </div>

        {files.length === 0 ? (
          <label className="w-full max-w-md cursor-pointer group">
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              multiple={mode === 'img-to-pdf'}
              accept={mode === 'pdf-to-img' ? '.pdf' : 'image/*'}
            />
            <div className="w-full py-12 border-2 border-dashed border-black/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 group-hover:border-amber-500/50 group-hover:bg-amber-50/50 transition-all">
              <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                <Download className="w-6 h-6" />
              </div>
              <span className="font-bold text-black/40 group-hover:text-black">
                {mode === 'pdf-to-img' ? 'Select PDF File' : 'Select Image Files'}
              </span>
            </div>
          </label>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-3">
              {files.map((file, i) => (
                <div key={i} className="bg-black/5 p-4 rounded-2xl flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {mode === 'pdf-to-img' ? <FileText className="w-5 h-5 text-amber-500" /> : <Image className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{file.name}</p>
                    <p className="text-xs text-black/40">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="p-2 hover:bg-amber-50 rounded-lg text-black/20 hover:text-amber-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {mode === 'img-to-pdf' && (
                <label className="block cursor-pointer group">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  <div className="py-4 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-1 group-hover:border-amber-500/50 group-hover:bg-amber-50/50 transition-all">
                    <Plus className="w-5 h-5 text-black/20 group-hover:text-amber-500" />
                    <span className="text-xs font-bold text-black/40 group-hover:text-black">Add more images</span>
                  </div>
                </label>
              )}
            </div>

            {!resultUrls.length ? (
              <button
                onClick={handleConvert}
                disabled={isLoading}
                className="w-full py-4 bg-amber-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-xl shadow-amber-500/20"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Convert Now
              </button>
            ) : (
              <div className="bg-green-500 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  <h4 className="font-bold">Conversion Complete</h4>
                </div>
                
                {mode === 'pdf-to-img' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {resultUrls.map((url, idx) => (
                        <div key={idx} className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden border border-white/20 relative group">
                          <img src={url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                            Page {idx + 1}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <a href={url} download={`${idx + 1}.png`} className="p-2 bg-white text-green-600 rounded-full shadow-lg">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                    {zipUrl && (
                      <a 
                        href={zipUrl} 
                        download="converted_images.zip"
                        className="block w-full py-4 bg-white text-green-500 rounded-full text-center font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Files className="w-5 h-5" />
                        Download All as ZIP
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden border border-white/20">
                      <img src={resultUrls[0]} alt="Preview" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                    </div>
                    <a 
                      href={resultUrls[0]} 
                      download="converted_document.pdf"
                      className="block w-full py-4 bg-white text-green-500 rounded-full text-center font-bold hover:bg-green-50 transition-all"
                    >
                      Download PDF
                    </a>
                  </div>
                )}
                
                <button 
                  onClick={() => { setFiles([]); setResultUrls([]); setZipUrl(null); }}
                  className="w-full py-2 text-white/60 text-xs font-bold hover:text-white transition-colors"
                >
                  Start New Conversion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
