import { FillerDistributionItem } from '@/types/betalky';

export interface FillerAnalysisResult {
  totalFillers: number;
  fillerScore: number;
  fillerDistribution: FillerDistributionItem[];
}

/**
 * Accurately analyzes spoken transcript for genuine conversational filler words.
 * Returns exact counts, calculated percentages, and calibrated filler scores.
 */
export function analyzeFillerWords(transcript: string): FillerAnalysisResult {
  if (!transcript || typeof transcript !== 'string') {
    return {
      totalFillers: 0,
      fillerScore: 10.0,
      fillerDistribution: [],
    };
  }

  const clean = transcript.toLowerCase();
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  const counts: Record<string, number> = {
    'um / uh': 0,
    'you know': 0,
    'like': 0,
    'kind of / sort of': 0,
    'i mean': 0,
    'actually / basically': 0,
  };

  // 1. Hesitation vowels: um, uh, erm, er, ah, hmm
  const umMatches = clean.match(/\b(um|uh|erm|er|ah|hmm)\b/g);
  if (umMatches) counts['um / uh'] += umMatches.length;

  // 2. Phrase filler: "you know"
  const youKnowMatches = clean.match(/\byou know\b/g);
  if (youKnowMatches) counts['you know'] += youKnowMatches.length;

  // 3. Phrase filler: "kind of" / "sort of"
  const kindOfMatches = clean.match(/\b(kind of|sort of)\b/g);
  if (kindOfMatches) counts['kind of / sort of'] += kindOfMatches.length;

  // 4. Phrase filler: "i mean"
  const iMeanMatches = clean.match(/\bi mean\b/g);
  if (iMeanMatches) counts['i mean'] += iMeanMatches.length;

  // 5. Adverbial fillers: "actually", "basically", "literally"
  const adverbMatches = clean.match(/\b(actually|basically|literally)\b/g);
  if (adverbMatches) counts['actually / basically'] += adverbMatches.length;

  // 6. Conversational "like" (filter out obvious verb usages like "i like", "we like", "would like", "don't like")
  // Count instances of "like" flanked by punctuation, conjunctions, or hesitation
  const likeTokens = clean.match(/\b([a-z']+)\s+like\b/g) || [];
  let likeCount = 0;
  for (const token of likeTokens) {
    const prev = token.split(/\s+/)[0];
    const verbPreceders = ['i', 'we', 'you', 'they', 'would', 'to', 'dont', "don't", 'really', 'didnt', "didn't"];
    if (!verbPreceders.includes(prev)) {
      likeCount++;
    }
  }
  // Check isolated or comma-separated "like," or ", like"
  const commaLike = clean.match(/(,\s*like\b|\blike\s*,)/g);
  if (commaLike) likeCount += commaLike.length;
  // Deduplicate/bound
  const totalRawLikes = (clean.match(/\blike\b/g) || []).length;
  counts['like'] = Math.min(likeCount, totalRawLikes);

  // Compile active distribution
  const totalFillers = Object.values(counts).reduce((sum, c) => sum + c, 0);

  if (totalFillers === 0) {
    return {
      totalFillers: 0,
      fillerScore: 10.0,
      fillerDistribution: [],
    };
  }

  const fillerDistribution: FillerDistributionItem[] = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / totalFillers) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Calibrate filler score based on density (fillers per 50 words)
  // 0 fillers = 10.0
  // 1-2 fillers per 50 words = 8.0 - 9.0 (very normal, native-like)
  // 3-4 fillers per 50 words = 6.5 - 7.5
  // 5+ fillers per 50 words = 4.5 - 6.0
  const effectiveWordCount = Math.max(20, wordCount);
  const ratio = (totalFillers / effectiveWordCount) * 50;
  let score = 10.0 - ratio * 0.9;
  score = Math.max(3.5, Math.min(9.8, Math.round(score * 10) / 10));

  return {
    totalFillers,
    fillerScore: score,
    fillerDistribution,
  };
}

