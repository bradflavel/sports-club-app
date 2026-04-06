import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password');
  const isResetPasswordPage = request.nextUrl.pathname.startsWith('/reset-password');
  const isPublicPage = request.nextUrl.pathname === '/';
  const isJoinPage = request.nextUrl.pathname.startsWith('/join');
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding');

  // If a password reset code arrives, redirect to the auth callback to exchange it
  const code = request.nextUrl.searchParams.get('code');
  const nextParam = request.nextUrl.searchParams.get('next');
  if (code && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone();
    const destination = nextParam || request.nextUrl.pathname;
    url.pathname = '/auth/callback';
    url.searchParams.set('code', code);
    url.searchParams.set('next', destination);
    return NextResponse.redirect(url);
  }

  if (!user && !isAuthPage && !isPublicPage && !isJoinPage && !isOnboardingPage && !isResetPasswordPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
