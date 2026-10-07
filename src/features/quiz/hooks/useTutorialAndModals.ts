import { useState } from 'react'
import { useDisclosure } from '@nextui-org/react'

/** UI-only state for the "How it works" tutorial and the topic entry modal. */
export function useTutorialAndModals() {
  const tutorial = useDisclosure()
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [topicInput, setTopicInput] = useState('')

  const openTopicModal = () => setIsTopicModalOpen(true)

  const closeTopicModal = () => {
    setTopicInput('')
    setIsTopicModalOpen(false)
  }

  return {
    isTutorialOpen: tutorial.isOpen,
    openTutorial: tutorial.onOpen,
    onTutorialOpenChange: tutorial.onOpenChange,
    isTopicModalOpen,
    topicInput,
    setTopicInput,
    openTopicModal,
    closeTopicModal
  }
}
