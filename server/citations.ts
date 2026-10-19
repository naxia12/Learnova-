import { DocumentChunk } from './rag.js';

export interface VerifiedCitation {
  fileName: string;
  pageNumber?: number;
  sectionTitle?: string;
  isVerified: boolean;
  citationKey: string;
  snippet?: string;
  chunkId?: string;
}

/**
 * Normalizes title for fuzzy comparison (removes extension, special characters, extra spaces)
 */
function normalizeDocString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[_\-:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses all citations from generated text, verifies them against retrieved passages,
 * and deduplicates so that each unique document + page (or section) is listed only once.
 */
export function extractAndVerifyCitations(
  text: string,
  retrievedChunks: DocumentChunk[]
): {
  citations: VerifiedCitation[];
  deduplicatedCount: number;
  totalFoundCount: number;
} {
  if (!text) {
    return { citations: [], deduplicatedCount: 0, totalFoundCount: 0 };
  }

  // Regex to match:
  // [DocTitle, Page X]
  // [DocTitle, p. X]
  // [DocTitle, Section Name]
  // [DocTitle, Page X | Section Name]
  const citationRegex = /\[([^,\]\n]+?)(?:,\s*(?:Page|p\.|pg\.)\s*(\d+))?(?:,\s*(?:Section|sec\.)\s*([^\]\n]+))?\]/gi;

  const rawMatches: {
    rawMatch: string;
    docName: string;
    page?: number;
    section?: string;
  }[] = [];

  let match: RegExpExecArray | null;
  while ((match = citationRegex.exec(text)) !== null) {
    const rawDoc = match[1]?.trim();
    if (!rawDoc) continue;

    // Filter out common false positives like markdown links [text](url) or non-source tags
    if (
      rawDoc.toLowerCase().startsWith('http') ||
      rawDoc.toLowerCase().startsWith('suggested') ||
      rawDoc.toLowerCase().startsWith('step') ||
      rawDoc.toLowerCase().startsWith('phase')
    ) {
      continue;
    }

    const pageStr = match[2];
    const pageNum = pageStr ? parseInt(pageStr, 10) : undefined;
    const sectionStr = match[3]?.trim();

    rawMatches.push({
      rawMatch: match[0],
      docName: rawDoc,
      page: pageNum,
      section: sectionStr,
    });
  }

  // If the standard regex didn't find any, fallback to simpler [Doc, Page X]
  if (rawMatches.length === 0) {
    const simpleRegex = /\[([^,\]]+),\s*(?:Page|p\.)\s*(\d+)\]/gi;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = simpleRegex.exec(text)) !== null) {
      rawMatches.push({
        rawMatch: sMatch[0],
        docName: sMatch[1].trim(),
        page: parseInt(sMatch[2], 10),
      });
    }
  }

  // Deduplicate and verify against retrieved chunks
  const uniqueMap = new Map<string, VerifiedCitation>();

  for (const item of rawMatches) {
    const normCitedDoc = normalizeDocString(item.docName);

    // Look for matching chunk in retrieved passages
    let matchedChunk: DocumentChunk | undefined = undefined;

    for (const chunk of retrievedChunks) {
      const normChunkTitle = normalizeDocString(chunk.docTitle);
      const normChunkId = normalizeDocString(chunk.docId);

      const titleMatch =
        normChunkTitle.includes(normCitedDoc) ||
        normCitedDoc.includes(normChunkTitle) ||
        normChunkId.includes(normCitedDoc) ||
        normCitedDoc.includes(normChunkId);

      if (!titleMatch) continue;

      // If page was specified, check page match
      if (item.page !== undefined) {
        if (chunk.pageNumber === item.page) {
          matchedChunk = chunk;
          break;
        }
      } else if (item.section) {
        // If section was specified without page, check section match
        const normSection = normalizeDocString(item.section);
        const normChunkSection = chunk.sectionTitle ? normalizeDocString(chunk.sectionTitle) : '';
        if (normChunkSection.includes(normSection) || normSection.includes(normChunkSection)) {
          matchedChunk = chunk;
          break;
        }
      } else {
        // Matched doc without specific page
        matchedChunk = chunk;
        break;
      }
    }

    // Determine verification status
    // Only verified if an actual chunk in the retrieved content matches!
    const isVerified = Boolean(matchedChunk);

    // Canonical document name & page
    const canonicalName = matchedChunk ? matchedChunk.docTitle : item.docName;
    const canonicalPage = matchedChunk ? matchedChunk.pageNumber : item.page;
    const canonicalSection = matchedChunk?.sectionTitle || item.section;

    // Unique key for deduplication: same document + same page/section = 1 citation
    const citationKey = `${normalizeDocString(canonicalName)}::p_${canonicalPage ?? 'none'}::sec_${normalizeDocString(canonicalSection ?? 'none')}`;

    if (!uniqueMap.has(citationKey)) {
      uniqueMap.set(citationKey, {
        fileName: canonicalName,
        pageNumber: canonicalPage,
        sectionTitle: canonicalSection,
        isVerified,
        citationKey,
        snippet: matchedChunk ? matchedChunk.content.substring(0, 200).trim() : undefined,
        chunkId: matchedChunk?.id,
      });
    } else if (isVerified && !uniqueMap.get(citationKey)!.isVerified) {
      // Upgrade to verified if found
      const existing = uniqueMap.get(citationKey)!;
      existing.isVerified = true;
      existing.snippet = matchedChunk ? matchedChunk.content.substring(0, 200).trim() : existing.snippet;
      existing.chunkId = matchedChunk?.id;
    }
  }

  const citations = Array.from(uniqueMap.values());

  return {
    citations,
    deduplicatedCount: citations.length,
    totalFoundCount: rawMatches.length,
  };
}
