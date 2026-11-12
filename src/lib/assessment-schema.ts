import { AssessmentReport, ProficiencyMetric, TargetedCorrection, FillerDistributionItem, SpeakingDynamics } from '@/types/betalky';
import { analyzeFillerWords } from './filler-words';

export const ASSESSMENT_SYSTEM_PROMPT = `You are beTalky's expert AI spoken English assessment engine.
Evaluate the user's spoken audio transcription based on their assigned speaking topic and CEFR level standards.

Your task is to provide an accurate, nuanced, and constructive diagnostic report formatted strictly as a single JSON object (with NO markdown code fences, NO introductory text, and NO trailing text).

The JSON output MUST follow this exact schema:
{
  "overall_score": 6.8, // Float between 1.0 and 10.0
  "assessment_verdict": "Clear flow with minor slips", // IMPORTANT: A fresh, dynamic 2-5 word verdict tailored to what this specific user said (e.g. "Fluent & articulate", "Clear flow with minor slips", "Expressive with grammar gaps", "Developing fluency & good ideas", "Hesitant flow, great effort"). DO NOT copy this example verbatim.
  "summary": "You explain your ideas with good clarity and contextual vocabulary. Your examples help convey the message well, but minor hesitation pauses and repeated phrases sometimes disrupt natural rhythm.",
  "corrected_transcript": "The full transcription rewritten in natural, grammatically flawless English while preserving the user's authentic ideas and voice.",
  "grammar_score": 6.5, // 1.0 to 10.0
  "vocabulary_score": 7.2, // 1.0 to 10.0
  "fluency_score": 7.0, // 1.0 to 10.0
  "repetition_score": 6.0, // 1.0 to 10.0
  "filler_score": 6.8, // 1.0 to 10.0
  "clarity_score": 7.5, // 1.0 to 10.0
  "proficiency_breakdown": [
    { "metric": "Grammar", "score": 6.5, "feedback": "Good subject-verb agreement, occasional preposition slip." },
    { "metric": "Vocabulary", "score": 7.2, "feedback": "Varied topic-specific words ('infrastructure', 'crosswalks')." },
    { "metric": "Fluency", "score": 7.0, "feedback": "Consistent flow with few hesitation pauses." },
    { "metric": "Repetition", "score": 6.0, "feedback": "Repeated 'I think' and 'you know' 4 times." },
    { "metric": "Filler Words", "score": 6.8, "feedback": "Low-moderate usage (4 fillers in 58 seconds)." },
    { "metric": "Clarity & Coherence", "score": 7.5, "feedback": "Ideas linked logically with clear reasoning." }
  ],
  "targeted_corrections": [
    {
      "timestamp": "00:14", // Approx timestamp or order (e.g. "00:14", "00:32")
      "you_said": "...cars makes it dangerous...", // Exact or excerpted error
      "corrected_form": "...cars make it dangerous...", // Proper grammatical alternative
      "rule_name": "Subject-Verb Agreement", // Category/rule
      "explanation": "The subject 'cars' is plural, so it takes the plural base verb form 'make', not the singular third-person form 'makes'."
    }
  ],
  "filler_distribution": [
    { "word": "um / uh", "count": 2, "percentage": 50 },
    { "word": "like", "count": 1, "percentage": 25 },
    { "word": "you know", "count": 1, "percentage": 25 }
  ],
  "pedagogical_tip": "Replace filler words with a brief silent breath before transitional phrases. Silence reads as poise and intentional pacing.",
  "suggested_model_answer": "In my view, our city could significantly enhance pedestrian safety by reshaping key transit corridors. Currently, high vehicle density poses considerable challenges for commuters on foot, particularly during peak rush hours. Introducing continuous sidewalk buffers, designated cycle tracks, and elevated crossings would make our urban core much friendlier for families and seniors alike.",
  "speaking_dynamics": {
    "pace_wpm": 118,
    "fillers_total": 4,
    "pauses_count": 2,
    "output_words": 86
  },
  "strengths": [
    "Clear structure introducing the core challenge immediately.",
    "Rich lexical terms and contextual vocabulary.",
    "Confident pronunciation with expressive vocal pitch."
  ],
  "next_steps": [
    "Practice conditional sentence structures ('If the city were to... it would...').",
    "Pause deliberately instead of saying 'you know' during thought transitions.",
    "Deliver a conclusive summary sentence before finishing your timer."
  ],
  "focus_goals": [
    "Eliminate double comparatives ('more faster' / 'more friendlier')",
    "Maintain pacing above 110 WPM without conversational filler words",
    "Expand topic conclusion with a concrete policy recommendation clause"
  ]
}

Ensure all metrics are tailored directly to the supplied transcript and topic.
`;

function clampScore(val: unknown, fallback: number = 7.0): number {
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return fallback;
  return Math.max(1.0, Math.min(10.0, Math.round(num * 10) / 10));
}

export function generateDynamicVerdict(
  score: number,
  grammarScore: number,
  fluencyScore: number,
  vocabularyScore: number,
  transcript: string
): string {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  if (score >= 9.0) {
    if (vocabularyScore >= 9.0) return 'Fluent, articulate & natural';
    return 'Near-native precision & flow';
  }
  if (score >= 8.0) {
    if (fluencyScore > grammarScore) return 'Expressive flow with minor slips';
    if (vocabularyScore > fluencyScore) return 'Rich vocabulary & clear intent';
    return 'Confident, natural communication';
  }
  if (score >= 7.0) {
    if (grammarScore < 6.8) return 'Clear ideas, needs grammatical polish';
    if (fluencyScore < 6.8) return 'Coherent thought with slight pauses';
    return 'Solid communication & steady flow';
  }
  if (score >= 5.8) {
    if (wordCount < 25) return 'Good start, try elaborating more';
    if (fluencyScore < 5.8) return 'Clear intent, work on pacing';
    return 'Developing fluency with good ideas';
  }
  if (score >= 4.5) {
    return 'Foundational effort, focus on sentence flow';
  }
  return 'Early stage, keep practicing daily';
}

export function validateAndSanitizeAssessment(
  rawJson: any,
  sessionId: string,
  originalTranscript: string
): AssessmentReport {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('Invalid assessment response format: expected a JSON object.');
  }

  // 1. Accurately analyze filler words from the real transcript
  const fillerAnalysis = analyzeFillerWords(originalTranscript);

  const overallScore = clampScore(rawJson.overall_score, 6.8);
  const grammarScore = clampScore(rawJson.grammar_score, 6.5);
  const vocabularyScore = clampScore(rawJson.vocabulary_score, 7.0);
  const fluencyScore = clampScore(rawJson.fluency_score, 6.8);
  const repetitionScore = clampScore(rawJson.repetition_score, 6.5);
  // Use mathematically analyzed filler score
  const fillerScore = fillerAnalysis.totalFillers === 0 ? 10.0 : clampScore(fillerAnalysis.fillerScore, 7.0);
  const clarityScore = clampScore(rawJson.clarity_score, 7.2);

  // 2. Generate dynamic, non-repetitive verdict
  let verdict = typeof rawJson.assessment_verdict === 'string' ? rawJson.assessment_verdict.trim() : '';
  const genericVerdicts = ['understandable but needs work', 'completed', 'good', 'n/a', ''];
  if (!verdict || genericVerdicts.includes(verdict.toLowerCase())) {
    verdict = generateDynamicVerdict(overallScore, grammarScore, fluencyScore, vocabularyScore, originalTranscript);
  }

  const summary = typeof rawJson.summary === 'string' && rawJson.summary.trim().length > 0
    ? rawJson.summary.trim()
    : 'You express your ideas clearly. Continued practice focusing on pacing and grammatical precision will further enhance your fluency.';

  const correctedTranscript = typeof rawJson.corrected_transcript === 'string' && rawJson.corrected_transcript.trim().length > 0
    ? rawJson.corrected_transcript.trim()
    : originalTranscript;

  const proficiencyBreakdown: ProficiencyMetric[] = Array.isArray(rawJson.proficiency_breakdown) && rawJson.proficiency_breakdown.length > 0
    ? rawJson.proficiency_breakdown.map((item: any) => ({
        metric: String(item.metric || 'Metric'),
        score: clampScore(item.score, 7.0),
        feedback: String(item.feedback || 'Good effort.')
      }))
    : [
        { metric: 'Grammar', score: grammarScore, feedback: 'Generally consistent structure with minor slips.' },
        { metric: 'Vocabulary', score: vocabularyScore, feedback: 'Good contextual vocabulary.' },
        { metric: 'Fluency', score: fluencyScore, feedback: 'Steady pace with slight pauses.' },
        { metric: 'Repetition', score: repetitionScore, feedback: 'Minimal recurring phrases.' },
        { metric: 'Filler Words', score: fillerScore, feedback: fillerAnalysis.totalFillers === 0 ? 'No filler words detected.' : `${fillerAnalysis.totalFillers} filler words detected.` },
        { metric: 'Clarity & Coherence', score: clarityScore, feedback: 'Ideas organized logically.' }
      ];

  const targetedCorrections: TargetedCorrection[] = Array.isArray(rawJson.targeted_corrections)
    ? rawJson.targeted_corrections.map((item: any, idx: number): TargetedCorrection => ({
        timestamp: String(item.timestamp || `00:${String((idx + 1) * 15).padStart(2, '0')}`),
        you_said: String(item.you_said || ''),
        corrected_form: String(item.corrected_form || ''),
        rule_name: String(item.rule_name || 'Grammar Note'),
        explanation: String(item.explanation || 'Refine word choice or phrasing.')
      })).filter((tc: TargetedCorrection) => tc.you_said && tc.corrected_form)
    : [];

  // 3. Exact deterministic filler distribution
  const fillerDistribution: FillerDistributionItem[] = fillerAnalysis.fillerDistribution;

  const wordCount = originalTranscript.trim().split(/\s+/).filter(Boolean).length;
  const dynamics: SpeakingDynamics = {
    pace_wpm: typeof rawJson.speaking_dynamics?.pace_wpm === 'number' ? rawJson.speaking_dynamics.pace_wpm : Math.max(80, Math.min(160, Math.round(wordCount * 1.5))),
    fillers_total: fillerAnalysis.totalFillers,
    pauses_count: typeof rawJson.speaking_dynamics?.pauses_count === 'number' ? rawJson.speaking_dynamics.pauses_count : Math.max(1, Math.round(wordCount / 25)),
    output_words: wordCount
  };

  const strengths = Array.isArray(rawJson.strengths) && rawJson.strengths.length > 0
    ? rawJson.strengths.map(String)
    : ['Clear response to the speaking topic.', 'Engaging communication and confidence.', 'Effective core vocabulary.'];

  const nextSteps = Array.isArray(rawJson.next_steps) && rawJson.next_steps.length > 0
    ? rawJson.next_steps.map(String)
    : ['Practice connecting clauses with varied conjunctions.', 'Breathe during natural pauses instead of using fillers.', 'Conclude with a summary thought.'];

  const focusGoals = Array.isArray(rawJson.focus_goals) && rawJson.focus_goals.length > 0
    ? rawJson.focus_goals.map(String)
    : [
        'Eliminate unnecessary filler words during pauses',
        'Maintain consistent speaking tempo without rushing',
        'Practice complex sentence structures'
      ];

  return {
    id: rawJson.id || `rep_${Date.now()}`,
    session_id: sessionId,
    overall_score: overallScore,
    assessment_verdict: verdict,
    summary,
    corrected_transcript: correctedTranscript,
    original_transcript: originalTranscript,
    grammar_score: grammarScore,
    vocabulary_score: vocabularyScore,
    fluency_score: fluencyScore,
    repetition_score: repetitionScore,
    filler_score: fillerScore,
    clarity_score: clarityScore,
    proficiency_breakdown: proficiencyBreakdown,
    targeted_corrections: targetedCorrections,
    filler_distribution: fillerDistribution,
    pedagogical_tip: typeof rawJson.pedagogical_tip === 'string' && rawJson.pedagogical_tip
      ? rawJson.pedagogical_tip
      : 'Replace filler words with a brief silent breath before transitional phrases. Silence reads as poise and intentional pacing.',
    suggested_model_answer: typeof rawJson.suggested_model_answer === 'string' && rawJson.suggested_model_answer
      ? rawJson.suggested_model_answer
      : 'In my view, our city could significantly enhance pedestrian safety by reshaping key transit corridors.',
    speaking_dynamics: dynamics,
    strengths,
    next_steps: nextSteps,
    focus_goals: focusGoals,
    created_at: new Date().toISOString()
  };
}

