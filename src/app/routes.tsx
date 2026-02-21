import { QuizPage } from '../features/quiz'
import { Navbar } from '../shared/components/Navbar'
import { ErrorBoundary } from '../shared/components/ErrorBoundary'

export function AppRoutes() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mt-5">
        <ErrorBoundary>
          <QuizPage />
        </ErrorBoundary>
      </main>
    </div>
  )
}
