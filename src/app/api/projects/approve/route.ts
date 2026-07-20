import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify the user is authenticated
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: No active session.' }, { status: 401 })
    }

    // SECURITY: Verify the user has the instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Access denied. Only instructors can approve or reject projects.' },
        { status: 403 }
      )
    }

    const { projectId, supervisorId, action } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    if (action === 'reject') {
      const { error } = await adminSupabase
        .from('projects')
        .update({ status: 'rejected' })
        .eq('id', projectId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (!supervisorId) {
      return NextResponse.json({ error: 'Missing supervisorId' }, { status: 400 })
    }

    const { error } = await adminSupabase
      .from('projects')
      .update({
        status: 'approved',
        instructor_id: supervisorId
      })
      .eq('id', projectId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (e: any) {
    console.error('Server project approval error:', e)
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
