import { getDueReviews } from './actions'
import ReviewSession from '@/components/ReviewSession'

export const dynamic = 'force-dynamic'

export default async function ReviewPage() {
  const reviews = await getDueReviews()

  return (
    <div className="flex flex-col items-center pt-8">
      <h1 className="text-3xl font-bold mb-8">The Gym 🏋️</h1>
      <ReviewSession initialReviews={reviews} />
    </div>
  )
}
