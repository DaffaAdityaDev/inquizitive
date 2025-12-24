'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewItem } from '@/types'

// Backup data structure
export interface InquizitiveBackup {
  version: "1.0"
  exportedAt: string
  user: {
    id: string
    email: string
  }
  data: {
    review_items: ReviewItem[]
    learning_stats: {
      total_xp: number
      current_streak: number
      last_activity_date: string
      items_mastered: number
    } | null
    workspaces: { name: string }[]
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login?message=You have been signed out')
}

/**
 * Export all user data as JSON backup
 */
export async function exportUserData(): Promise<InquizitiveBackup> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // 1. Fetch all review items
  const { data: reviewItems, error: itemsError } = await supabase
    .from('review_items')
    .select('*')
    .eq('user_id', user.id)

  if (itemsError) {
    console.error('Error fetching review items:', itemsError)
    throw new Error('Failed to export review items')
  }

  // 2. Fetch learning stats
  const { data: stats, error: statsError } = await supabase
    .from('learning_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching stats:', statsError)
  }

  // 3. Fetch workspaces
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('name')
    .eq('user_id', user.id)

  if (wsError && wsError.code !== '42P01') { // 42P01 = table doesn't exist
    console.error('Error fetching workspaces:', wsError)
  }

  // Build backup object
  const backup: InquizitiveBackup = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email || ''
    },
    data: {
      review_items: (reviewItems || []) as ReviewItem[],
      learning_stats: stats ? {
        total_xp: stats.total_xp,
        current_streak: stats.current_streak,
        last_activity_date: stats.last_activity_date,
        items_mastered: stats.items_mastered
      } : null,
      workspaces: workspaces || []
    }
  }

  return backup
}

/**
 * Import user data from JSON backup with smart sync
 * @param backup - The backup data to import
 * @param mode - 'merge' syncs with existing data, 'replace' clears all first
 */
export async function importUserData(
  backup: InquizitiveBackup,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; imported: { items: number; updated: number; stats: boolean; workspaces: number } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Validate backup version
  if (backup.version !== "1.0") {
    throw new Error('Unsupported backup version')
  }

  let importedItems = 0
  let updatedItems = 0
  let importedStats = false
  let importedWorkspaces = 0

  // If replace mode, delete existing data first
  if (mode === 'replace') {
    await supabase.from('review_items').delete().eq('user_id', user.id)
    await supabase.from('learning_stats').delete().eq('user_id', user.id)
    await supabase.from('workspaces').delete().eq('user_id', user.id)
  }

  // 1. Sync review items (smart merge)
  if (backup.data.review_items && backup.data.review_items.length > 0) {
    // Get existing items for comparison
    const { data: existingItems } = await supabase
      .from('review_items')
      .select('id, topic, question_json')
      .eq('user_id', user.id)

    // Create a map of existing items by topic+question text for matching
    const existingMap = new Map<string, string>()
    existingItems?.forEach(item => {
      const q = typeof item.question_json === 'object' && item.question_json !== null
        ? (item.question_json as { q?: string }).q
        : ''
      const key = `${item.topic}::${q}`
      existingMap.set(key, item.id)
    })

    for (const item of backup.data.review_items) {
      const questionText = item.question_json?.q || ''
      const matchKey = `${item.topic}::${questionText}`
      const existingId = existingMap.get(matchKey)

      const itemData = {
        user_id: user.id,
        subject: item.subject || 'General',
        topic: item.topic,
        question_json: item.question_json,
        srs_level: item.srs_level,
        ease_factor: item.ease_factor,
        interval_days: item.interval_days,
        last_reviewed_at: item.last_reviewed_at,
        next_review_at: item.next_review_at,
        tags: item.tags || []
      }

      if (existingId && mode === 'merge') {
        // Update existing item (sync)
        const { error } = await supabase
          .from('review_items')
          .update(itemData)
          .eq('id', existingId)

        if (!error) updatedItems++
      } else {
        // Insert new item
        const { error } = await supabase
          .from('review_items')
          .insert({ ...itemData, created_at: item.created_at })

        if (!error) importedItems++
      }
    }
  }

  // 2. Sync learning stats (upsert)
  if (backup.data.learning_stats) {
    const statsToUpsert = {
      user_id: user.id,
      total_xp: backup.data.learning_stats.total_xp,
      current_streak: backup.data.learning_stats.current_streak,
      last_activity_date: backup.data.learning_stats.last_activity_date,
      items_mastered: backup.data.learning_stats.items_mastered
    }

    const { error: statsError } = await supabase
      .from('learning_stats')
      .upsert(statsToUpsert, { onConflict: 'user_id' })

    if (!statsError) importedStats = true
  }

  // 3. Sync workspaces (ignore duplicates)
  if (backup.data.workspaces && backup.data.workspaces.length > 0) {
    for (const workspace of backup.data.workspaces) {
      const { error } = await supabase
        .from('workspaces')
        .insert({ user_id: user.id, name: workspace.name })

      // Ignore duplicate errors (23505)
      if (!error) importedWorkspaces++
    }
  }

  return {
    success: true,
    imported: {
      items: importedItems,
      updated: updatedItems,
      stats: importedStats,
      workspaces: importedWorkspaces
    }
  }
}
