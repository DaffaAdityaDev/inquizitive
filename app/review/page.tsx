import { getDueReviews } from './actions'
import ReviewSession from '@/components/ReviewSession'

export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

export default async function ReviewPage() {
  const cookieStore = await cookies()
  const subject = cookieStore.get('subject')?.value || 'General'
  const reviews = await getDueReviews(subject)

  return (
    <div className="flex flex-col items-center pt-8">
      <h1 className="text-3xl font-bold mb-8">The Gym 🏋️</h1>
      <ReviewSession initialReviews={reviews} />
    </div>
  )
}
