'use client'

interface HeatmapProps {
  activityData?: { date: string; count: number }[]
}

export default function Heatmap({ activityData = [] }: HeatmapProps) {
  // Generate days aligned to weeks (start on Sunday)
  const today = new Date()
  const endDate = today
  
  // Calculate start date: 52 weeks ago, aligned to Sunday
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 364) // roughly a year
  
  // Adjust to previous Sunday
  const dayOfWeek = startDate.getDay() // 0 = Sunday
  startDate.setDate(startDate.getDate() - dayOfWeek)

  const days = []
  const current = new Date(startDate)
  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  // Mock data map
  const dataMap = new Map(activityData.map(item => [item.date, item.count]))

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
        {/* Simple visualization: 7 rows (days of week) x 52 cols (weeks) roughly */}
        {/* For simplicity in this iteration, just a straight flex row of blocks */}
        <div className="grid grid-rows-7 grid-flow-col gap-1">
          {days.map(date => {
            const count = dataMap.get(date) || 0
            let colorClass = 'bg-gray-200 dark:bg-gray-800'
            
            if (count > 0) colorClass = 'bg-emerald-200 dark:bg-emerald-900/40'
            if (count > 2) colorClass = 'bg-emerald-400 dark:bg-emerald-700'
            if (count > 5) colorClass = 'bg-emerald-600 dark:bg-emerald-500'

            return (
              <div 
                key={date} 
                className={`w-3 h-3 rounded-sm ${colorClass}`} 
                title={`${date}: ${count} activities`} 
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
