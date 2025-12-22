'use server'

import { createClient } from '@/utils/supabase/server'

export async function getUserStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      heatmap: [],
      streak: 0,
      xp: 0,
      mastered: 0
    }
  }

  // 1. Fetch Heatmap Data (Count reviews per day)
  // We'll use a raw query or simple selection since Supabase generic client doesn't support complex group by easily without RPC.
  // For now, let's fetch last 365 days of reviews and aggregate in JS to avoid migration complexity.
  // A review is counted when 'last_reviewed_at' is updated. 
  // NOTE: This only tracks the *last* review of an item. 
  // Ideally we'd have a 'review_logs' table for a perfect heatmap.
  // For this prototype, we'll use 'created_at' (Items added) + 'last_reviewed_at' (Items reviewed).
  
  const { data: items } = await supabase
    .from('review_items')
    .select('created_at, last_reviewed_at')
    .eq('user_id', user.id)

  const activityMap = new Map<string, number>()

  items?.forEach(item => {
    // Count creations
    if (item.created_at) {
      const date = item.created_at.split('T')[0]
      activityMap.set(date, (activityMap.get(date) || 0) + 1)
    }
    // Count reviews
    if (item.last_reviewed_at) {
      const date = item.last_reviewed_at.split('T')[0]
      activityMap.set(date, (activityMap.get(date) || 0) + 1)
    }
  })

  const heatmap = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }))

  // 2. Fetch Stats
  // Check if we have learning_stats table, otherwise calc from items
  const { data: stats } = await supabase
    .from('learning_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Calculate mastered items (Level > 4)
  const { count: masteredCount } = await supabase
    .from('review_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('srs_level', 4)

  return {
    heatmap,
    streak: stats?.current_streak || 0,
    xp: stats?.total_xp || 0,
    mastered: masteredCount || 0
  }
}
