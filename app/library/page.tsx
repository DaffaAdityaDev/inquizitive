'use client'

import { useState, useEffect } from 'react'
import { getAllReviews, deleteReviewItem } from './actions'
import { ReviewItem } from '@/types'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

export default function LibraryPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    getAllReviews().then(setItems)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const results = await getAllReviews(search)
    setItems(results)
  }

  const handleDelete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding/collapsing
    
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) {
      return
    }

    setDeletingId(itemId)
    try {
      await deleteReviewItem(itemId)
      setItems(items.filter(item => item.id !== itemId))
      toast.success('Item deleted successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">The Library 📚</h1>
            <p className="text-gray-500 text-sm mt-1">{items.length} items in your vault</p>
          </div>
        </header>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
           <input 
             type="text" 
             placeholder="Search topics..." 
             className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </form>

        {/* List */}
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition">
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex-1">
                   <div className="flex gap-2 mb-2 flex-wrap">
                     <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded font-medium">{item.topic}</span>
                     <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                       item.srs_level > 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                     }`}>
                       {item.srs_level > 3 ? '✓ Mastered' : `Lvl ${item.srs_level}`}
                     </span>
                     {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map(tag => (
                       <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded">
                         {tag}
                       </span>
                     ))}
                   </div>
                   <h3 className="font-semibold line-clamp-2">{item.question_json.q}</h3>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-60 hover:opacity-100"
                    title="Delete item"
                  >
                    {deletingId === item.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                  <span className="text-gray-400 text-sm">
                    {expandedId === item.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 prose dark:prose-invert max-w-none text-sm">
                   <p className="font-bold">Question:</p>
                   <ReactMarkdown>{item.question_json.q}</ReactMarkdown>
                   
                   <p className="font-bold mt-4 text-emerald-500">Answer: {item.question_json.answer}</p>
                   
                   <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded mt-2">
                     <ReactMarkdown>{item.question_json.explanation}</ReactMarkdown>
                   </div>

                   <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                     <span>Next Review: {new Date(item.next_review_at).toLocaleDateString()}</span>
                     <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
              )}
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500">No items found. Go to The Forge to add some!</p>
              <a href="/quiz" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Go to The Forge
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
