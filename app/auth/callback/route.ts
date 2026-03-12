import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Handle OAuth errors (like signup_disabled)
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorUrl = new URL(`${origin}/auth/auth-code-error`)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('description', errorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  if (code) {
    const { supabase, headers } = createClient(request)
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError && data.session) {
      const response = NextResponse.redirect(`${origin}${next}`)
      // Apply any cookie changes
      headers.forEach((value, key) => {
        response.headers.append(key, value)
      })
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
