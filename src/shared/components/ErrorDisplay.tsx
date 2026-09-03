import { ExclamationTriangleIcon } from "@heroicons/react/24/solid"

interface ErrorDisplayProps {
  error: string
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800/60 text-danger-800 dark:text-danger-200 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
      <ExclamationTriangleIcon className="w-5 h-5 text-danger-500 flex-shrink-0" />
      <p className="text-sm font-semibold leading-snug">{error}</p>
    </div>
  )
}

export default ErrorDisplay
