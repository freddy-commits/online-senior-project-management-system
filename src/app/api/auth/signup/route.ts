import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { validateEmailForRole, validateInstitutionalId, STUDENT_ID_ROLES, STAFF_ID_ROLES } from '@/lib/email-validation'

// ELEVATED_ROLES: users who select these roles during signup will be registered
// as 'student' in the profiles table (security default), but a role_request row
// will be created with status='pending' so an admin/instructor can approve them.
const ELEVATED_ROLES = ['instructor', 'supervisor', 'industry_partner', 'examiner']

// This route uses the service role to create users server-side,
// completely bypassing any broken database trigger issues.
export async function POST(request: NextRequest) {
  // Guard: ensure required env vars are present on the server
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables on the server.')
    return NextResponse.json(
      { error: 'Server configuration error: missing environment variables. Please contact the administrator.' },
      { status: 500 }
    )
  }

  try {
    const { email, password, fullName, role: requestedRole, department, studentId, staffId } = await request.json()

    if (!email || !password || !fullName || !requestedRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // SECURITY: The `role` field from the client is used ONLY to determine whether
    // to create a role_request row. The actual profile.role is ALWAYS 'student'.
    // This prevents privilege escalation: no matter what role a user claims in the
    // signup form, they always start as a student until explicitly approved.
    const validRoles = ['student', 'industry_partner', ...ELEVATED_ROLES]
    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified.' },
        { status: 400 }
      )
    }

    // SECURITY: Validate email domain for the selected role.
    // Students must use @ueab.ac.ke emails. Industry partners can use any domain.
    const emailError = validateEmailForRole(email, requestedRole)
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 })
    }

    // SECURITY: Validate Student ID / Staff ID for academic roles.
    const institutionalId = STUDENT_ID_ROLES.includes(requestedRole) ? studentId : STAFF_ID_ROLES.includes(requestedRole) ? staffId : null
    const idError = validateInstitutionalId(institutionalId, requestedRole)
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 })
    }

    // Create admin Supabase client using service role key
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Step 1: Create the auth user using admin API (email auto-confirmed)
    // SECURITY: Do NOT store role in user_metadata — user_metadata is writable by
    // the user via supabase.auth.updateUser() and is read by middleware as a shortcut.
    // Storing role there creates a privilege escalation vector.
    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      // If user already exists, return a clear message
      if (createError.message?.includes('already been registered') || createError.status === 422) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!createData.user) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
    }

    const userId = createData.user.id

    // Step 2: Upsert profile row using admin client (bypasses RLS)
    // SECURITY: profile.role is ALWAYS hardcoded to 'student' here.
    // The user's selected role (if elevated) is handled in Step 3 via role_requests.
    // Never trust the requestedRole from the client for setting profiles.role.
    const profileData: Record<string, any> = {
      id: userId,
      email: email,
      full_name: fullName,
      role: 'student', // ALWAYS 'student' — never set from client input
    }

    // Save department for all roles that have a department
    const rolesWithDept = ['student', 'instructor', 'supervisor', 'examiner']
    if (department && rolesWithDept.includes(requestedRole)) {
      profileData.department = department
    }

    // Save Student ID or Staff ID as university_id
    if (STUDENT_ID_ROLES.includes(requestedRole) && studentId) {
      profileData.university_id = studentId.trim()
    }
    if (STAFF_ID_ROLES.includes(requestedRole) && staffId) {
      profileData.university_id = staffId.trim()
    }

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (profileError) {
      // Profile insert failed — this is critical, log full detail
      console.error('Profile upsert FAILED:', JSON.stringify(profileError))
      // Don't block registration — the user is created, profile can be patched
    }

    // Step 3: If the user selected an elevated role, create a role_request row.
    // The user will see a "Pending Approval" screen at /hub until an admin approves.
    let pendingApproval = false
    if (ELEVATED_ROLES.includes(requestedRole)) {
      const { error: roleRequestError } = await adminSupabase
        .from('role_requests')
        .insert({
          user_id: userId,
          requested_role: requestedRole,
          department: department || null,
          status: 'pending',
        })

      if (roleRequestError) {
        console.error('role_requests insert error (non-fatal):', roleRequestError.message)
      } else {
        pendingApproval = true
        console.log(`Role request created for user ${userId}: ${requestedRole} (pending approval)`)
      }
    }

    // Step 4: Return success — client will sign in and be routed via /hub
    return NextResponse.json({
      success: true,
      userId,
      email,
      // SECURITY: Return the actual profile role ('student'), not the requested role.
      // The client should redirect to /hub, which handles the routing logic.
      role: 'student',
      pendingApproval,
      requestedRole: pendingApproval ? requestedRole : null,
    })

  } catch (e: any) {
    console.error('Server signup error:', e)
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
