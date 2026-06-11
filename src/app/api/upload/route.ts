import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name.replace(/\s+/g, '_') // Replace spaces with underscores for clean URLs
    
    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Write file to public/uploads
    const filePath = path.join(uploadsDir, filename)
    await fs.writeFile(filePath, buffer)

    const fileUrl = `/uploads/${filename}`
    return NextResponse.json({ success: true, url: fileUrl })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 })
  }
}
