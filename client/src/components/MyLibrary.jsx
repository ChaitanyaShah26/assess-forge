import React, { useState, useEffect } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { FolderOpen, Cloud, Trash2, Eye, FileText, X, RefreshCw } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function MyLibrary() {
  const { library, fetchLibrary, uploadToLibrary, deleteFromLibrary } = useAssessStore();
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [isReadingText, setIsReadingText] = useState(false);
  const [readTextContent, setReadTextContent] = useState('');

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadToLibrary(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadToLibrary(file);
  };

  // RESOLVED: Query our new API endpoint to retrieve the actual parsed text of this library document
  const handleInspectText = async (doc) => {
    setSelectedDocForPreview(doc);
    setIsReadingText(true);
    setReadTextContent('Loading document text streams...');
    
    try {
      const res = await fetch(`${API_BASE}/api/assignments/library/${doc._id}/text`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setReadTextContent(data.text || 'This document is empty.');
      } else {
        setReadTextContent(data.error || 'Failed to extract text characters from document.');
      }
    } catch (e) {
      console.error('Failed to fetch library document parsed text:', e);
      setReadTextContent('Failed to establish connection to the document parser server.');
    } finally {
      setIsReadingText(false);
    }
  };

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 select-none px-2 lg:px-0 relative">
      <div>
        <h1 className="text-xl font-bold text-brand-dark font-heading">Document Vault Repository</h1>
        <p className="text-sm text-brand-muted font-heading mt-0.5">Upload syllabus sheets and textbook chapters to use as context references.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Upload card dropzone */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-brand-dark font-heading">Upload New Material</h3>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="w-full h-[180px] bg-zinc-50 border-2 border-dashed border-brand-line-grey rounded-2xl flex flex-col justify-center items-center gap-3 cursor-pointer relative hover:bg-zinc-100/50 transition-colors"
          >
            <input type="file" accept=".txt,.pdf" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Cloud className="w-8 h-8 text-brand-orange" />
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-sm font-semibold text-brand-dark font-heading">Choose a file or drag & drop</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">TXT, PDF upto 10MB</span>
            </div>
          </div>
        </div>

        {/* Right Side: Documents Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-brand-dark font-heading border-b border-gray-100 pb-2">Indexed Library Documents ({library.length})</h3>
          
          {library.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 font-heading text-sm">
              Your library is empty. Upload reference files to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {library.map((doc) => (
                <div key={doc._id} className="bg-zinc-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div className="flex flex-col overflow-hidden text-left">
                      <span className="text-sm font-bold text-brand-dark truncate max-w-[150px]">{doc.filename}</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">{(doc.size / (1024 * 1024)).toFixed(2)} MB • {doc.mimetype}</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleInspectText(doc)}
                      className="w-8 h-8 rounded-full border border-gray-100 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 focus:outline-none"
                      title="Inspect Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteFromLibrary(doc._id)}
                      className="w-8 h-8 rounded-full border border-gray-100 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 focus:outline-none"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Inspection Overlay Panel */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl p-6 rounded-[32px] shadow-sidebar border border-gray-50 flex flex-col gap-4 relative">
            <button 
              onClick={() => setSelectedDocForPreview(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-zinc-50 hover:bg-zinc-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-bold text-brand-dark font-heading pr-8 truncate">
              Inspecting: {selectedDocForPreview.filename}
            </h3>
            
            {isReadingText ? (
              <div className="h-40 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-orange" />
                <span className="text-xs text-zinc-400 font-heading">Extracting document text characters...</span>
              </div>
            ) : (
              <div className="text-xs text-zinc-600 font-mono bg-zinc-50 p-4 rounded-2xl border border-gray-100 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {readTextContent}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}