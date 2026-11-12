import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (!isSupabaseConfigured) {
      return NextResponse.json({ sessions: [], stats: null });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ sessions: [], stats: null });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Get recent sessions with assessments
    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select(`
        id,
        topic_title,
        level,
        audio_duration_seconds,
        status,
        created_at,
        assessment_reports (
          id,
          overall_score,
          assessment_verdict
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Get activity counts for heatmap
    const { data: activity } = await supabase
      .from('practice_activity')
      .select('activity_date, recording_count')
      .eq('user_id', user.id);

    return NextResponse.json({
      profile,
      sessions: sessions || [],
      activity: activity || [],
    });
  } catch (err: any) {
    if (err?.digest === 'HANGING_PROMISE_REJECTION' || err?.digest?.startsWith('NEXT_') || err?.message?.includes('prerender')) {
      throw err;
    }
    console.error('Fetch sessions error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch sessions' }, { status: 500 });
  }
}

