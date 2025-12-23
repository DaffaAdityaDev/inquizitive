'use client'

import { useState, useEffect } from 'react'
import { getAllReviews, deleteReviewItem } from './actions'
import { ReviewItem } from '@/types'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Search, Trash2, ChevronDown, BookOpen, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useSubject } from '@/contexts/SubjectContext'

export default function LibraryPage() {
  const { subject } = useSubject()
  const [items, setItems] = useState<ReviewItem[]>([])
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    getAllReviews('', subject).then(setItems)
  }, [subject])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const results = await getAllReviews(search, subject)
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
    <div className="p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
               The Library <span className="text-2xl opacity-50">📚</span>
            </h1>
            <p className="text-gray-400 font-mono text-sm ml-1">{items.length} items stored in your neural vault</p>
          </div>
        </header>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative group">
           <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
           <input 
             type="text" 
             placeholder="Search topics, questions, or tags..." 
             className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all font-medium text-lg glass"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </form>

        {/* List */}
        <div className="grid gap-4">
          {items.map(item => (
            <div 
                key={item.id} 
                className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden",
                    expandedId === item.id 
                        ? "glass border-neon-blue/30 ring-1 ring-neon-blue/20 bg-white/5" 
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer"
                )}
            >
              <div 
                className="p-6 flex justify-between items-start gap-4"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex-1 space-y-3">
                   <div className="flex gap-2 flex-wrap items-center">
                     <span className="px-2.5 py-0.5 bg-white/10 border border-white/5 text-xs rounded-full font-bold text-gray-300 uppercase tracking-wider">{item.topic}</span>
                     
                     <span className={cn(
                        "px-2.5 py-0.5 text-xs rounded-full font-bold border",
                        item.srs_level > 3 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                     )}>
                       {item.srs_level > 3 ? '✓ Mastered' : `Lv. ${item.srs_level}`}
                     </span>

                     {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map(tag => (
                       <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-full">
                         <Tag className="w-3 h-3" /> {tag}
                       </span>
                     ))}
                   </div>
                   
                   <h3 className={cn("font-medium text-lg leading-relaxed transition-colors", expandedId === item.id ? "text-white" : "text-gray-300")}>
                        {item.question_json.q}
                   </h3>
                </div>

                <div className="flex items-center gap-3 self-start mt-1">
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
                    title="Delete item"
                  >
                    {deletingId === item.id ? (
                      <span className="text-xs animate-pulse">...</span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className={cn("text-gray-500 transition-transform duration-300", expandedId === item.id && "rotate-180")}>
                     <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <div 
                className={cn(
                    "grid transition-all duration-300 ease-in-out border-t border-white/5 bg-black/20",
                    expandedId === item.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                  <div className="overflow-hidden">
                    <div className="p-6 prose prose-invert max-w-none text-base">
                        <div className="mb-4">
                            <h4 className="flex items-center gap-2 text-sm uppercase tracking-widest text-gray-500 font-bold mb-2">
                                <BookOpen className="w-4 h-4" /> Full Question
                            </h4>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-gray-200">
                                <ReactMarkdown>{item.question_json.q}</ReactMarkdown>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <h4 className="text-sm uppercase tracking-widest text-emerald-500 font-bold mb-2">Answer & Explanation</h4>
                            <div className="bg-emerald-950/20 p-5 rounded-xl border border-emerald-500/10 text-emerald-100">
                                <div className="font-bold text-lg mb-2 text-emerald-400">{item.question_json.answer}</div>
                                <div className="text-gray-300/90 leading-relaxed">
                                    <ReactMarkdown>{item.question_json.explanation}</ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono text-gray-600 mt-6 pt-4 border-t border-white/5">
                            <span>Next Review: {new Date(item.next_review_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span>Added: {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                  </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-20 px-4 glass rounded-3xl border-dashed border-2 border-white/10">
              <div className="inline-block p-6 rounded-full bg-white/5 mb-6 animate-pulse">
                 <span className="text-4xl text-gray-500">📭</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Library Empty</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">Your neural vault is waiting. Go to The Forge to add detailed questions, or use AI generation.</p>
              <a href="/quiz" className="px-8 py-3 bg-neon-blue text-black font-bold rounded-full hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(14,215,181,0.3)]">
                Go to The Forge
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
