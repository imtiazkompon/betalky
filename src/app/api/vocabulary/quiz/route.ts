import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { calculateNextSRSReview } from '@/lib/vocabulary/srs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word_id, session_id, question_type, selected_answer, is_correct } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, localOnly: true });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, guest: true });
    }

    // 1. Record quiz attempt
    if (word_id && word_id !== 'matching') {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        word_id,
        session_id: session_id || null,
        question_type,
        selected_answer,
        is_correct,
      });

      // 2. Fetch existing progress for SRS update
      const { data: existing } = await supabase
        .from('user_vocabulary')
        .select('*')
        .eq('user_id', user.id)
        .eq('word_id', word_id)
        .maybeSingle();

      const srsUpdate = calculateNextSRSReview(existing || {}, is_correct);

      await supabase.from('user_vocabulary').upsert({
        user_id: user.id,
        word_id,
        ...srsUpdate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,word_id' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

