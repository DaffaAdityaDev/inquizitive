'use server'

import { createClient } from '@/utils/supabase/server'
import { ReviewItem } from '@/types'

export async function getAllReviews(search: string = '', subject: string = 'General') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  let query = supabase
    .from('review_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject', subject)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('topic', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching library:', error)
    return []
  }

  return data as ReviewItem[]
}

export async function deleteReviewItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Delete the item (RLS ensures user can only delete their own items)
  const { error } = await supabase
    .from('review_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id) // Extra safety check

  if (error) {
    console.error('Error deleting item:', error)
    throw new Error('Failed to delete item')
  }

  return { success: true }
}
