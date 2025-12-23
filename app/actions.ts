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

  // Sort dates ensure consistency
  const heatmap = Array.from(activityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // 2. Fetch Stats
  const { data: stats } = await supabase
    .from('learning_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Calculate mastered items (Level >= 4)
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

export async function createWorkspace(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('workspaces')
    .insert({ user_id: user.id, name })
    .select()

  // Ignore duplicates (409) or return error
  if (error && error.code !== '23505') { 
    console.error('Error creating workspace:', error)
    throw new Error('Failed to create workspace')
  }

  return { success: true }
}

export async function deleteWorkspace(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  if (name === 'General') throw new Error('Cannot delete default workspace')

  // 1. Delete from workspaces table
  const { error: wsError } = await supabase
    .from('workspaces')
    .delete()
    .eq('user_id', user.id)
    .eq('name', name)

  if (wsError) {
    console.error('Error deleting workspace:', wsError)
    throw new Error('Failed to delete workspace')
  }

  // 2. (Optional) We could delete items OR move them to General. 
  // For safety, let's move them to 'General' so data isn't lost.
  await supabase
    .from('review_items')
    .update({ subject: 'General' })
    .eq('user_id', user.id)
    .eq('subject', name)

  return { success: true }
}

export async function getSubjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return ['General']

  try {
    // 1. Fetch persistent workspaces
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('name')
      .eq('user_id', user.id)

    // Handle case where table might not exist yet (graceful fallback)
    if (wsError && wsError.code === '42P01') { 
       throw wsError; // Fallback to old method
    }

    // 2. Fetch used subjects (in case some items have subjects not in workspaces table)
    const { data: items } = await supabase
      .from('review_items')
      .select('subject')
      .eq('user_id', user.id)

    const workspaceNames = workspaces?.map(w => w.name) || []
    const itemSubjects = items?.map(i => i.subject) || []

    // Combine and Unify
    const uniqueSubjects = Array.from(new Set(['General', ...workspaceNames, ...itemSubjects]))
    return uniqueSubjects.sort()

  } catch {
    // Fallback if workspaces table doesn't exist yet
    // Get distinct subjects from items only
    const { data, error } = await supabase
      .from('review_items')
      .select('subject')
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error fetching subjects:', error)
      return ['General']
    }

    return Array.from(new Set(['General', ...data?.map(item => item.subject) || []])).sort()
  }
}
