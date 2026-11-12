import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { INITIAL_WORDS } from '@/lib/vocabulary/initial-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const unitId = searchParams.get('unitId');
    const search = searchParams.get('search')?.toLowerCase().trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (isSupabaseConfigured) {
      try {
        const supabase = await createServerClient();
        let query = supabase.from('vocabulary_words').select('*').eq('status', 'published');

        if (level) {
          query = query.eq('level', level);
        }
        if (unitId) {
          query = query.eq('unit_id', unitId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          let words = data;
          if (search) {
            words = words.filter(
              (w: any) =>
                w.word.toLowerCase().includes(search) ||
                w.bengali_meaning.toLowerCase().includes(search) ||
                w.english_definition.toLowerCase().includes(search)
            );
          }
          return NextResponse.json({ words });
        }
      } catch (dbErr) {
        console.warn('Database query fallback to initial words:', dbErr);
      }
    }

    // Fallback to in-memory initial words
    let words = [...INITIAL_WORDS];
    if (level) {
      words = words.filter((w) => w.level === level);
    }
    if (unitId) {
      words = words.filter((w) => w.unit_id === unitId);
    }
    if (search) {
      words = words.filter(
        (w) =>
          w.word.toLowerCase().includes(search) ||
          w.bengali_meaning.toLowerCase().includes(search) ||
          w.english_definition.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ words });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch words' }, { status: 500 });
  }
}

