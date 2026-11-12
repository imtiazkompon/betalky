import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, word, words } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, localOnly: true });
    }

    const supabase = await createServerClient();

    if (action === 'bulk_import' && Array.isArray(words)) {
      const { error } = await supabase.from('vocabulary_words').upsert(words);
      if (error) throw error;
      return NextResponse.json({ success: true, count: words.length });
    }

    if (action === 'add' && word) {
      const { error } = await supabase.from('vocabulary_words').insert(word);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && word?.id) {
      const { error } = await supabase
        .from('vocabulary_words')
        .update(word)
        .eq('id', word.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete' && word?.id) {
      const { error } = await supabase
        .from('vocabulary_words')
        .delete()
        .eq('id', word.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

