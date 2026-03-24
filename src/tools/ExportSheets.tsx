import React, { useState } from 'react';
import { Table, Download, FileText, Loader2, Sparkles, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { processFileWithAI } from '../services/gemini';
import * as XLSX from 'xlsx';

export default function ExportSheets() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const handleExtract = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const prompt = "Extract all tabular data from this document. Return the result as a JSON array of objects where each object is a row. Use the first row as headers.";
      const result = await processFileWithAI(file, prompt, "You are a data extraction expert. Return ONLY valid JSON.");
      
      const jsonStr = result?.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr || '[]');
      setData(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
    XLSX.writeFile(wb, "extracted_data.xlsx");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
              <Table className="w-8 h-8 text-teal-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-xl">Extract to Sheets</h3>
              <p className="text-sm text-black/40">Upload a PDF or Image containing tables to extract data.</p>
            </div>

            <label className="block w-full cursor-pointer group">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept=".pdf,image/*"
              />
              <div className="w-full py-10 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-teal-500/50 group-hover:bg-teal-50/50 transition-all">
                <Download className="w-6 h-6 text-black/20 group-hover:text-teal-500" />
                <span className="text-sm font-bold text-black/40 group-hover:text-black">
                  {file ? file.name : 'Select File'}
                </span>
              </div>
            </label>

            <button
              onClick={handleExtract}
              disabled={isLoading || !file}
              className="w-full py-4 bg-teal-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-teal-600 disabled:opacity-50 transition-all shadow-xl shadow-teal-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Extract Data
            </button>
          </div>
        </div>

        {/* Preview & Export */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-500" /> Data Preview
            </h3>
            {data.length > 0 && (
              <button 
                onClick={handleExport}
                className="px-6 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-black/80 transition-all flex items-center gap-2"
              >
                <Download className="w-3 h-3" /> Export .xlsx
              </button>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                <p className="font-bold text-black/60">Analyzing tables...</p>
              </div>
            ) : data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/[0.02] border-b border-black/5">
                    <tr>
                      {Object.keys(data[0]).map((key) => (
                        <th key={key} className="px-6 py-4 font-bold text-black/60 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-black/[0.01] transition-colors">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-6 py-4 text-black/80">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/20 gap-4 py-20">
                <Table className="w-16 h-16 opacity-10" />
                <p className="max-w-[200px]">Extracted table data will be displayed here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
