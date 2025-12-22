'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// 1. Logic Login Biasa (Email & Password)
export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?message=Gagal login, cek email/password')
  }

  return redirect('/') // Redirect ke dashboard kalau sukses
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')
  
  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return redirect('/login?message=Sign up failed: ' + error.message)
  }

  return redirect('/login?message=Check email to continue sign in process')
}

// 2. Logic Login Google (OAuth)
export async function loginWithGoogle() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Penting: Redirect balik ke route handler kita setelah dari Google
      redirectTo: `${origin}/auth/callback`, 
    },
  })

  if (error) {
    console.error('OAuth Error:', error)
  }

  if (data.url) {
    redirect(data.url) // User "dilempar" ke halaman login Google
  }
}
