import { AnimatePresence } from 'framer-motion'
import { useQuizSession } from '../hooks/useQuizSession'
import { HomeView } from './views/HomeView'
import { QuizView } from './views/QuizView'
import { ResultsView } from './views/ResultsView'
import { TutorialModal } from './TutorialModal'
import { TopicModal } from './TopicModal'

export function QuizPage() {
  const session = useQuizSession()

  return (
    <div className="w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {session.view === 'home' && <HomeView key="home-view" session={session} />}
        {session.view === 'quiz' && <QuizView key="quiz-view" session={session} />}
        {session.view === 'completed' && <ResultsView key="completed-view" session={session} />}
      </AnimatePresence>

      <TutorialModal isOpen={session.isTutorialOpen} onOpenChange={session.onTutorialOpenChange} />

      <TopicModal
        isOpen={session.isTopicModalOpen}
        topic={session.topicInput}
        onTopicChange={session.setTopicInput}
        onSubmit={session.handleTopicSubmit}
        onClose={session.closeTopicModal}
      />
    </div>
  )
}
