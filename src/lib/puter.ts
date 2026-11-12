import { puter } from '@heyputer/puter.js';
import { ASSESSMENT_SYSTEM_PROMPT, validateAndSanitizeAssessment } from './assessment-schema';
import { AssessmentReport, DifficultyLevel } from '@/types/betalky';

/**
 * Configure and get the authenticated Puter SDK instance
 */
export function getPuterClient() {
  const token = process.env.PUTER_AUTH_TOKEN;

  if (!token) {
    throw new Error(
      'PUTER_AUTH_TOKEN is not configured. Please set PUTER_AUTH_TOKEN in your environment or .env.local file.'
    );
  }

  // Authenticate Puter client with the token
  puter.setAuthToken(token.trim());
  return puter;
}

export interface PuterTranscriptionResult {
  text: string;
  language_code?: string;
  words?: Array<{
    text: string;
    start?: number;
    end?: number;
  }>;
}

/**
 * Transcribe spoken audio using Puter.js Speech-to-Text API (puter.ai.speech2txt)
 */
export async function transcribeAudioWithPuter(
  audioBuffer: Buffer,
  fileName: string = 'recording.wav',
  mimeType: string = 'audio/wav'
): Promise<PuterTranscriptionResult> {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Received an empty audio buffer. Please record audio before transcribing.');
  }

  const client = getPuterClient();

  // Sanitize MIME type
  const cleanMime = mimeType.split(';')[0].trim().toLowerCase() || 'audio/wav';

  // Puter speech2txt accepts a Data URI string, Blob, or File
  const base64Audio = audioBuffer.toString('base64');
  const dataUri = `data:${cleanMime};base64,${base64Audio}`;

  try {
    const response: any = await client.ai.speech2txt(dataUri, {
      language: 'en',
    });

    if (!response || typeof response.text !== 'string' || response.text.trim().length === 0) {
      throw new Error(
        'No clear speech was detected in the audio recording. Please speak clearly into your microphone and try again.'
      );
    }

    const words = Array.isArray(response.words)
      ? response.words.map((w: any) => ({
          text: w.word || w.text || '',
          start: typeof w.start === 'number' ? w.start : undefined,
          end: typeof w.end === 'number' ? w.end : undefined,
        }))
      : [];

    return {
      text: response.text.trim(),
      language_code: response.languages?.[0] || 'en',
      words,
    };
  } catch (err: any) {
    if (err.message && err.message.includes('No clear speech')) {
      throw err;
    }
    throw new Error(
      `Puter Speech-to-Text error: ${err.message || 'Failed to process audio with Puter AI STT'}`
    );
  }
}

/**
 * Evaluate spoken transcript using Puter.js AI Chat (puter.ai.chat)
 */
export async function assessSpeechWithPuter(params: {
  sessionId: string;
  topicTitle: string;
  level: DifficultyLevel;
  transcript: string;
  durationSeconds?: number;
}): Promise<AssessmentReport> {
  const { sessionId, topicTitle, level, transcript, durationSeconds } = params;

  if (!transcript || transcript.trim().length === 0) {
    throw new Error('A valid speech transcript is required for Puter AI assessment.');
  }

  const client = getPuterClient();
  const model = process.env.PUTER_CHAT_MODEL || 'gpt-4o-mini';

  const userPrompt = `
Topic: "${topicTitle}"
Assigned Level: ${level}
Spoken Recording Duration: ${durationSeconds || 30} seconds
Spoken Audio Transcription:
"""
${transcript.trim()}
"""

Please assess this spoken response according to CEFR criteria for ${level} English learners. Return strictly the JSON object adhering to the schema.`;

  let rawContent: string | null = null;

  try {
    const response: any = await client.ai.chat(
      [
        { role: 'system', content: ASSESSMENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        model,
        temperature: 0.2,
      }
    );

    if (response?.message?.content && typeof response.message.content === 'string') {
      rawContent = response.message.content;
    } else if (typeof response?.text === 'string') {
      rawContent = response.text;
    } else if (typeof response === 'string') {
      rawContent = response;
    }
  } catch (chatErr: any) {
    throw new Error(`Puter AI Chat assessment failed: ${chatErr.message || 'Unknown Puter error'}`);
  }

  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('Puter AI Chat returned an empty assessment response from the model.');
  }

  // Sanitize out any markdown backticks if model wrapped JSON
  let cleaned = rawContent.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr: any) {
    throw new Error(
      `Failed to parse Puter assessment as valid JSON: ${parseErr.message}. Raw output: ${cleaned.slice(0, 200)}...`
    );
  }

  return validateAndSanitizeAssessment(parsed, sessionId, transcript);
}

