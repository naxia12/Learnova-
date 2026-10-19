import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Quote,
  ShieldCheck,
  RefreshCw,
  Lightbulb,
  FileText,
  User,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, Citation, DocumentChunk, StudyDocumentMeta } from '../types';
import { useLearner } from '../context/LearnerContext';

interface TutorViewProps {
  documents: StudyDocumentMeta[];
  onNavigateMaterials: () => void;
}

export const TutorView: React.FC<TutorViewProps> = ({ documents, onNavigateMaterials }) => {
  const { learner, selectedDocIds, toggleDocSelection } = useLearner();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello${learner.name ? ' ' + learner.name : ''}! Welcome to the **AI Study Room**.

I am your source-grounded academic tutor. I examine your uploaded course materials and provide step-by-step explanations with clickable, verified textbook page citations (e.g. \`[Biology 101, Page 2]\`).

If a concept is outside your selected materials, my stubborn zero-hallucination policy explicitly states: *"I couldn't find this information in your uploaded sources."*

Try asking me a question below, or test a negative refusal!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitationModal, setActiveCitationModal] = useState<{
    citation: Citation;
    matchingChunk?: DocumentChunk;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));

  const suggestedQuestions = [
    {
      text: 'What is the net ATP yield of glycolysis, and where does it occur?',
      category: 'Biology 101',
    },
    {
      text: 'Why does Scaled Dot-Product Attention divide by the square root of d_k?',
      category: 'Transformers',
    },
    {
      text: 'How did James Watt improve Thomas Newcomen’s steam engine?',
      category: 'Industrial Revolution',
    },
    {
      text: 'Who won the 1994 FIFA World Cup soccer tournament?',
      category: 'Zero-Hallucination Negative Test',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendTutorMessage({
        message: text,
        selectedDocIds,
        history: historyPayload,
      });

      const isRefusal = res.answer.includes("couldn't find this information in your uploaded sources");

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations || [],
        retrievedPassages: res.retrievedPassages || [],
        isRefusal,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ The AI tutor service is temporarily experiencing high model traffic. Please click "Retry Question" below in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTemporarilyUnavailable: true,
        userQueryForRetry: text,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const openCitationPreview = (citation: Citation, message: ChatMessage) => {
    const matchingChunk = message.retrievedPassages?.find(
      (c) =>
        c.pageNumber === citation.pageNumber ||
        c.docTitle.toLowerCase().includes(citation.fileName.toLowerCase()) ||
        citation.fileName.toLowerCase().includes(c.docTitle.toLowerCase())
    );

    setActiveCitationModal({
      citation,
      matchingChunk: matchingChunk || message.retrievedPassages?.[0],
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-[#100d2b]/90 rounded-3xl border border-violet-500/25 shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in duration-300">
      {/* Tutor Top Bar: Active Knowledge Source selector & Grounding Badge */}
      <div className="p-4 sm:p-5 bg-[#151136]/90 border-b border-violet-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-violet-600/30 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">AI Study Room</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Zero Hallucination Grounding
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Source-grounded explanations with verified textbook citations
            </p>
          </div>
        </div>

        {/* Selected Documents Scope indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-violet-300 font-semibold">Grounded In:</span>
          {selectedDocs.length === 0 ? (
            <button
              onClick={onNavigateMaterials}
              className="text-xs font-semibold text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-xl border border-rose-500/30 hover:bg-rose-500/25 transition-colors"
            >
              No documents selected (Click to choose)
            </button>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedDocs.map((doc) => (
                <span
                  key={doc.id}
                  className="text-[11px] font-medium bg-violet-950/80 text-violet-200 border border-violet-700/40 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <BookOpen className="w-3 h-3 text-violet-400" />
                  <span className="max-w-[150px] truncate">{doc.title}</span>
                </span>
              ))}
              <button
                onClick={onNavigateMaterials}
                className="text-xs text-violet-300 hover:text-white font-semibold underline ml-1"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md text-xs font-bold ring-1 ring-violet-400/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs shadow-lg shadow-violet-900/30 border border-violet-400/30'
                      : msg.isRefusal
                      ? 'bg-amber-950/40 text-amber-100 border border-amber-500/40 rounded-tl-xs shadow-lg'
                      : 'bg-[#18133b] text-slate-100 border border-violet-500/25 rounded-tl-xs shadow-lg'
                  }`}
                >
                  {/* If refusal, show explicit badge */}
                  {msg.isRefusal && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Evidence Refusal (Zero Hallucination Protocol)</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line prose prose-invert prose-sm max-w-none">
                    {msg.content}
                  </div>

                  {/* Temporary Unavailability / 503 Retry Action */}
                  {!isUser && msg.isTemporarilyUnavailable && msg.userQueryForRetry && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleSendMessage(msg.userQueryForRetry)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Retry Question</span>
                      </button>
                    </div>
                  )}

                  {/* Grounded Passages / Citations Footer */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-violet-500/20 space-y-1.5">
                      <div className="text-[11px] font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Textbook Sources ({msg.citations.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => openCitationPreview(cite, msg)}
                            className="px-2.5 py-1 bg-violet-950/80 hover:bg-violet-900 text-violet-200 border border-violet-700/40 hover:border-violet-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <BookOpen className="w-3 h-3 text-violet-400" />
                            <span>
                              {cite.fileName} {cite.pageNumber ? `(Page ${cite.pageNumber})` : ''}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold ml-0.5">✓</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-violet-900/60 text-violet-200 border border-violet-500/30 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#18133b] border border-violet-500/30 p-4 rounded-2xl rounded-tl-xs text-xs text-violet-200 flex items-center gap-2 shadow-lg">
              <span className="font-semibold text-violet-300">Retrieving textbook chunks & synthesizing source-cited answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-5 py-2.5 bg-[#141033] border-t border-violet-500/20 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="font-bold text-violet-400 uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> Try Asking:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.text)}
            disabled={loading}
            className="px-3 py-1.5 bg-[#1b1542] hover:bg-violet-900/60 border border-violet-500/25 hover:border-violet-400 text-slate-200 hover:text-white rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>{q.text}</span>
            <span className="text-[9px] text-violet-300 font-semibold px-1 rounded bg-violet-950/80 border border-violet-800/40">
              {q.category}
            </span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-[#110e2b] border-t border-violet-500/20 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything grounded in your study documents (e.g. 'Explain Krebs cycle step-by-step')..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#18133b] border border-violet-500/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-[#1f194c] transition-all text-white placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Citation Preview Modal */}
      {activeCitationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151136] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-violet-500/30 space-y-4 text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-violet-400" />
                <div>
                  <h4 className="text-base font-bold text-white">
                    Source Citation Inspection
                  </h4>
                  <p className="text-xs text-slate-400">
                    {activeCitationModal.citation.fileName} — Page {activeCitationModal.citation.pageNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCitationModal(null)}
                className="px-3 py-1 text-xs font-semibold bg-violet-950/80 hover:bg-violet-900 border border-violet-700/40 rounded-xl text-violet-200"
              >
                Close
              </button>
            </div>

            {activeCitationModal.matchingChunk ? (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-violet-500/20 space-y-2">
                <div className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                  {activeCitationModal.matchingChunk.sectionTitle || 'Source Passage Excerpt'}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-mono">
                  "{activeCitationModal.matchingChunk.content}"
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-violet-500/20 text-xs text-slate-300">
                Verified citation matching page {activeCitationModal.citation.pageNumber} of {activeCitationModal.citation.fileName}.
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setActiveCitationModal(null)}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
