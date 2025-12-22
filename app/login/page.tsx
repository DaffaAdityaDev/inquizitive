import { login, loginWithGoogle, signup } from './actions'

// Next.js 15/16: searchParams is a Promise
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        
        <h2 className="text-2xl font-bold text-center">Welcome to Inquizitive</h2>

        {/* Tombol Login Google */}
        <form action={loginWithGoogle}>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition font-medium">
             {/* Simple Google Icon */}
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
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300 dark:border-gray-600"></span></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400">Or email</span></div>
        </div>

        {/* Form Login Biasa */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input name="password" type="password" required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button formAction={login} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">
              Log In
            </button>
            <button formAction={signup} className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium">
              Sign Up
            </button>
          </div>
          
          {params?.message && (
            <p className="text-sm text-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-600 dark:text-blue-300">
              {params.message}
            </p>
          )}
        </form>

      </div>
    </div>
  )
}
