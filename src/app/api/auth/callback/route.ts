import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Only allow same-site relative destinations (blocks ?next=//evil.com or ?next=@evil.com).
  const rawNext = searchParams.get('next') || '/dashboard';
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle forwarded origin for production environments
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const baseOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  // Forward incoming OAuth or provider errors directly to login with description
  if (error || errorDescription) {
    const errText = encodeURIComponent(errorDescription || error || 'Authentication failed');
    return NextResponse.redirect(`${baseOrigin}/login?error=${errText}`);
  }

  if (code) {
    const supabase = await createServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${baseOrigin}${next}`);
    }
    const errText = encodeURIComponent(exchangeError.message || 'Could not authenticate user');
    return NextResponse.redirect(`${baseOrigin}/login?error=${errText}`);
  }

  return NextResponse.redirect(`${baseOrigin}/login?error=Could not authenticate user`);
}


