import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  
  const sitePassword = process.env.SITE_PASSWORD
  
  if (!sitePassword) {
    // If no password is set in env, allow access
    return NextResponse.json({ success: true })
  }

  if (password === sitePassword) {
    // Set a cookie to remember the user has authenticated
    const cookieStore = await cookies()
    cookieStore.set('site-access', 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
