import { QuizPage } from '../features/quiz'
import { Navbar } from '../shared/components/Navbar'
import { ErrorBoundary } from '../shared/components/ErrorBoundary'

export function AppRoutes() {
  return (
    <div className="min-h-screen text-foreground bg-background transition-colors duration-200">
      <Navbar />
      <main className="mt-5 pb-12">
        <ErrorBoundary>
          <QuizPage />
        </ErrorBoundary>
      </main>
    </div>
  )
}
