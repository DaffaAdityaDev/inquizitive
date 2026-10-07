import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  color = 'primary',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  // For destructive actions a stray Enter must land on the safe choice
  const isDanger = color === 'danger'
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      size="sm"
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody className="py-6">
          <div className="text-sm text-default-500 leading-relaxed">{message}</div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onCancel} autoFocus={isDanger}>
            {cancelLabel}
          </Button>
          <Button color={color} onPress={onConfirm} autoFocus={!isDanger}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ConfirmDialog
