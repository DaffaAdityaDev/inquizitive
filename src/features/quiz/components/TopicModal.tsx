import type { Key } from 'react'
import { isImeComposing } from '../../../shared/utils/keyboard'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea
} from '@nextui-org/react'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import {
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  PromptDifficulty,
  PromptLanguage,
  PromptQuestionType,
  QUESTION_COUNTS,
  QUESTION_TYPE_LABELS,
  usePromptOptions
} from '../../prompts'

interface TopicModalProps {
  isOpen: boolean
  topic: string
  onTopicChange: (topic: string) => void
  onSubmit: () => void
  onClose: () => void
}

const segmentedClassNames = {
  base: 'w-full',
  tabList: 'w-full bg-default-100 border border-default-200',
  cursor: 'bg-background shadow-sm'
}

function OptionLabel({ children }: { children: string }) {
  return <span className="text-xs font-semibold uppercase tracking-wide text-default-500">{children}</span>
}

export function TopicModal({ isOpen, topic, onTopicChange, onSubmit, onClose }: TopicModalProps) {
  const { options, updateOptions } = usePromptOptions()

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader>Generate your quiz prompt</ModalHeader>
        <ModalBody className="py-6 gap-5">
          <Input
            autoFocus
            label="Topic"
            placeholder="e.g. Python AsyncIO, Medieval History"
            value={topic}
            onValueChange={onTopicChange}
            variant="bordered"
            onKeyDown={(e) => e.key === 'Enter' && !isImeComposing(e) && onSubmit()}
          />

          <div className="space-y-2">
            <OptionLabel>Question type</OptionLabel>
            <Tabs
              aria-label="Question type"
              radius="full"
              selectedKey={options.questionType}
              onSelectionChange={(k: Key) => updateOptions({ questionType: k as PromptQuestionType })}
              classNames={segmentedClassNames}
            >
              {(Object.keys(QUESTION_TYPE_LABELS) as PromptQuestionType[]).map(type => (
                <Tab key={type} title={QUESTION_TYPE_LABELS[type]} />
              ))}
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <OptionLabel>Number of questions</OptionLabel>
              <Tabs
                aria-label="Number of questions"
                radius="full"
                selectedKey={String(options.count)}
                onSelectionChange={(k: Key) => updateOptions({ count: Number(k) })}
                classNames={segmentedClassNames}
              >
                {QUESTION_COUNTS.map(count => (
                  <Tab key={String(count)} title={count} />
                ))}
              </Tabs>
            </div>

            <div className="space-y-2">
              <OptionLabel>Difficulty</OptionLabel>
              <Tabs
                aria-label="Difficulty"
                radius="full"
                selectedKey={options.difficulty}
                onSelectionChange={(k: Key) => updateOptions({ difficulty: k as PromptDifficulty })}
                classNames={segmentedClassNames}
              >
                {(Object.keys(DIFFICULTY_LABELS) as PromptDifficulty[]).map(level => (
                  <Tab key={level} title={DIFFICULTY_LABELS[level]} />
                ))}
              </Tabs>
            </div>
          </div>

          <Select
            label="Language"
            variant="bordered"
            selectedKeys={[options.language]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const [key] = Array.from(keys)
              if (key) updateOptions({ language: key as PromptLanguage })
            }}
          >
            {(Object.keys(LANGUAGE_LABELS) as PromptLanguage[]).map(lang => (
              <SelectItem key={lang}>{LANGUAGE_LABELS[lang]}</SelectItem>
            ))}
          </Select>

          <Textarea
            label="Source material (optional)"
            placeholder="Paste notes, documentation or an article. Questions will be based only on this material."
            variant="bordered"
            minRows={3}
            maxRows={8}
            value={options.sourceMaterial}
            onValueChange={(value) => updateOptions({ sourceMaterial: value })}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={onSubmit}
            startContent={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
          >
            Copy Prompt
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
