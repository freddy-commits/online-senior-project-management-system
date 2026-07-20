import { NextResponse } from 'next/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // SECURITY: Verify the user is authenticated before allowing uploads
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: You must be logged in to upload files.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'project-documents'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: 'Server configuration error: missing Supabase environment variables.' }, { status: 500 })
    }

    // Use admin client so we can upload without needing an auth session on the server
    const adminSupabase = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const buffer = Buffer.from(await file.arrayBuffer())

    // Build a unique path: timestamp_originalname
    const ext = file.name.split('.').pop() || ''
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '_')
    const timestamp = Date.now()
    const storagePath = `${timestamp}_${baseName}.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from(bucket)
      .getPublicUrl(storagePath)

    const fileUrl = publicUrlData.publicUrl

    return NextResponse.json({ success: true, url: fileUrl, filename: file.name, path: storagePath })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 })
  }
}
