import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image exceeds 5 MB limit.' }, { status: 400 });
    }

    // Check if user is authenticated
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User is not authenticated in Supabase (guest mode)
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'Guest mode: image stored locally in browser.',
      });
    }

    // Authenticated: upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const serviceClient = createServiceClient();
    const cleanType = file.type ? file.type.split(';')[0].trim() : 'image/jpeg';
    const ext = cleanType.includes('png') ? 'png' : 'jpg';
    const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('betalky-recordings')
      .upload(fileName, buffer, {
        contentType: cleanType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload photo to storage.' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = serviceClient.storage
      .from('betalky-recordings')
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Update user's avatar_url in profiles table
    try {
      await serviceClient.from('profiles').upsert(
        {
          id: user.id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (dbErr) {
      console.warn('Profiles table avatar update notice:', dbErr);
    }

    // Update user's auth metadata
    try {
      await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          avatar_url: avatarUrl,
        },
      });
    } catch (authErr) {
      console.warn('Auth user metadata update notice:', authErr);
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      avatarUrl,
    });
  } catch (err: any) {
    console.error('Avatar upload route error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during photo upload.' },
      { status: 500 }
    );
  }
}

