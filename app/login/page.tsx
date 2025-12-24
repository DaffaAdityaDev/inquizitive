import { login, loginWithGoogle, signup } from './actions'
import { HeroHighlight } from '@/components/ui/hero-highlight'
import { Sparkles, Mail } from 'lucide-react'

// Next.js 15/16: searchParams is a Promise
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;

  return (
    <HeroHighlight containerClassName="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-3xl animate-fade-in relative z-20">

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-white/5 mb-2 ring-1 ring-white/10">
            <span className="text-4xl">🧠</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-gray-400">Enter the Neuro-Stack to continue your mastery.</p>
        </div>

        {/* Tombol Login Google */}
        <form action={loginWithGoogle}>
          <button className="group w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl hover:bg-gray-200 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-2 bg-black/50 text-gray-500 rounded">Or continue with email</span></div>
        </div>

        {/* Form Login Biasa */}
        <form className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 pl-1 uppercase tracking-wide">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all placeholder:text-gray-700"
                placeholder="name@email.com"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 pl-1 uppercase tracking-wide">Password</label>
            <div className="relative group">
              <Sparkles className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
              <input
                name="password"
                type="password"
                required
                className="w-full pl-10 p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all placeholder:text-gray-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button formAction={login} className="flex-1 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue py-3 rounded-xl hover:bg-neon-blue hover:text-black transition-all font-bold">
              Log In
            </button>
            <button formAction={signup} className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all font-bold">
              Sign Up
            </button>
          </div>

          {params?.message && (
            <p className="text-sm text-center bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400">
              {params.message}
            </p>
          )}
        </form>

      </div>
    </HeroHighlight>
  )
}
