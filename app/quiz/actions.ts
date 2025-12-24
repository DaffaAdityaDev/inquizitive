'use server'

import { createClient } from '@/utils/supabase/server'
import { Question } from '@/types'
import { Json } from '@/types/database'

export async function saveMistake(topic: string, question: Question, tags: string[] = [], subject: string = 'General') {
  const supabase = await createClient()

  // Validate inputs
  if (!topic?.trim()) {
    throw new Error('Topic is required')
  }
  if (!question || !question.q) {
    throw new Error('Invalid question format')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if item already exists to prevent duplicates
  const questionText = question.q.trim()

  // We need to fetch potential matches first because JSON containment/equality 
  // in Supabase can be tricky with exact whitespace/formatting.
  // We'll filter in code to be safe, or use a specific query if possible.
  // For now, let's fetch items for this topic to check duplicates.
  const { data: existingItems } = await supabase
    .from('review_items')
    .select('id, question_json')
    .eq('user_id', user.id)
    .eq('topic', topic) // Optimization: only check within same topic

  const existingItem = existingItems?.find(item => {
    const q = item.question_json as Question
    return q?.q?.trim() === questionText
  })

  const nowISO = new Date().toISOString()

  if (existingItem) {
    // Update existing item (Reset SRS)
    const { error } = await supabase
      .from('review_items')
      .update({
        subject, // Update subject if changed
        srs_level: 0, // Reset to "Again"
        ease_factor: 2.5, // Reset ease? Or keep it? Usually failure resets ease slightly or strictly. Let's strict reset for new "Forge" entry behavior.
        interval_days: 1,
        next_review_at: nowISO,
        last_reviewed_at: nowISO,
        tags: [...new Set([...(tags || []), ...((existingItem as any).tags || [])])] // Merge tags
      })
      .eq('id', existingItem.id)

    if (error) {
      console.error('Error updating existing mistake:', error)
      throw new Error('Failed to update mistake')
    }
  } else {
    // Insert new item
    const { error } = await supabase.from('review_items').insert({
      user_id: user.id,
      subject,
      topic,
      question_json: question as unknown as Json,
      srs_level: 0,
      ease_factor: 2.5,
      interval_days: 1,
      next_review_at: nowISO,
      tags
    })

    if (error) {
      console.error('Error saving mistake:', error)
      throw new Error('Failed to save mistake')
    }
  }

  // Update stats - add XP for learning from mistakes (only if not already updated today/recently for this action? 
  // For now, simplify: always give XP for "Forging" even if repeated, motivates practice.)
  // Actually, let's keep the exact same stats logic as before.

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

export async function saveQuizHistory(topic: string, tags: string, jsonContent: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('quiz_history')
    .insert({
      user_id: user.id,
      topic,
      tags,
      question_json: jsonContent
    })

  if (error) {
    console.error('Error saving history:', error)
    // Don't throw, just log. History is secondary.
  }
}

export async function getQuizHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('quiz_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!data) return []

  return data.map(item => ({
    id: item.id,
    timestamp: new Date(item.created_at).getTime(),
    topic: item.topic,
    tags: item.tags,
    json: JSON.stringify(item.question_json) // Helper expects string for copy/paste
  }))
}
