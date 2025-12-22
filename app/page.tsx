import Link from "next/link";
import Heatmap from "@/components/Heatmap";
import Tutorial from "@/components/Tutorial";
import { getUserStats } from "./actions";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stats = await getUserStats();

  return (
    <div className="flex flex-col items-center p-8 font-sans">
      
      {/* Tutorial / Onboarding */}
      <Tutorial />

      {/* Stats Section */}
      <section className="w-full mb-12 mt-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
           <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Consistency Tracker</h3>
           <Heatmap activityData={stats.heatmap} />
           <div className="flex gap-8 mt-6">
              <div>
                <div className="text-2xl font-bold">{stats.streak}</div>
                <div className="text-xs text-gray-500">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.xp}</div>
                <div className="text-xs text-gray-500">Total XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500">{stats.mastered}</div>
                <div className="text-xs text-gray-500">Mastered Items</div>
              </div>
           </div>
        </div>
      </section>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: The Forge */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🔥</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-500 transition-colors">The Forge</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Input new knowledge. Paste AI-generated JSON quizzes here. 
            Mistakes will be automatically captured.
          </p>
          <Link 
            href="/quiz" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all w-full shadow-lg hover:shadow-blue-500/25"
          >
            Start New Quiz
          </Link>
        </div>

        {/* Card 2: The Gym */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-emerald-500 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🏋️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-emerald-500 transition-colors">The Gym</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Daily Spaced Repetition Review. Strengthen your long-term memory. 
            Algorithm: Modified SM-2.
          </p>
          <Link 
            href="/review"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all w-full shadow-lg hover:shadow-emerald-500/25"
          >
            Start Review Session
          </Link>
        </div>
      </main>
      
      <footer className="mt-20 text-center text-xs text-gray-400">
        <p>Inquizitive v2.0 • Neuro-Stack Architecture</p>
      </footer>
    </div>
  );
}
