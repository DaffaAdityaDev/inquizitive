function ErrorDisplay({ error }: { error: string }) {
  return (
    <div>
      <p className="text-sm text-red-500">{error}</p>
    </div>
  )
}

export default ErrorDisplay
