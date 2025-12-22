import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    // Tukar "code" dari Google menjadi Session user yang valid
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Kalau sukses, lempar masuk ke aplikasi
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Kalau gagal, balikin ke login
  return NextResponse.redirect(`${origin}/login?message=Auth Error`)
}
