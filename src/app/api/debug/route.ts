import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  // Test 1: Check env vars
  results.env_url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'
  results.env_key_set = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Test 2: DNS + TCP connection to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const start = Date.now()
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      })
      results.supabase_reach = 'SUCCESS'
      results.supabase_status = response.status
      results.supabase_ms = Date.now() - start
    } catch (err: unknown) {
      results.supabase_reach = 'FAILED'
      if (err instanceof Error) {
        results.supabase_error = err.message
        results.supabase_cause = (err as NodeJS.ErrnoException).code || 'unknown'
      }
    }

    // Test 3: Try Supabase Auth endpoint
    try {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        signal: AbortSignal.timeout(8000),
      })
      results.auth_endpoint = 'REACHABLE'
      results.auth_status = authResponse.status
    } catch (err: unknown) {
      results.auth_endpoint = 'FAILED'
      if (err instanceof Error) {
        results.auth_error = err.message
      }
    }
  }

  // Test 4: General internet connectivity
  try {
    await fetch('https://www.google.com', { signal: AbortSignal.timeout(5000) })
    results.internet = 'OK'
  } catch {
    results.internet = 'FAILED - No internet!'
  }

  return NextResponse.json(results, { status: 200 })
}
