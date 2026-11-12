import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioWithPuter } from '@/lib/puter';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const topicTitle = (formData.get('topicTitle') as string) || 'General Topic';
    const level = (formData.get('level') as string) || 'Intermediate';
    const durationSeconds = parseFloat((formData.get('durationSeconds') as string) || '0');
    let sessionId = formData.get('sessionId') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided in request.' },
        { status: 400 }
      );
    }

    // Limit audio file size to 15MB
    if (audioFile.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file exceeds 15MB limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Audio upload to Supabase Storage if configured
    let audioUrl: string | undefined = undefined;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    let userId = 'anonymous';

    if (isSupabaseConfigured) {
      try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }

        const serviceClient = createServiceClient();
        const cleanType = audioFile.type ? audioFile.type.split(';')[0].trim() : 'audio/wav';
        const defaultExt = cleanType.includes('wav') ? 'recording.wav' : 'recording.webm';
        const fileName = `${userId}/${Date.now()}-${audioFile.name || defaultExt}`;
        const { data: uploadData, error: uploadError } = await serviceClient.storage
          .from('betalky-recordings')
          .upload(fileName, buffer, {
            contentType: cleanType,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = serviceClient.storage
            .from('betalky-recordings')
            .getPublicUrl(fileName);
          audioUrl = publicUrlData?.publicUrl;
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload note:', storageErr);
      }
    }

    // Transcribe with Puter.js Speech-to-Text API
    let transcriptionResult;
    try {
      const cleanType = audioFile.type ? audioFile.type.split(';')[0].trim() : 'audio/wav';
      const defaultExt = cleanType.includes('wav') ? 'recording.wav' : 'recording.webm';
      transcriptionResult = await transcribeAudioWithPuter(
        buffer,
        audioFile.name || defaultExt,
        cleanType
      );
    } catch (puterErr: any) {
      return NextResponse.json(
        {
          error: puterErr.message || 'Puter.js speech transcription failed.',
          stage: 'transcription',
        },
        { status: 502 }
      );
    }

    // Save or update session in Supabase if configured
    if (isSupabaseConfigured && userId !== 'anonymous') {
      try {
        const supabase = await createServerClient();
        if (!sessionId) {
          const { data: newSession } = await supabase
            .from('practice_sessions')
            .insert({
              user_id: userId,
              topic_title: topicTitle,
              level: level,
              audio_url: audioUrl,
              audio_duration_seconds: durationSeconds,
              transcript: transcriptionResult.text,
              status: 'transcribing',
            })
            .select()
            .single();

          if (newSession) sessionId = newSession.id;
        } else {
          await supabase
            .from('practice_sessions')
            .update({
              audio_url: audioUrl,
              audio_duration_seconds: durationSeconds,
              transcript: transcriptionResult.text,
              status: 'transcribing',
            })
            .eq('id', sessionId);
        }
      } catch (dbErr) {
        console.warn('Session persistence note:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      transcript: transcriptionResult.text,
      languageCode: transcriptionResult.language_code,
      words: transcriptionResult.words,
      audioUrl: audioUrl,
      sessionId: sessionId || `local_${Date.now()}`,
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during transcription.' },
      { status: 500 }
    );
  }
}

