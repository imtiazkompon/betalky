import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await segmentData.params;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = await createServerClient();

    // Fetch session and joined assessment report
    const { data: session, error: sessionErr } = await supabase
      .from('practice_sessions')
      .select(`
        *,
        assessment_reports (*)
      `)
      .eq('id', id)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const assessment = Array.isArray(session.assessment_reports)
      ? session.assessment_reports[0]
      : session.assessment_reports;

    return NextResponse.json({
      session,
      assessment,
    });
  } catch (err: any) {
    if (err?.digest === 'HANGING_PROMISE_REJECTION' || err?.digest?.startsWith('NEXT_') || err?.message?.includes('prerender')) {
      throw err;
    }
    console.error('Session get error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

