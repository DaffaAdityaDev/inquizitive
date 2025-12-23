'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import SubjectSelector from './SubjectSelector'


export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success('Signed out successfully')
    router.push('/login')
  }
  
  const isActive = (path: string) => pathname === path

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'The Forge', path: '/quiz', icon: '🔥' },
    { name: 'The Gym', path: '/review', icon: '🏋️' },
    { name: 'Library', path: '/library', icon: '📚' },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🧠</span>
              <span className="hidden sm:inline bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">Inquizitive</span>
            </Link>
            <SubjectSelector />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Profile Link with Avatar */}
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                    isActive('/profile')
                      ? 'bg-white/10 border border-white/5'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {(user.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-gray-200">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Profile'}
                  </span>
                </Link>
                
                {/* Sign Out Button */}
                <button 
                  onClick={handleSignOut}
                  className="px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">🚪</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-bold text-black bg-white hover:bg-gray-200 rounded-full transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
