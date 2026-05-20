import { NextResponse } from 'next/server'

export async function GET() {
  if (typeof global !== 'undefined') {
    return NextResponse.json((global as any).sandboxDb || {}, { status: 200 })
  }
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof global !== 'undefined') {
      (global as any).sandboxDb = body
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
