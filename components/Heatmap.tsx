'use client'

import { cn } from "@/lib/utils"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" 
// Reverting to basic titles for speed/simplicity if Tooltip component isn't ready, 
// but assuming standard browser title attribute works for now.

interface HeatmapProps {
  activityData?: { date: string; count: number }[]
}

export default function Heatmap({ activityData = [] }: HeatmapProps) {
  // Generate days aligned to weeks (start on Sunday)
  const today = new Date()
  const endDate = today
  
  // Calculate start date: 26 weeks (~6 months) to fit better without excessive scrolling
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (26 * 7)) 
  
  // Adjust to previous Sunday
  const dayOfWeek = startDate.getDay() // 0 = Sunday
  startDate.setDate(startDate.getDate() - dayOfWeek)

  const days = []
  const current = new Date(startDate)
  // Ensure we don't go past end date too far, but fill weeks
  while (current <= endDate || current.getDay() !== 0) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
    if (current > endDate && current.getDay() === 0) break;
  }

  // Mock data map
  const dataMap = new Map(activityData.map(item => [item.date, item.count]))

  // Helper for color intensity
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-white/5 group-hover:bg-white/10'
    if (count <= 2) return 'bg-neon-emerald/30 shadow-[0_0_5px_rgba(16,185,129,0.2)]'
    if (count <= 5) return 'bg-neon-emerald/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
    return 'bg-neon-emerald shadow-[0_0_10px_rgba(16,185,129,0.6)]'
  }

  return (
    <div className="w-full flex flex-col gap-3 group">
      <div className="w-full overflow-x-auto pb-1 scrollbar-hide relative">
        <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
          {/* We display grid flow col: 7 rows fixed */}
          <div className="grid grid-rows-7 grid-flow-col gap-1.5">
            {days.map((date, i) => {
              const count = dataMap.get(date) || 0
              return (
                <div 
                  key={date} 
                  className={cn(
                    "w-3 h-3 rounded-sm transition-all duration-300",
                    getIntensityClass(count)
                  )}
                  title={`${date}: ${count} activities`} 
                />
              )
            })}
          </div>
        </div>
        
        {/* Fade overlay on right to hint scroll if needed */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-black/20 to-transparent pointer-events-none md:hidden" />
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-widest">
        <span>Last 6 Months</span>
        <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-sm bg-white/5" />
                <div className="w-2 h-2 rounded-sm bg-neon-emerald/30" />
                <div className="w-2 h-2 rounded-sm bg-neon-emerald/60" />
                <div className="w-2 h-2 rounded-sm bg-neon-emerald" />
            </div>
            <span>More</span>
        </div>
      </div>
    </div>
  )
}
