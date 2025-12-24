'use server'

import { createClient } from '@/utils/supabase/server'
import { calculateSRS } from '@/utils/srsAlgorithm'
import { ReviewItem } from '@/types'

export async function getDueReviews(subject: string = 'General') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Fetch items where next_review_at <= NOW
  const { data, error } = await supabase
    .from('review_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject', subject)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(20) // Limit to avoid overwhelming

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  return data as ReviewItem[]
}

export async function submitReview(itemId: string, grade: number) {
  const supabase = await createClient()

  // Validate grade
  if (grade < 0 || grade > 5) {
    throw new Error('Invalid grade: must be 0-5')
  }

  // 1. Get current item state
  const { data: item, error: fetchError } = await supabase
    .from('review_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (fetchError || !item) throw new Error('Item not found')

  // 2. Calculate new SRS params
  const currentSRS = {
    interval: item.interval_days,
    repetition: item.srs_level, // using srs_level as repetition count
    easeFactor: item.ease_factor
  }

  const result = calculateSRS(currentSRS, grade)

  // 3. Calculate next date
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + result.interval)

  // 4. Update review_items
  const { error } = await supabase
    .from('review_items')
    .update({
      srs_level: result.repetition,
      ease_factor: result.easeFactor,
      interval_days: result.interval,
      last_reviewed_at: new Date().toISOString(),
      next_review_at: nextDate.toISOString()
    })
    .eq('id', itemId)

  if (error) throw new Error('Failed to update review')

  // 5. Update Stats (XP, Streak) - Gamification
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // Calculate XP based on grade (higher grade = more XP)
    const xpReward = grade >= 4 ? 15 : grade === 3 ? 10 : 5

    // Get current stats
    const { data: currentStats } = await supabase
      .from('learning_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const today = new Date().toISOString().split('T')[0]

    if (currentStats) {
      // Check if streak continues (activity within last 2 days)
      const lastActivity = currentStats.last_activity_date
      const daysSinceLastActivity = lastActivity
        ? Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const newStreak = daysSinceLastActivity <= 1
        ? currentStats.current_streak + (lastActivity !== today ? 1 : 0)
        : 1

      // Count mastered items (level 4+)
      const { count: masteredCount } = await supabase
        .from('review_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('srs_level', 4)

      await supabase
        .from('learning_stats')
        .update({
          total_xp: currentStats.total_xp + xpReward,
          current_streak: newStreak,
          last_activity_date: today,
          items_mastered: masteredCount || 0
        })
        .eq('user_id', user.id)
    } else {
      // Create new stats record
      await supabase
        .from('learning_stats')
        .insert({
          user_id: user.id,
          total_xp: xpReward,
          current_streak: 1,
          last_activity_date: today,
          items_mastered: 0
        })
    }
  }

  return { success: true, nextReview: nextDate }
}
