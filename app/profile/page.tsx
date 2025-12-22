import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from './actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?message=Please login to view your profile')
  }

  // Get user metadata (from OAuth or signup)
  const metadata = user.user_metadata || {}
  const avatarUrl = metadata.avatar_url || metadata.picture || null
  const fullName = metadata.full_name || metadata.name || 'User'
  const email = user.email || 'No email'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Account Information</p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt="Profile Avatar" 
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
            <p className="text-lg font-semibold">{fullName}</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <p className="text-lg font-semibold">{email}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User ID</label>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">{user.id}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Auth Provider</label>
            <p className="text-lg font-semibold capitalize">{user.app_metadata?.provider || 'Email'}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Sign In</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Link 
            href="/"
            className="w-full text-center py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </Link>
          
          <form action={signOut}>
            <button 
              type="submit"
              className="w-full py-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-medium hover:bg-red-500/20 transition border border-red-500/30"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Debug Section */}
        <details className="mt-6 text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600">Debug: Raw User Data</summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-48 text-[10px]">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>

      </div>
    </div>
  )
}
