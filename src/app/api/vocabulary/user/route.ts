import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (!isSupabaseConfigured) {
      return NextResponse.json({ userVocabulary: [] });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ userVocabulary: [] });
    }

    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ userVocabulary: [], error: error.message });
    }

    return NextResponse.json({ userVocabulary: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word_id, status, is_bookmarked, difficulty_status, user_sentence } = body;

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

    const updates: any = {
      user_id: user.id,
      word_id,
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updates.status = status;
      if (status === 'learned') {
        updates.learned_at = new Date().toISOString();
      }
    }
    if (is_bookmarked !== undefined) updates.is_bookmarked = is_bookmarked;
    if (difficulty_status !== undefined) updates.difficulty_status = difficulty_status;
    if (user_sentence !== undefined) updates.user_sentence = user_sentence;

    const { error } = await supabase
      .from('user_vocabulary')
      .upsert(updates, { onConflict: 'user_id,word_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

