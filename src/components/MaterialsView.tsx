import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Trash2,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { StudyDocumentMeta, DocumentChunk } from '../types';
import { useLearner } from '../context/LearnerContext';

interface MaterialsViewProps {
  documents: StudyDocumentMeta[];
  onRefreshDocs: () => void;
  onNavigateTutor: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  documents,
  onRefreshDocs,
  onNavigateTutor
}) => {
  const { selectedDocIds, toggleDocSelection, selectAllDocs } = useLearner();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    fileSize: string;
    stage: string;
    percent: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [inspectDoc, setInspectDoc] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent duplicate upload requests if already uploading
    if (uploading) return;

    const file = e.target.files?.[0];
    // Reset file input value immediately so re-selecting triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file) return;

    // Check size limit: 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${formatFileSize(file.size)}). The maximum allowed upload size is 25MB.`);
      return;
    }

    if (file.size === 0) {
      setUploadError('The selected file is empty (0 bytes). Please choose a valid document.');
      return;
    }

    // Check extension
    const allowed = ['.pdf', '.txt', '.md', '.json'];
    const hasValidExt = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Unsupported file type. Please upload a PDF (.pdf), Plain Text (.txt), or Markdown (.md) document.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress({
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      stage: 'Uploading and parsing document...',
      percent: 35,
    });

    // Advance progress indicator through parsing and chunking stages
    const timer1 = setTimeout(() => {
      setUploadProgress((prev) => prev ? { ...prev, stage: 'Extracting text and section markers...', percent: 65 } : null);
    }, 400);

    const timer2 = setTimeout(() => {
      setUploadProgress((prev) => prev ? { ...prev, stage: 'Indexing into knowledge scope & citations...', percent: 88 } : null);
    }, 900);

    try {
      const res = await api.uploadDocument(file);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setUploadProgress((prev) => prev ? { ...prev, stage: 'Complete!', percent: 100 } : null);
      setUploadSuccess(`Successfully processed "${res.document.title}" into ${res.document.chunkCount} searchable knowledge passages.`);
      onRefreshDocs();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setUploadError(err.message || 'Failed to process document. Please try again.');
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        setUploading(false);
      }, 500);
    }
  };

  const handleResetSample = async () => {
    try {
      await api.resetSampleDocuments();
      setUploadSuccess('Reset to default preloaded textbooks for Biology 101, Computer Science, and World History.');
      onRefreshDocs();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to reset sample documents');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteDocument(id);
      onRefreshDocs();
    } catch (err: any) {
      setUploadError('Failed to remove document');
    }
  };

  const handleInspect = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectLoading(true);
    try {
      const res = await api.getDocumentDetails(id);
      setInspectDoc(res.document);
    } catch (err: any) {
      setUploadError('Could not load document chunks');
    } finally {
      setInspectLoading(false);
    }
  };

  const allSelected = documents.length > 0 && documents.every((d) => selectedDocIds.includes(d.id));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Study Materials Library</h2>
          <p className="text-sm text-slate-500">
            Upload textbooks, lecture slides, and notes. Learnova AI chunks and indexes them for strict source-grounded answers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSample}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Sample Textbooks</span>
          </button>
          <button
            onClick={() => {
              if (allSelected) {
                selectAllDocs([]);
              } else {
                selectAllDocs(documents.map((d) => d.id));
              }
            }}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`bg-white rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
        uploading
          ? 'border-indigo-400 bg-indigo-50/40 pointer-events-none'
          : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/20'
      }`}>
        <input
          ref={fileInputRef}
          type="file"
          id="doc-upload-input"
          accept=".pdf,.txt,.md,.json"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />

        {uploadProgress ? (
          <div className="max-w-md mx-auto space-y-3 py-2 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-100">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-slate-800 truncate max-w-[280px]">
                  {uploadProgress.fileName}
                </span>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {uploadProgress.fileSize}
                </span>
              </div>
              <p className="text-xs font-medium text-indigo-600 mt-1">
                {uploadProgress.stage}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Extracting text, chunking sections, and generating verifiable citations...
            </p>
          </div>
        ) : (
          <label
            htmlFor="doc-upload-input"
            className="cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Upload Study Document
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF textbooks, lecture notes (.txt), and Markdown (.md) up to 25MB.
              </p>
            </div>
            <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors">
              Browse Computer Files
            </span>
          </label>
        )}
      </div>

      {/* Upload Feedback */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-medium">{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs font-bold text-red-600 hover:text-red-800 underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
          <button
            onClick={() => setUploadSuccess(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Document Library Table / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Study Sources ({documents.length})
          </div>
          <div className="text-xs text-indigo-600 font-semibold">
            {selectedDocIds.length} of {documents.length} Selected for Study
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => toggleDocSelection(doc.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all text-left flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        doc.fileType === 'pdf' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {doc.fileType.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {doc.isSample ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          PRELOADED
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="p-1 text-indigo-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title and summary */}
                  <h4 className="font-bold text-slate-900 text-sm mt-3 line-clamp-2">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>

                  {/* Topics tag pills */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {doc.topics.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer metadata & inspect button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{doc.pageCount} Pages • {doc.chunkCount} Chunks</span>
                  <button
                    onClick={(e) => handleInspect(doc.id, e)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspect Document Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Indexed Knowledge Inspection
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{inspectDoc.title}</h3>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <strong>Document Summary:</strong> {inspectDoc.summary}
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Extracted Chunks & Page Markers ({inspectDoc.chunks.length})
              </div>

              <div className="space-y-3">
                {inspectDoc.chunks.map((chunk: DocumentChunk, index: number) => (
                  <div key={chunk.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600">
                      <span>Chunk #{index + 1} • Page {chunk.pageNumber}</span>
                      {chunk.sectionTitle && (
                        <span className="text-slate-500 font-semibold">{chunk.sectionTitle}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-mono bg-slate-50/50 p-2 rounded">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                These passages are retrieved during AI Tutor Q&A and Quizzes.
              </span>
              <button
                onClick={() => {
                  setInspectDoc(null);
                  onNavigateTutor();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Ask Tutor About This Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
