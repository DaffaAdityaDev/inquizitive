'use client'

import { useState, useRef } from 'react'
import { exportUserData, importUserData, InquizitiveBackup } from '@/app/profile/actions'
import { toast } from 'sonner'
import { Download, Upload, AlertTriangle } from 'lucide-react'

export default function BackupSection() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<InquizitiveBackup | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const backup = await exportUserData()

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inquizitive-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${backup.data.review_items.length} items successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export backup')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const backup = JSON.parse(text) as InquizitiveBackup

      // Validate basic structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format')
      }

      setPendingBackup(backup)
      setShowConfirm(true)
    } catch (error) {
      console.error('File read error:', error)
      toast.error('Invalid backup file')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle confirmed import
  const handleImport = async () => {
    if (!pendingBackup) return

    setIsImporting(true)
    setShowConfirm(false)

    try {
      const result = await importUserData(pendingBackup, importMode)

      toast.success(
        `Synced: ${result.imported.items} new, ${result.imported.updated} updated, ${result.imported.workspaces} workspaces` +
        (result.imported.stats ? ', stats restored' : '')
      )

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import backup')
    } finally {
      setIsImporting(false)
      setPendingBackup(null)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data Backup</h3>

      <div className="flex gap-3">
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export Backup'}
        </button>

        {/* Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : 'Import Backup'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Confirmation Modal */}
      {showConfirm && pendingBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-lg font-bold">Confirm Import</h4>
            </div>

            <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
              <p>Backup from: <strong>{new Date(pendingBackup.exportedAt).toLocaleString()}</strong></p>
              <p>Items: <strong>{pendingBackup.data.review_items.length}</strong></p>
              <p>Workspaces: <strong>{pendingBackup.data.workspaces.length}</strong></p>
              <p>Stats: <strong>{pendingBackup.data.learning_stats ? 'Yes' : 'No'}</strong></p>
            </div>

            {/* Import Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Import Mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${importMode === 'merge'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  Merge
                </button>
                <button
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${importMode === 'replace'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  Replace All
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {importMode === 'merge'
                  ? 'Add backup data to existing data'
                  : '⚠️ Delete all existing data and replace with backup'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPendingBackup(null) }}
                className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className={`flex-1 py-2 rounded-lg font-medium text-white ${importMode === 'replace' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Import Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
