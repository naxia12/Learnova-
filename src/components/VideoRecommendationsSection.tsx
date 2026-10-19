import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  ExternalLink,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  Info,
  Youtube,
  Filter,
  GraduationCap
} from 'lucide-react';
import { useLearner } from '../context/LearnerContext';
import { api } from '../services/api';
import { StudyDocumentMeta, VideoRecommendation, VideoRecommendationsResponse } from '../types';

interface VideoRecommendationsSectionProps {
  documents: StudyDocumentMeta[];
  onNavigateTutor?: (topic?: string) => void;
  onNavigateQuiz?: (topic?: string) => void;
  initialTopicFilter?: string;
  title?: string;
  subtitle?: string;
}

export const VideoRecommendationsSection: React.FC<VideoRecommendationsSectionProps> = ({
  documents,
  onNavigateTutor,
  onNavigateQuiz,
  initialTopicFilter,
  title,
  subtitle,
}) => {
  const { learner, selectedDocIds } = useLearner();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VideoRecommendationsResponse | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicFilter || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async (topicOverride?: string, queryOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeTopic = topicOverride !== undefined ? topicOverride : selectedTopic;
      const activeQuery = queryOverride !== undefined ? queryOverride : searchQuery;

      const res = await api.getVideoRecommendations({
        topicScores: learner.topicScores,
        weakTopics: learner.weakTopics,
        masteredTopics: learner.masteredTopics,
        selectedTopicFilter: activeTopic,
        searchQuery: activeQuery,
        selectedDocIds,
      });

      setData(res);
      if (res.selectedTopic && !activeTopic) {
        setSelectedTopic(res.selectedTopic);
      }
    } catch (err: any) {
      console.error('Error fetching video recommendations:', err);
      setError(err?.message || 'Failed to load video recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [
    learner.totalQuizzesTaken,
    learner.weakTopics.join(','),
    selectedDocIds.join(',')
  ]);

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setSearchQuery('');
    fetchRecommendations(topic, '');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchRecommendations(selectedTopic, '');
      return;
    }
    fetchRecommendations('', searchQuery.trim());
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    const defaultTopic = data?.availableTopics?.[0]?.topic || '';
    setSelectedTopic(defaultTopic);
    fetchRecommendations(defaultTopic, '');
  };

  return (
    <div className="bg-[#120f2e]/90 rounded-3xl border border-violet-500/25 shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-6 border-b border-violet-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151136]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30 ring-1 ring-white/20">
            <Youtube className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white">{title || 'Smart Video Recommendations'}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-300" />
                Adaptive Alignment
              </span>
              {data && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {data.apiKeyConfigured ? 'YouTube Data API' : 'Direct Verified Search'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle || 'Educational visual lectures and mechanism tutorials curated from your uploaded materials and quiz performance.'}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchRecommendations()}
          disabled={loading}
          className="self-start md:self-auto px-3.5 py-1.5 bg-[#1b1542] hover:bg-violet-900/60 text-violet-200 text-xs font-semibold rounded-xl border border-violet-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Priority Weak Topic Alert Card */}
        {data && data.weakTopicRecommendations.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Priority Weak Topic Focus
                  </h4>
                  <p className="text-xs text-amber-200/80">
                    Your recent quiz performance identified these concepts as needing reinforcement:
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {data.weakTopicRecommendations.map((v) => (
                <div
                  key={v.id}
                  className="bg-[#18133b] p-4 rounded-2xl border border-amber-500/30 shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-md border border-rose-500/30 truncate">
                        {v.topic} {v.scorePercentage !== undefined ? `(${v.scorePercentage}%)` : ''}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-0.5 shrink-0">
                        Weak Area
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {v.title}
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {v.recommendationReason}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-violet-500/20 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {v.channelTitle}
                    </span>
                    <a
                      href={v.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shrink-0 shadow-md shadow-red-900/30"
                    >
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-80" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Filters & Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-200 uppercase tracking-wider">
                Filter by Course Concept
              </span>
            </div>

            {/* Custom Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
              <input
                type="text"
                placeholder="Search concept videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-16 py-2 bg-[#18133b] border border-violet-500/30 rounded-xl focus:bg-[#1e1948] focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-slate-400 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-violet-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white font-bold"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition-colors"
              >
                Go
              </button>
            </form>
          </div>

          {/* Topic Pills */}
          {data?.availableTopics && data.availableTopics.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {data.availableTopics.map((item) => {
                const isSelected = selectedTopic === item.topic && !searchQuery;
                return (
                  <button
                    key={item.topic}
                    onClick={() => handleSelectTopic(item.topic)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40 border border-violet-400'
                        : item.isWeak
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40'
                        : item.isMastered
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                        : 'bg-[#18133b] hover:bg-[#201a4e] text-slate-300 border border-violet-500/20'
                    }`}
                  >
                    <span>{item.topic}</span>
                    {item.isWeak && (
                      <span className="text-[10px] text-rose-400 font-bold">⚠️</span>
                    )}
                    {item.isMastered && (
                      <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Recommendations Grid */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-300">
              Retrieving educational video recommendations...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center">
            <p className="text-xs text-rose-300 font-medium">{error}</p>
            <button
              onClick={() => fetchRecommendations()}
              className="mt-2 text-xs font-bold text-rose-400 underline"
            >
              Try Again
            </button>
          </div>
        ) : data && data.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.recommendations.map((v) => (
              <div
                key={v.id}
                className="bg-[#18133b] hover:bg-[#1e1948] rounded-2xl border border-violet-500/20 hover:border-violet-400/50 shadow-md hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Thumbnail / Visual banner */}
                  {v.thumbnailUrl ? (
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full bg-gradient-to-br from-violet-950 via-slate-950 to-red-950 p-4 flex flex-col justify-between text-white overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 flex items-center gap-1">
                          <Youtube className="w-3.5 h-3.5 fill-red-400" />
                          Educational Video
                        </span>
                        {v.isWeakTopic && (
                          <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                            Weak Area
                          </span>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center self-center shadow-md">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 truncate">
                        {v.topic}
                      </span>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-violet-200 transition-colors">
                      {v.title}
                    </h4>

                    {/* Recommendation reason */}
                    <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/15">
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        <strong className="text-violet-300 font-semibold">Why Watch: </strong>
                        {v.recommendationReason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0">
                  <div className="pt-2.5 border-t border-violet-500/20 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[110px]">
                      {v.channelTitle}
                    </span>
                    <a
                      href={v.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Watch</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#18133b] rounded-2xl border border-dashed border-violet-500/20 p-4">
            <Video className="w-8 h-8 text-violet-400/50 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">
              No videos matching your current filter. Try selecting a different topic.
            </p>
          </div>
        )}

        {/* Info Footnote */}
        <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-400 border-t border-violet-500/15">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-400" />
          <p>
            Learnova AI aligns educational YouTube videos and working search links with verified weak topics identified in your quiz evaluations. No paid services required.
          </p>
        </div>
      </div>
    </div>
  );
};
