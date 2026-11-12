import { NextRequest, NextResponse } from 'next/server';
import { getPuterClient } from '@/lib/puter';
import { TranslatedReportExplanation } from '@/types/assessment-language';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLanguage, payload } = body;

    if (!targetLanguage || (targetLanguage !== 'bn' && targetLanguage !== 'hi')) {
      return NextResponse.json(
        { error: 'Invalid or missing targetLanguage. Expected "bn" or "hi".' },
        { status: 400 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid assessment explanation payload.' },
        { status: 400 }
      );
    }

    const langName = targetLanguage === 'bn' ? 'Bengali (বাংলা)' : 'Hindi (हिन्दी)';

    const systemPrompt = `You are beTalky's educational assistant for English language learners in Bangladesh and India.
Your task is to translate ONLY the individual diagnostic explanation sentences into short, simple, conversational ${langName}.

CRITICAL REQUIREMENTS:
1. Translate ONLY the specific explanatory text (why a mistake occurred, or how to improve). Keep each explanation short (1-2 simple sentences).
2. PRESERVE ALL FAMILIAR ENGLISH GRAMMAR AND LEARNING TERMS naturally within the sentence.
   - DO NOT translate them into formal or archaic local words.
   - Keep in English: Verb, Noun, Adjective, Adverb, Tense, Past Tense, Present Tense, Present Simple, Subject, Object, Singular, Plural, Base form, Preposition, Pronunciation, Fluency, Filler words, Vocabulary, etc.
   - Preferred Bengali: "এখানে past tense ব্যবহার করেছেন, কিন্তু বাক্যটি বর্তমানের অভ্যাস বোঝাচ্ছে। তাই verb-এর base form ব্যবহার করুন।" (NEVER use ক্রিয়ার রূপ or অতীত কাল).
   - Preferred Hindi: "यहाँ आपने past tense का उपयोग किया है, लेकिन वाक्य वर्तमान की आदत बताता है। इसलिए verb का base form इस्तेमाल करें।" (NEVER use क्रिया का रूप or काल).
3. PRESERVE all quoted English words, example phrases, and corrections exactly as they are (e.g. 'cars', 'make', 'makes', 'goodly', 'well').
4. Keep the output encouraging, simple, and easy for beginners to understand.
5. Return ONLY a single valid JSON object strictly matching the structure of the input payload. No markdown wrapping.`;

    const userPrompt = `Translate only these explanation sentences into conversational ${langName} while keeping English technical terms and quoted words in English:\n${JSON.stringify(payload, null, 2)}`;

    const client = getPuterClient();
    const model = process.env.PUTER_CHAT_MODEL || 'gpt-4o-mini';

    const response: any = await client.ai.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model,
        temperature: 0.2,
      }
    );

    let rawContent: string = '';
    if (response?.message?.content && typeof response.message.content === 'string') {
      rawContent = response.message.content;
    } else if (typeof response?.text === 'string') {
      rawContent = response.text;
    } else if (typeof response === 'string') {
      rawContent = response;
    }

    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error('Puter AI Chat returned an empty translation response.');
    }

    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let translatedData: TranslatedReportExplanation;
    try {
      translatedData = JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error('Failed to parse translation JSON:', parseErr, cleaned);
      throw new Error(`Failed to parse translated explanation JSON: ${parseErr.message}`);
    }

    return NextResponse.json({
      success: true,
      targetLanguage,
      translation: translatedData,
    });
  } catch (err: any) {
    console.error('Translation route error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during assessment translation.' },
      { status: 500 }
    );
  }
}
