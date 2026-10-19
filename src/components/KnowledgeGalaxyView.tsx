import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Play,
  RotateCcw,
  Target,
  ChevronRight,
  Layers,
  ArrowRight,
  Zap,
  Network
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';
import { StudyDocumentMeta } from '../types';

interface ConceptNode {
  id: string;
  label: string;
  category: 'biology' | 'cs' | 'history' | 'general';
  status: 'mastered' | 'in_progress' | 'needs_revision';
  score?: number;
  prerequisites: string[];
  docTitle: string;
  pageNumber: number;
  summary: string;
  recommendedAction: string;
  x: number;
  y: number;
}

interface KnowledgeGalaxyViewProps {
  documents: StudyDocumentMeta[];
  onNavigateTab: (tab: any) => void;
}

export const KnowledgeGalaxyView: React.FC<KnowledgeGalaxyViewProps> = ({
  documents,
  onNavigateTab,
}) => {
  const { learner } = useLearner();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('etc');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Derive status from learner actual data
  const getTopicStatus = (topic: string, defaultScore: number = 50): { status: 'mastered' | 'in_progress' | 'needs_revision'; score: number } => {
    const perf = learner.topicScores[topic];
    if (perf) {
      if (perf.percentage >= 75) return { status: 'mastered', score: perf.percentage };
      if (perf.percentage < 60) return { status: 'needs_revision', score: perf.percentage };
      return { status: 'in_progress', score: perf.percentage };
    }
    if (learner.masteredTopics.includes(topic)) return { status: 'mastered', score: 85 };
    if (learner.weakTopics.includes(topic)) return { status: 'needs_revision', score: 35 };
    return { status: 'in_progress', score: defaultScore };
  };

  const bioGlycolysis = getTopicStatus('Glycolysis', 90);
  const bioKrebs = getTopicStatus('Krebs Cycle', 65);
  const bioETC = getTopicStatus('Electron Transport Chain', 25);
  const bioATP = getTopicStatus('ATP Synthesis', 55);
  const csRNN = getTopicStatus('RNN Bottlenecks', 70);
  const csAttention = getTopicStatus('Attention Mechanisms', 33);
  const csPositional = getTopicStatus('Positional Encoding', 60);
  const csTransformer = getTopicStatus('Transformers', 65);
  const histOrigins = getTopicStatus('Origins of Industry', 85);
  const histSteam = getTopicStatus('Steam Engine', 75);
  const histUrban = getTopicStatus('Urbanization', 60);

  const nodes: ConceptNode[] = [
    // Biology 101 Cluster
    {
      id: 'glycolysis',
      label: 'Glycolysis',
      category: 'biology',
      status: bioGlycolysis.status,
      score: bioGlycolysis.score,
      prerequisites: [],
      docTitle: 'Biology 101: Cellular Respiration',
      pageNumber: 1,
      summary: '10-step enzymatic breakdown of glucose in cytosol generating 2 net ATP and 2 NADH without oxygen.',
      recommendedAction: 'Mastery maintained! Take a quick speed quiz to retain long-term recall.',
      x: 180,
      y: 120,
    },
    {
      id: 'krebs',
      label: 'Citric Acid (Krebs) Cycle',
      category: 'biology',
      status: bioKrebs.status,
      score: bioKrebs.score,
      prerequisites: ['glycolysis'],
      docTitle: 'Biology 101: Cellular Respiration',
      pageNumber: 2,
      summary: 'Matrix oxidation of Acetyl-CoA producing 6 NADH, 2 FADH2, and 2 ATP per glucose molecule.',
      recommendedAction: 'Practice balancing stoichiometry and carbon transfers in AI Tutor.',
      x: 320,
      y: 200,
    },
    {
      id: 'etc',
      label: 'Electron Transport Chain (ETC)',
      category: 'biology',
      status: bioETC.status,
      score: bioETC.score,
      prerequisites: ['krebs'],
      docTitle: 'Biology 101: Cellular Respiration',
      pageNumber: 3,
      summary: 'Complexes I-IV on inner cristae membrane creating chemiosmotic proton gradient via electron flow to O2.',
      recommendedAction: 'Priority Revision: Review proton pump direction and watch animated video breakdown.',
      x: 480,
      y: 130,
    },
    {
      id: 'atp-synthase',
      label: 'ATP Synthase & Chemiosmosis',
      category: 'biology',
      status: bioATP.status,
      score: bioATP.score,
      prerequisites: ['etc'],
      docTitle: 'Biology 101: Cellular Respiration',
      pageNumber: 4,
      summary: 'Proton motive force drives rotary catalytic F0/F1 subunits synthesizing ~26-28 ATP.',
      recommendedAction: 'Clarify proton flux and catalytic rotation with AI Tutor grounded citations.',
      x: 640,
      y: 210,
    },

    // Computer Science Cluster
    {
      id: 'rnn-bottlenecks',
      label: 'RNN Sequential Bottlenecks',
      category: 'cs',
      status: csRNN.status,
      score: csRNN.score,
      prerequisites: [],
      docTitle: 'Computer Science: Transformer Architecture',
      pageNumber: 1,
      summary: 'Vanishing gradient and non-parallelizable sequential token processing h_t = f(h_t-1, x_t).',
      recommendedAction: 'Review why recurrence limits horizontal GPU cluster scalability.',
      x: 160,
      y: 360,
    },
    {
      id: 'attention-mechanisms',
      label: 'Scaled Dot-Product Attention',
      category: 'cs',
      status: csAttention.status,
      score: csAttention.score,
      prerequisites: ['rnn-bottlenecks'],
      docTitle: 'Computer Science: Transformer Architecture',
      pageNumber: 2,
      summary: 'Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V. Division by sqrt(d_k) prevents vanishing gradients.',
      recommendedAction: 'High Priority: Review the mathematical derivation of variance stabilization.',
      x: 330,
      y: 430,
    },
    {
      id: 'positional-encoding',
      label: 'Positional Encoding (Sinusoidal)',
      category: 'cs',
      status: csPositional.status,
      score: csPositional.score,
      prerequisites: ['attention-mechanisms'],
      docTitle: 'Computer Science: Transformer Architecture',
      pageNumber: 4,
      summary: 'Sinusoid vectors injected into token embeddings to establish sequence order without recurrence.',
      recommendedAction: 'Take targeted adaptive quiz on permutation invariance.',
      x: 490,
      y: 350,
    },
    {
      id: 'transformers',
      label: 'Encoder-Decoder Architecture',
      category: 'cs',
      status: csTransformer.status,
      score: csTransformer.score,
      prerequisites: ['attention-mechanisms', 'positional-encoding'],
      docTitle: 'Computer Science: Transformer Architecture',
      pageNumber: 5,
      summary: 'Pre-LayerNorm residual blocks and autoregressive causal masking in decoder cross-attention.',
      recommendedAction: 'Inspect self-attention vs cross-attention mechanisms in tutor chat.',
      x: 650,
      y: 440,
    },

    // World History Cluster
    {
      id: 'hist-origins',
      label: 'Agrarian Cottage System',
      category: 'history',
      status: histOrigins.status,
      score: histOrigins.score,
      prerequisites: [],
      docTitle: 'World History: First Industrial Revolution',
      pageNumber: 1,
      summary: 'Decentralized rural artisan textile weaving prior to steam and factory mechanization.',
      recommendedAction: 'Demonstrated mastery. Re-read primary accounts before midterm.',
      x: 240,
      y: 560,
    },
    {
      id: 'hist-steam',
      label: 'Watt Rotary Steam Engine',
      category: 'history',
      status: histSteam.status,
      score: histSteam.score,
      prerequisites: ['hist-origins'],
      docTitle: 'World History: First Industrial Revolution',
      pageNumber: 2,
      summary: 'Separate condenser and sun-and-planet gear freed mills from riverside locations in 1769.',
      recommendedAction: 'Solid recall. Verify citation quotes on Boulton & Watt partnership.',
      x: 440,
      y: 570,
    },
    {
      id: 'hist-urban',
      label: 'Industrial Urbanization',
      category: 'history',
      status: histUrban.status,
      score: histUrban.score,
      prerequisites: ['hist-steam'],
      docTitle: 'World History: First Industrial Revolution',
      pageNumber: 3,
      summary: 'Rapid demographic shift toward Manchester, municipal infrastructure strain, and the Factory Acts.',
      recommendedAction: 'Review social consequences and public health legislative milestones.',
      x: 620,
      y: 580,
    },
  ];

  const edges = [
    { from: 'glycolysis', to: 'krebs' },
    { from: 'krebs', to: 'etc' },
    { from: 'etc', to: 'atp-synthase' },
    { from: 'rnn-bottlenecks', to: 'attention-mechanisms' },
    { from: 'attention-mechanisms', to: 'positional-encoding' },
    { from: 'attention-mechanisms', to: 'transformers' },
    { from: 'positional-encoding', to: 'transformers' },
    { from: 'hist-origins', to: 'hist-steam' },
    { from: 'hist-steam', to: 'hist-urban' },
  ];

  const filteredNodes = filterCategory === 'all'
    ? nodes
    : nodes.filter(n => n.category === filterCategory);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const getNodeColor = (status: ConceptNode['status']) => {
    switch (status) {
      case 'mastered':
        return {
          bg: 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-emerald-500/30',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'needs_revision':
        return {
          bg: 'bg-rose-500/20 border-rose-400 text-rose-300 ring-rose-500/30',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.45)]',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400 animate-pulse',
        };
      default:
        return {
          bg: 'bg-violet-500/20 border-violet-400 text-violet-200 ring-violet-500/30',
          glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
          badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
          dot: 'bg-violet-400',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Knowledge Galaxy
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Interactive Concept Topology
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Connected conceptual map synthesizing your uploaded study texts, prerequisites, and live adaptive quiz scores into a navigable constellation.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-violet-500/20 backdrop-blur-md">
          {[
            { id: 'all', label: 'All Sectors' },
            { id: 'biology', label: 'Biology 101' },
            { id: 'cs', label: 'Computer Science' },
            { id: 'history', label: 'World History' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === f.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Galaxy Canvas & Node Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Galaxy Area (2 Cols) */}
        <div className="lg:col-span-2 relative rounded-3xl bg-gradient-to-b from-[#110e2e] via-[#0d0a24] to-[#080618] border border-violet-500/20 p-6 overflow-hidden min-h-[500px] flex flex-col justify-between shadow-2xl">
          {/* Subtle star particle effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          {/* Galaxy Legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-violet-500/20">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Cosmic Status Legend:
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                Mastered (≥75%)
              </span>
              <span className="flex items-center gap-1.5 text-violet-300 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                In Progress (60-74%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-ping" />
                Needs Revision (&lt;60%)
              </span>
            </div>
          </div>

          {/* SVG Connection Lines & Interactive Nodes */}
          <div className="relative z-10 w-full h-[460px] my-auto">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="activeEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {edges.map((e, idx) => {
                const src = nodes.find(n => n.id === e.from);
                const tgt = nodes.find(n => n.id === e.to);
                if (!src || !tgt) return null;
                const isConnectedToSelected = selectedNodeId === src.id || selectedNodeId === tgt.id;

                return (
                  <line
                    key={idx}
                    x1={`${(src.x / 800) * 100}%`}
                    y1={`${(src.y / 680) * 100}%`}
                    x2={`${tgt.x / 800 * 100}%`}
                    y2={`${tgt.y / 680 * 100}%`}
                    stroke={isConnectedToSelected ? 'url(#activeEdgeGrad)' : 'url(#edgeGrad)'}
                    strokeWidth={isConnectedToSelected ? 2.5 : 1.2}
                    strokeDasharray={isConnectedToSelected ? 'none' : '4,4'}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Render Nodes */}
            {filteredNodes.map(node => {
              const style = getNodeColor(node.status);
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    left: `${(node.x / 800) * 100}%`,
                    top: `${(node.y / 680) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute cursor-pointer transition-all duration-300 group ${
                    isSelected ? 'scale-115 z-30' : 'hover:scale-108 z-20'
                  }`}
                >
                  <div
                    className={`relative px-3.5 py-2 rounded-2xl border backdrop-blur-md flex items-center gap-2.5 ${style.bg} ${style.glow} ${
                      isSelected
                        ? 'ring-2 ring-violet-400 bg-violet-900/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                        : 'hover:border-violet-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white tracking-tight leading-tight">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {node.score !== undefined ? `${node.score}% Mastery` : 'Mapped'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-violet-500/15">
            <span>Click any celestial concept node to inspect prerequisites & tailored review tasks.</span>
            <span className="font-mono text-violet-300">Constellation Active • 11 Verified Concepts</span>
          </div>
        </div>

        {/* Selected Concept Deep-Dive Inspector (1 Col) */}
        <div className="rounded-3xl bg-[#120f2e]/90 border border-violet-500/25 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-5">
          <div>
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Concept Inspector
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5 leading-snug">
                  {selectedNode.label}
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getNodeColor(selectedNode.status).badge}`}>
                {selectedNode.status === 'mastered'
                  ? 'Mastered Concept'
                  : selectedNode.status === 'needs_revision'
                  ? 'Priority Revision'
                  : 'In Progress'}
              </span>
            </div>

            {/* Score & Material Grounding */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Mastery
                </span>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  {selectedNode.score !== undefined ? `${selectedNode.score}%` : 'N/A'}
                </div>
                <div className="text-[10px] text-violet-300 mt-1">From actual quiz results</div>
              </div>

              <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Textbook Source
                </span>
                <div className="text-xs font-bold text-white mt-1 truncate">
                  Page {selectedNode.pageNumber}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{selectedNode.docTitle}</div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 space-y-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                Curriculum Synthesis
              </span>
              <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950/40 border border-violet-500/15">
                {selectedNode.summary}
              </p>
            </div>

            {/* Prerequisites */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-slate-300">Prerequisite Concepts:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.prerequisites.length > 0 ? (
                  selectedNode.prerequisites.map(prereq => (
                    <span
                      key={prereq}
                      onClick={() => setSelectedNodeId(prereq)}
                      className="cursor-pointer text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-200 border border-violet-500/30 transition-colors"
                    >
                      {nodes.find(n => n.id === prereq)?.label || prereq} &rarr;
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Foundational entry concept (no prerequisites required).</span>
                )}
              </div>
            </div>

            {/* Recommended Adaptive Action */}
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/80 to-indigo-950/80 border border-violet-500/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Next Pedagogical Action</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedNode.recommendedAction}
              </p>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="pt-2 border-t border-violet-500/20 flex flex-col gap-2">
            <button
              onClick={() => onNavigateTab('tutor')}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span>Ask AI Tutor About {selectedNode.label}</span>
            </button>
            <button
              onClick={() => onNavigateTab('quiz')}
              className="w-full py-2 px-4 bg-violet-950/50 hover:bg-violet-900/60 text-violet-200 border border-violet-500/30 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Test Concept in Adaptive Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
