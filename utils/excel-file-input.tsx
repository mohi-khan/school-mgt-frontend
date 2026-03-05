'use client'

import { Button } from '@/components/ui/button'
import React from 'react'
import * as XLSX from 'xlsx'

interface ExcelFileInputProps<T> {
  onDataParsed: (data: T[]) => void
  onSubmit: (data: T[]) => Promise<void>
  dateColumns?: string[]
  buttonText?: string
  submitButtonText?: string
  /**
   * If provided, reads this sheet by name instead of SheetNames[0].
   * Falls back to SheetNames[0] if the named sheet is not found.
   */
  sheetName?: string
}

function ExcelFileInput<T extends Record<string, any>>({
  onDataParsed,
  onSubmit,
  dateColumns = [],
  buttonText = 'Choose File',
  submitButtonText = 'Submit Data',
  sheetName,
}: ExcelFileInputProps<T>) {
  const [data, setData] = React.useState<T[] | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  interface FileInputEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & EventTarget
  }

  const convertExcelDate = (serial: number): string => {
    const excelStartDate = new Date(1899, 11, 30)
    const date = new Date(excelStartDate.getTime() + serial * 86400000)
    return date.toISOString().split('T')[0]
  }

  const isExcelDateSerial = (value: any, columnName: string): boolean => {
    if (dateColumns.includes(columnName)) {
      return typeof value === 'number'
    }
    return typeof value === 'number' && value > 1 && value < 60000
  }

  const handleFileUpload = (e: FileInputEvent): void => {
    const file = e.target.files?.[0]
    if (!file) return

    setMessage(null)
    setData(null)

    const reader = new FileReader()

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      try {
        if (!event.target) return

        const workbook = XLSX.read(event.target.result as string, {
          type: 'binary',
        })

        // ── Pick the correct sheet ──────────────────────────────────
        // 1. If sheetName prop is provided, try to find it by name.
        // 2. Fall back to the first non-hidden-looking sheet.
        // 3. Final fallback: SheetNames[0].
        let targetSheetName: string

        if (sheetName && workbook.SheetNames.includes(sheetName)) {
          targetSheetName = sheetName
        } else {
          // Skip sheets named 'Lookup' or starting with '_' (our hidden lookup sheets)
          const visibleSheet = workbook.SheetNames.find(
            (n) => n !== 'Lookup' && !n.startsWith('_')
          )
          targetSheetName = visibleSheet ?? workbook.SheetNames[0]
        }

        const sheet = workbook.Sheets[targetSheetName]
        let sheetData = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
        }) as T[]

        // Convert Excel serial date numbers to YYYY-MM-DD strings
        sheetData = sheetData.map((row) => {
          const newRow: Record<string, any> = {}
          for (const key in row) {
            if (isExcelDateSerial(row[key], key)) {
              newRow[key] = convertExcelDate(row[key] as number)
            } else {
              newRow[key] = row[key]
            }
          }
          return newRow as T
        })

        console.log(`Parsed sheet "${targetSheetName}":`, sheetData)
        setData(sheetData)
        onDataParsed(sheetData)
        setMessage(
          `Successfully loaded ${sheetData.length} records from "${targetSheetName}".`
        )
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setMessage(
          `Error parsing Excel file: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    reader.onerror = () => {
      setMessage('Error reading file. Please try again.')
    }

    reader.readAsBinaryString(file)
  }

  const handleSubmit = async () => {
    console.log('ExcelFileInput handleSubmit called, data:', data)
    if (!data || data.length === 0) {
      setMessage('No data to submit. Please upload an Excel file first.')
      return
    }

    try {
      setIsLoading(true)
      setMessage('Submitting data...')

      await onSubmit(data)

      setMessage('Data submitted successfully!')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setData(null)
    } catch (error) {
      setMessage(
        `Error submitting data: ${error instanceof Error ? error.message : String(error)}`
      )
      console.error('Error submitting data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !data || data.length === 0}
        >
          {isLoading ? 'Submitting...' : submitButtonText}
        </Button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.includes('Error') || message.includes('error')
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      {Array.isArray(data) && data.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">
            Imported Data ({data.length} records):
          </h2>
          <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelFileInput
