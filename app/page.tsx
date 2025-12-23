import Link from "next/link";
import Heatmap from "@/components/Heatmap";
import Tutorial from "@/components/Tutorial";
import { getUserStats } from "./actions";
import { HeroHighlight } from "@/components/ui/hero-highlight";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Flame, Dumbbell, Trophy, ArrowRight, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stats = await getUserStats();

  return (
    <div className="min-h-screen bg-background font-sans overflow-hidden">
      
      {/* Hero Section */}
      <HeroHighlight>
        <div className="text-center px-4 max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Master Technical Concepts <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              With Neuro-Stack
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            The advanced spaced-repetition platform for engineers. 
            Transform raw information into permanent knowledge through the loop of mastery.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/quiz" className="px-8 py-3 rounded-full bg-neon-blue text-black font-bold hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(14,215,181,0.5)]">
               Start Forging
            </Link>
            <Link href="/review" className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition backdrop-blur-md">
               Daily Review
            </Link>
          </div>
        </div>
      </HeroHighlight>

      {/* Stats Bento Grid */}
      <section className="relative z-20 -mt-32 px-4 pb-20">
        <BentoGrid className="max-w-6xl">
            
          {/* Main Stat: Streak */}
          <BentoGridItem
            title="Consistency Streak"
            description="Keep the fire alive. Daily reviews compound into mastery."
            className="md:col-span-1 border-l-4 border-l-neon-blue"
            icon={<Zap className="h-6 w-6 text-neon-blue" />}
            header={
              <div className="flex items-center justify-center h-full min-h-24 bg-gradient-to-br from-blue-900/20 to-transparent rounded-xl">
                 <span className="text-6xl font-black text-white">{stats.streak}</span>
                 <span className="ml-2 text-sm text-gray-500 uppercase tracking-widest rotate-90 origin-left">Days</span>
              </div>
            }
          />

          {/* Action: The Forge */}
          <BentoGridItem
            title="The Forge"
            description="Input new knowledge. Paste AI-generated JSON quizzes here. Mistakes will be automatically captured."
            className="md:col-span-1 group cursor-pointer hover:border-orange-500/50"
            icon={<Flame className="h-6 w-6 text-orange-500" />}
            header={
                 <Link href="/quiz" className="flex items-center justify-center h-full min-h-24 border-2 border-dashed border-white/10 rounded-xl hover:border-orange-500/50 transition-colors group-hover:bg-orange-500/5">
                    <div className="flex items-center gap-2 text-orange-500 font-bold">
                        ENTER FORGE <ArrowRight className="w-4 h-4" />
                    </div>
                 </Link>
            }
          />

          {/* Action: The Gym */}
          <BentoGridItem
            title="The Gym"
            description="Daily Spaced Repetition Review. Strengthen your long-term memory."
            className="md:col-span-1 group cursor-pointer hover:border-emerald-500/50"
            icon={<Dumbbell className="h-6 w-6 text-emerald-500" />}
            header={
                 <Link href="/review" className="flex items-center justify-center h-full min-h-24 border-2 border-dashed border-white/10 rounded-xl hover:border-emerald-500/50 transition-colors group-hover:bg-emerald-500/5">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold">
                        ENTER GYM <ArrowRight className="w-4 h-4" />
                    </div>
                 </Link>
            }
          />

          {/* Large Item: Heatmap */}
          <BentoGridItem
            title="Activity Heatmap"
            description="Visualise your cognitive load over time. Every green square is a neuron connection strengthened."
            className="md:col-span-2 min-h-[300px]"
            icon={<Target className="h-6 w-6 text-neon-purple" />}
            header={
               // Remove inner container styled box, let it breathe
               <div className="flex items-end h-full pb-4">
                 <Heatmap activityData={stats.heatmap} />
               </div>
            }
          />

           {/* Stats Summary */}
           <BentoGridItem
            title="Total Mastery"
            description="Items completely internalized."
            className="md:col-span-1 bg-gradient-to-br from-neon-purple/10 to-transparent"
            icon={<Trophy className="h-6 w-6 text-yellow-500" />}
            header={
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-gray-400 text-xs uppercase">Total XP</span>
                        <span className="text-xl font-bold font-mono">{stats.xp}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-gray-400 text-xs uppercase">Mastered</span>
                        <span className="text-xl font-bold font-mono text-emerald-400">{stats.mastered}</span>
                    </div>
                </div>
            }
          />

        </BentoGrid>
      </section>

      {/* Tutorial Overlay (Kept but discreet) */}
      <div className="fixed bottom-4 right-4 z-50">
        <Tutorial />
      </div>

    </div>
  );
}
