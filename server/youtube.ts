import { GoogleGenAI } from '@google/genai';
import { StudyDocument } from './rag.js';

export interface VideoRecommendation {
  id: string;
  title: string;
  channelTitle: string;
  description?: string;
  thumbnailUrl?: string;
  youtubeUrl: string;
  searchUrl: string;
  topic: string;
  isWeakTopic: boolean;
  scorePercentage?: number;
  recommendationReason: string;
  duration?: string;
  isDirectVideo: boolean; // true if returned from official YouTube Data API, false if working search fallback
}

export interface VideoRecommendationsResponse {
  success: boolean;
  source: 'youtube_api' | 'smart_search_fallback';
  apiKeyConfigured: boolean;
  selectedTopic: string;
  availableTopics: {
    topic: string;
    isWeak: boolean;
    isMastered: boolean;
    scorePercentage?: number;
    docCount: number;
  }[];
  recommendations: VideoRecommendation[];
  weakTopicRecommendations: VideoRecommendation[];
}

/**
 * Known educational search refinements to prioritize trusted, high-yield educational content
 */
const EDUCATIONAL_MODIFIERS = [
  'explained step by step',
  'full lecture course',
  'animation mechanism breakdown',
  'concept tutorial review'
];

/**
 * Searches the official YouTube Data API v3 if YOUTUBE_API_KEY is configured.
 * Does not throw; returns empty array if unconfigured, quota exceeded, or network error.
 */
async function fetchFromYouTubeDataApi(
  query: string,
  apiKey: string,
  maxResults: number = 4
): Promise<VideoRecommendation[]> {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', `${query} educational lecture tutorial`);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('relevanceLanguage', 'en');
    url.searchParams.set('maxResults', maxResults.toString());
    url.searchParams.set('key', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[YouTube API] Request failed with HTTP ${res.status}`);
      return [];
    }

    const data: any = await res.json();
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => {
      const videoId = item.id?.videoId || '';
      const snippet = item.snippet || {};
      const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

      return {
        id: videoId || `yt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: snippet.title || `${query} Educational Overview`,
        channelTitle: snippet.channelTitle || 'Educational Video',
        description: snippet.description || '',
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        youtubeUrl: videoUrl,
        searchUrl,
        topic: query,
        isWeakTopic: false,
        recommendationReason: `Official video result matching "${query}".`,
        isDirectVideo: Boolean(videoId),
      };
    });
  } catch (err: any) {
    console.warn('[YouTube API] Error fetching YouTube Data API:', err?.message);
    return [];
  }
}

/**
 * Creates curated, high-accuracy educational search recommendations
 * based on verified study topics, weak areas, and curriculum goals.
 */
export async function getSmartVideoRecommendations(params: {
  activeDocuments: StudyDocument[];
  topicScores: { [topic: string]: { correct: number; total: number; percentage: number } };
  weakTopics: string[];
  masteredTopics: string[];
  selectedTopicFilter?: string;
  searchQuery?: string;
}): Promise<VideoRecommendationsResponse> {
  const {
    activeDocuments,
    topicScores,
    weakTopics = [],
    masteredTopics = [],
    selectedTopicFilter,
    searchQuery
  } = params;

  const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  const isApiKeyConfigured = Boolean(youtubeApiKey && youtubeApiKey.trim().length > 10);

  // 1. Gather all topics from active materials
  const allDocTopics = new Set<string>();
  const topicDocCounts: Record<string, number> = {};

  activeDocuments.forEach(doc => {
    (doc.topics || []).forEach(t => {
      const trimmed = t.trim();
      if (trimmed.length > 2) {
        allDocTopics.add(trimmed);
        topicDocCounts[trimmed] = (topicDocCounts[trimmed] || 0) + 1;
      }
    });

    // Also extract chapter/section titles if available
    doc.chunks.forEach(chunk => {
      if (chunk.sectionTitle) {
        const cleanTitle = chunk.sectionTitle.replace(/^Chapter\s+\d+:\s*/i, '').trim();
        if (cleanTitle.length > 3 && cleanTitle.length < 50) {
          allDocTopics.add(cleanTitle);
          topicDocCounts[cleanTitle] = (topicDocCounts[cleanTitle] || 0) + 1;
        }
      }
    });
  });

  // Ensure topics from user's quiz scores are included
  Object.keys(topicScores || {}).forEach(t => {
    allDocTopics.add(t);
  });
  weakTopics.forEach(t => allDocTopics.add(t));
  masteredTopics.forEach(t => allDocTopics.add(t));

  // Build structured topic metadata list
  const availableTopics = Array.from(allDocTopics).map(topic => {
    const score = topicScores[topic];
    const isWeak = weakTopics.includes(topic) || (score !== undefined && score.percentage < 60);
    const isMastered = masteredTopics.includes(topic) || (score !== undefined && score.percentage >= 75);

    return {
      topic,
      isWeak,
      isMastered,
      scorePercentage: score?.percentage,
      docCount: topicDocCounts[topic] || 1,
    };
  });

  // Sort available topics: weak topics first, then scored topics, then alphabetical
  availableTopics.sort((a, b) => {
    if (a.isWeak && !b.isWeak) return -1;
    if (!a.isWeak && b.isWeak) return 1;
    if (a.scorePercentage !== undefined && b.scorePercentage !== undefined) {
      return a.scorePercentage - b.scorePercentage; // lower score first
    }
    return a.topic.localeCompare(b.topic);
  });

  // 2. Determine target topic to recommend for
  let targetTopic = selectedTopicFilter?.trim() || searchQuery?.trim() || '';
  if (!targetTopic && availableTopics.length > 0) {
    targetTopic = availableTopics[0].topic; // Default to weakest or highest priority topic
  }

  // 3. Build weak topic prioritized recommendations
  const weakTopicRecommendations: VideoRecommendation[] = [];
  const primaryWeakTopics = availableTopics.filter(t => t.isWeak).slice(0, 3);

  for (const wt of primaryWeakTopics) {
    const topicName = wt.topic;
    const scorePct = wt.scorePercentage !== undefined ? `${wt.scorePercentage}%` : '< 60%';
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${topicName} tutorial lecture step by step`
    )}`;

    let directVideos: VideoRecommendation[] = [];
    if (isApiKeyConfigured) {
      directVideos = await fetchFromYouTubeDataApi(topicName, youtubeApiKey, 1);
    }

    if (directVideos.length > 0) {
      const v = directVideos[0];
      weakTopicRecommendations.push({
        ...v,
        isWeakTopic: true,
        scorePercentage: wt.scorePercentage,
        recommendationReason: `Priority Focus: Your quiz score in this topic was ${scorePct}. This video breaks down the core concepts step-by-step.`,
      });
    } else {
      weakTopicRecommendations.push({
        id: `weak-rec-${encodeURIComponent(topicName)}`,
        title: `${topicName} - Step-by-Step Educational Review & Lecture`,
        channelTitle: 'Educational YouTube Search',
        youtubeUrl: searchUrl,
        searchUrl,
        topic: topicName,
        isWeakTopic: true,
        scorePercentage: wt.scorePercentage,
        recommendationReason: `Priority Focus: Your quiz accuracy in ${topicName} is ${scorePct}. Strengthen your conceptual understanding with targeted visual lessons.`,
        isDirectVideo: false,
      });
    }
  }

  // 4. Build recommendations for target topic
  const recommendations: VideoRecommendation[] = [];
  const targetMeta = availableTopics.find(t => t.topic.toLowerCase() === targetTopic.toLowerCase());
  const isTargetWeak = targetMeta?.isWeak || weakTopics.includes(targetTopic);
  const targetScore = targetMeta?.scorePercentage;

  if (targetTopic) {
    let directVideos: VideoRecommendation[] = [];
    if (isApiKeyConfigured) {
      directVideos = await fetchFromYouTubeDataApi(targetTopic, youtubeApiKey, 4);
    }

    if (directVideos.length > 0) {
      directVideos.forEach((v, index) => {
        recommendations.push({
          ...v,
          isWeakTopic: isTargetWeak,
          scorePercentage: targetScore,
          recommendationReason: isTargetWeak
            ? `Reinforces your identified weak area "${targetTopic}" with clear visual instruction.`
            : `Deepens your understanding of "${targetTopic}" from your course materials.`,
        });
      });
    } else {
      // Fallback: Generate curated, working educational search queries
      const subqueries = [
        {
          label: `${targetTopic} - Comprehensive Concept Tutorial & Breakdown`,
          querySuffix: 'tutorial lecture complete guide',
          subReason: isTargetWeak
            ? `Priority review: Reinforces foundation mechanisms for "${targetTopic}" where recent quiz score was low.`
            : `Comprehensive tutorial covering definitions, mechanisms, and key takeaways from your study materials.`
        },
        {
          label: `${targetTopic} - Step-by-Step Animated Mechanism & Walkthrough`,
          querySuffix: 'animated mechanism walkthrough step by step',
          subReason: `Visual animation ideal for building intuition on complex processes and spatial relationships.`
        },
        {
          label: `${targetTopic} - Worked Exam Problems, Practice & Quiz Prep`,
          querySuffix: 'practice problems worked examples quiz review',
          subReason: `Practice walkthroughs designed to reinforce active recall and prepare for adaptive quizzes.`
        },
        {
          label: `${targetTopic} - Crash Course & High-Yield Summary Review`,
          querySuffix: 'high yield summary quick review',
          subReason: `Quick refresher summarizing core definitions, formulas, and common exam pitfalls.`
        }
      ];

      subqueries.forEach((sq, idx) => {
        const fullQuery = `${targetTopic} ${sq.querySuffix}`;
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(fullQuery)}`;

        recommendations.push({
          id: `search-rec-${idx}-${encodeURIComponent(targetTopic)}`,
          title: sq.label,
          channelTitle: 'Verified Educational Search',
          youtubeUrl: searchUrl,
          searchUrl,
          topic: targetTopic,
          isWeakTopic: isTargetWeak,
          scorePercentage: targetScore,
          recommendationReason: sq.subReason,
          isDirectVideo: false,
        });
      });
    }
  }

  return {
    success: true,
    source: isApiKeyConfigured ? 'youtube_api' : 'smart_search_fallback',
    apiKeyConfigured: isApiKeyConfigured,
    selectedTopic: targetTopic,
    availableTopics,
    recommendations,
    weakTopicRecommendations,
  };
}
