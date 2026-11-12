import { NextRequest, NextResponse } from 'next/server';
import { assessSpeechWithPuter } from '@/lib/puter';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, topicTitle, level, transcript, durationSeconds, audioUrl } = body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'A valid speech transcript is required for AI assessment.' },
        { status: 400 }
      );
    }

    if (!topicTitle) {
      return NextResponse.json(
        { error: 'Topic title is required for context-aware assessment.' },
        { status: 400 }
      );
    }

    // Call Puter.js AI Chat API with configured model
    let assessmentReport;
    try {
      assessmentReport = await assessSpeechWithPuter({
        sessionId: sessionId || `session_${Date.now()}`,
        topicTitle,
        level: level || 'Intermediate',
        transcript: transcript.trim(),
        durationSeconds: durationSeconds || 30,
      });
    } catch (aiErr: any) {
      return NextResponse.json(
        {
          error: aiErr.message || 'AI assessment with Puter.js failed.',
          stage: 'assessment',
        },
        { status: 502 }
      );
    }

    // Save report in Supabase if configured and user is authenticated
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (isSupabaseConfigured) {
      try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // If session doesn't exist yet, insert session
          let currentSessionId = sessionId;
          if (!currentSessionId || currentSessionId.startsWith('local_')) {
            const { data: insertedSession } = await supabase
              .from('practice_sessions')
              .insert({
                user_id: user.id,
                topic_title: topicTitle,
                level: level || 'Intermediate',
                audio_url: audioUrl || null,
                audio_duration_seconds: durationSeconds || 30,
                transcript: transcript,
                status: 'completed',
              })
              .select('id')
              .single();

            if (insertedSession) {
              currentSessionId = insertedSession.id;
              assessmentReport.session_id = currentSessionId;
            }
          } else {
            await supabase
              .from('practice_sessions')
              .update({
                status: 'completed',
                transcript: transcript,
                audio_url: audioUrl || undefined,
              })
              .eq('id', currentSessionId);
          }

          // Insert assessment report
          const { data: insertedReport, error: reportError } = await supabase
            .from('assessment_reports')
            .upsert({
              session_id: currentSessionId,
              user_id: user.id,
              overall_score: assessmentReport.overall_score,
              assessment_verdict: assessmentReport.assessment_verdict,
              summary: assessmentReport.summary,
              corrected_transcript: assessmentReport.corrected_transcript,
              grammar_score: assessmentReport.grammar_score,
              vocabulary_score: assessmentReport.vocabulary_score,
              fluency_score: assessmentReport.fluency_score,
              repetition_score: assessmentReport.repetition_score,
              filler_score: assessmentReport.filler_score,
              clarity_score: assessmentReport.clarity_score,
              proficiency_breakdown: assessmentReport.proficiency_breakdown,
              targeted_corrections: assessmentReport.targeted_corrections,
              filler_distribution: assessmentReport.filler_distribution,
              pedagogical_tip: assessmentReport.pedagogical_tip,
              suggested_model_answer: assessmentReport.suggested_model_answer,
              speaking_dynamics: assessmentReport.speaking_dynamics,
              strengths: assessmentReport.strengths,
              next_steps: assessmentReport.next_steps,
              focus_goals: assessmentReport.focus_goals,
            }, { onConflict: 'session_id' })
            .select('id')
            .single();

          if (insertedReport) {
            assessmentReport.id = insertedReport.id;
          }

          // Update practice activity heatmap
          const todayDate = new Date().toISOString().split('T')[0];
          try {
            const { error: rpcError } = await supabase.rpc('increment_practice_activity', {
              p_user_id: user.id,
              p_date: todayDate,
            });
            if (rpcError) {
              const { data: existingActivity } = await supabase
                .from('practice_activity')
                .select('recording_count')
                .eq('user_id', user.id)
                .eq('activity_date', todayDate)
                .maybeSingle();

              const count = (existingActivity?.recording_count || 0) + 1;
              await supabase.from('practice_activity').upsert({
                user_id: user.id,
                activity_date: todayDate,
                recording_count: count,
              }, { onConflict: 'user_id,activity_date' });
            }
          } catch {
            // activity tracking fallback complete
          }
        }
      } catch (dbErr) {
        console.warn('Database assessment persistence note:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      report: assessmentReport,
    });
  } catch (err: any) {
    console.error('Assessment route error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during speech assessment.' },
      { status: 500 }
    );
  }
}

