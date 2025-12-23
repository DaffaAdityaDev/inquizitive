'use server'

import { createClient } from '@/utils/supabase/server'
import { Question } from '@/types'
import { Json } from '@/types/database'

export async function saveMistake(topic: string, question: Question, tags: string[] = [], subject: string = 'General') {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Insert into review_items
  const { error } = await supabase.from('review_items').insert({
    user_id: user.id,
    subject,
    topic,
    question_json: question as unknown as Json,
    srs_level: 0, // New
    ease_factor: 2.5,
    interval_days: 1, // Review tomorrow (or immediately if you prefer)
    next_review_at: new Date().toISOString(), // Immediate review? Or tomorrow? Algorithm says 0/New. 
    // Usually new items are reviewed immediately or next day. Let's say immediate for "Gym" queue.
    tags
  })

  if (error) {
    console.error('Error saving mistake:', error)
    throw new Error('Failed to save mistake')
  }

  // Update stats - add XP for learning from mistakes
  const today = new Date().toISOString().split('T')[0]
  const { data: currentStats } = await supabase
    .from('learning_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (currentStats) {
    const lastActivity = currentStats.last_activity_date
    const daysSinceLastActivity = lastActivity 
      ? Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    const newStreak = daysSinceLastActivity <= 1 
      ? currentStats.current_streak + (lastActivity !== today ? 1 : 0)
      : 1

    await supabase
      .from('learning_stats')
      .update({
        total_xp: currentStats.total_xp + 5, // 5 XP for adding to vault
        current_streak: newStreak,
        last_activity_date: today
      })
      .eq('user_id', user.id)
  } else {
    await supabase
      .from('learning_stats')
      .insert({
        user_id: user.id,
        total_xp: 5,
        current_streak: 1,
        last_activity_date: today,
        items_mastered: 0
      })
  }
  
  return { success: true }
}
