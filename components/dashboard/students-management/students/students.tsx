'use client'
import React from 'react'
import { useCallback, useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  ArrowUpDown,
  Search,
  Users,
  Edit2,
  Trash2,
  DollarSign,
  Download,
  Upload,
  Printer,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useGetAllStudents,
  useDeleteStudent,
  useGetStudentFeesById,
  useCollectFees,
  useGetBankAccounts,
  useGetMfss,
} from '@/hooks/use-api'
import { getStudentFeesById } from '@/utils/api'
import type { GetStudentWithFeesType, CollectFeesType } from '@/utils/type'
import Link from 'next/link'
import { tokenAtom } from '@/utils/user'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate, formatNumber } from '@/utils/conversions'
import { saveAs } from 'file-saver'
import { Popup } from '@/utils/popup'
import { useReactToPrint } from 'react-to-print'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// -------------------------------------------------------------------
// MoneyReceipt – unchanged
// -------------------------------------------------------------------
const MoneyReceipt = React.forwardRef<
  HTMLDivElement,
  {
    studentName: string
    className: string
    sectionName: string
    admissionNo: string
    phoneNumber: string
    paymentDate: string
    remarks: string
    fees: Array<{
      paymentMethod: string
      feesTypeName: string
      amount: number
      paidAmount: number
    }>
  }
>(
  (
    {
      studentName,
      className,
      sectionName,
      admissionNo,
      phoneNumber,
      paymentDate,
      fees,
    },
    ref
  ) => {
    const totalAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0)

    return (
      <div
        ref={ref}
        className="w-full max-w-4xl mx-auto bg-white shadow-lg print:shadow-none"
      >
        {/* Header */}
        <div className="border-b-4 border-amber-300 p-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide text-center">
            MONEY RECEIPT
          </h1>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Student Name:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {studentName}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Date:</span>
                <p className="font-semibold border-b border-gray-400 min-w-[100px]">
                  {paymentDate
                    ? formatDate(new Date(paymentDate))
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Admission No:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {admissionNo}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Class:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {className}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Section:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {sectionName}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Phone:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {phoneNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fees Table */}
        <div className="p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-amber-300">
                <th className="border border-gray-300 px-4 py-3 text-left text-black">
                  Fee Type
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Payment Method
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Paid Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {fee.feesTypeName || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800 text-center">
                    {fee.paymentMethod || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800 text-center">
                    {formatNumber(fee.paidAmount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-50">
                <td
                  colSpan={2}
                  className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800"
                >
                  Total Paid:
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-lg">
                  {formatNumber(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-8 py-6 text-xs text-gray-500">
          <div className="grid grid-cols-3 gap-8 mt-20">
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Collected By
              </p>
            </div>
            <div></div>
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Authorized Signature
              </p>
            </div>
          </div>
          <p className="text-center mt-6">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }
)

MoneyReceipt.displayName = 'MoneyReceipt'

// -------------------------------------------------------------------
// Students component
// -------------------------------------------------------------------
const Students = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [token] = useAtom(tokenAtom)
  const { data: studentsData, isLoading } = useGetAllStudents()
  const { data: bankAccounts } = useGetBankAccounts()
  const { data: mfsData } = useGetMfss()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetStudentWithFeesType['studentDetails']>('firstName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(
    null
  )

  const [isFeeCollectionOpen, setIsFeeCollectionOpen] = useState(false)
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false)
  const [selectedStudentIdForFees, setSelectedStudentIdForFees] = useState<
    number | null
  >(null)

  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [bankAccountId, setBankAccountId] = useState<{
    id: string
    name: string
  } | null>(null)
  const [mfsId, setMfsId] = useState<{ id: string; name: string } | null>(null)
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [remarks, setRemarks] = useState<string>('')
  const [selectedFees, setSelectedFees] = useState<number[]>([])
  const [showAllFees, setShowAllFees] = useState(false)
  const [parsedExcelData, setParsedExcelData] = useState<any[]>([])

  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef })
  const [selectedReceiptData, setSelectedReceiptData] = useState<{
    studentName: string
    className: string
    sectionName: string
    admissionNo: string
    phoneNumber: string
    paymentDate: string
    remarks: string
    fees: Array<{
      feesTypeName: string
      amount: number
      paidAmount: number
      paymentMethod: string
    }>
  } | null>(null)

  const { data: studentFees, isLoading: isLoadingFees } = useGetStudentFeesById(
    selectedStudentIdForFees ? Number(selectedStudentIdForFees) : 0
  )

  const filteredMfsAccounts = useMemo(() => {
    if (
      !mfsData?.data ||
      !['bkash', 'nagad', 'rocket'].includes(paymentMethod)
    ) {
      return []
    }
    return mfsData.data
      .filter((mfs: any) => mfs.mfsType === paymentMethod)
      .map((mfs: any) => ({
        id: mfs.mfsId?.toString() || '0',
        name: `${mfs.accountName} - ${mfs.mfsNumber}`,
      }))
  }, [mfsData, paymentMethod])

  const resetForm = useCallback(() => {
    setPaymentMethod('')
    setBankAccountId(null)
    setMfsId(null)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setRemarks('')
    setSelectedFees([])
    setShowAllFees(false)
  }, [])

  const closePopup = useCallback(() => {
    setIsFeeCollectionOpen(false)
    setSelectedStudentIdForFees(null)
    resetForm()
  }, [resetForm])

  const collectFeesMutation = useCollectFees({
    onClose: closePopup,
    reset: resetForm,
  })

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setDeletingStudentId(null)
  }, [])

  const deleteMutation = useDeleteStudent({
    onClose: closeDeleteDialog,
    reset: () => setDeletingStudentId(null),
  })

  const handleSort = (
    column: keyof GetStudentWithFeesType['studentDetails']
  ) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredStudents = useMemo(() => {
    if (!studentsData?.data) return []
    return studentsData.data.filter((student: GetStudentWithFeesType) => {
      const searchLower = searchTerm.toLowerCase()
      const fullName =
        `${student.studentDetails.firstName} ${student.studentDetails.lastName}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        String(student.studentDetails.admissionNo)
          .toLowerCase()
          .includes(searchLower) ||
        String(student.studentDetails.rollNo)
          .toLowerCase()
          .includes(searchLower) ||
        String(student.studentDetails.phoneNumber).includes(searchLower) ||
        String(student.studentDetails.className)
          .toLowerCase()
          .includes(searchLower)
      )
    })
  }, [studentsData?.data, searchTerm])

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aValue = a.studentDetails[sortColumn] ?? ''
      const bValue = b.studentDetails[sortColumn] ?? ''
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredStudents, sortColumn, sortDirection])

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedStudents.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedStudents, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage)

  const handleEditClick = (studentId: number) => {
    router.push(`/dashboard/students-management/edit-student/${studentId}`)
  }

  const handleDeleteClick = (studentId: number) => {
    setDeletingStudentId(studentId)
    setIsDeleteDialogOpen(true)
  }

  const handleFeeCollectionClick = (studentId: number) => {
    setSelectedStudentIdForFees(studentId)
    setIsFeeCollectionOpen(true)
  }

  const handleFeeToggle = (feeId: number) => {
    setSelectedFees((prev) =>
      prev.includes(feeId)
        ? prev.filter((id) => id !== feeId)
        : [...prev, feeId]
    )
  }

  const handleSelectAllFees = (checked: boolean) => {
    if (checked) {
      const unpaidFees =
        studentFees?.data
          ?.filter((fee: any) => fee.status !== 'Paid')
          .map((fee: any) => fee.studentFeesId) || []
      setSelectedFees(unpaidFees)
    } else {
      setSelectedFees([])
    }
  }

  const handleSubmitFees = () => {
    if (!selectedStudentIdForFees) return
    const feeData = selectedFees.map((studentFeesId) => {
      const fee = studentFees?.data?.find(
        (f: any) => f.studentFeesId === studentFeesId
      )
      return {
        studentFeesId,
        studentId: selectedStudentIdForFees,
        method: paymentMethod as 'bank' | 'bkash' | 'nagad' | 'rocket' | 'cash',
        paidAmount: fee?.remainingAmount || 0,
        bankAccountId:
          paymentMethod === 'bank' && bankAccountId
            ? Number(bankAccountId.id)
            : null,
        mfsId:
          ['bkash', 'nagad', 'rocket'].includes(paymentMethod) && mfsId
            ? Number(mfsId.id)
            : null,
        paymentDate,
        remarks,
      }
    })
    collectFeesMutation.mutate(feeData as any)
  }

  const handlePrintReceipt = () => {
    if (!selectedStudentIdForFees) return
    const student = studentsData?.data?.find(
      (s: any) => s.studentDetails.studentId === selectedStudentIdForFees
    )
    if (!student) return

    const paidFees =
      studentFees?.data?.filter(
        (fee: any) => fee.status === 'Paid' || fee.status === 'Partial'
      ) || []

    if (paidFees.length === 0) {
      alert('No paid or partial fees found for this student')
      return
    }

    const feesToPrint = paidFees.map((fee: any) => ({
      feesTypeName: fee.feesTypeName || 'N/A',
      amount: fee.amount || 0,
      paidAmount: fee.paidAmount || 0,
      paymentMethod: fee.paymentMethod || 'N/A',
    }))

    const latestPayment = paidFees[0]

    setSelectedReceiptData({
      studentName: `${student.studentDetails.firstName} ${student.studentDetails.lastName}`,
      className: student.studentDetails.className || 'N/A',
      sectionName: student.studentDetails.sectionName || 'N/A',
      admissionNo: student.studentDetails.admissionNo?.toString() || 'N/A',
      phoneNumber: student.studentDetails.phoneNumber || 'N/A',
      paymentDate:
        latestPayment.paymentDate || new Date().toISOString().split('T')[0],
      remarks: latestPayment.paymentRemarks || 'Fee payment receipt',
      fees: feesToPrint,
    })

    setTimeout(() => {
      reactToPrintFn && reactToPrintFn()
    }, 100)
  }

  // -------------------------------------------------------------------
  // Download Excel template with dropdowns (uses exceljs)
  // Fetches fees per student at download time using the same API that
  // powers the fee collection popup, so feesTypeName is always present.
  // -------------------------------------------------------------------
  const downloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()

    // ── Collect student names and fee labels ────────────────────────
    const studentNames: string[] = []
    const feeLabels: string[] = []

    const students: any[] = studentsData?.data || []

    // Fetch fees for every student using the exact same queryKey and
    // fetcher as useGetStudentFeesById so results are also cached.
    for (const s of students) {
      const fullName = `${s.studentDetails.firstName} ${s.studentDetails.lastName}`
      const studentId = s.studentDetails.studentId
      // Student Name label embeds studentId so handleExcelSubmit can parse it back.
      // Format: "Full Name | <studentId>"
      studentNames.push(`${fullName} | ${studentId}`)

      if (!studentId || !token) continue

      try {
        const result = await queryClient.fetchQuery({
          queryKey: ['students', studentId],
          queryFn: () => getStudentFeesById(token, studentId),
          staleTime: 5 * 60 * 1000,
        })

        const fees: any[] = Array.isArray(result) ? result : result?.data || []

        fees.forEach((fee: any) => {
          const feeTypeName = fee.feesTypeName || ''
          const studentFeesId = fee.studentFeesId
          const remainingAmount = fee.remainingAmount ?? 0
          if (feeTypeName && studentFeesId !== undefined) {
            // Fee Type label embeds both studentFeesId and remainingAmount.
            // Format: "Full Name | Fee Type Name | <studentFeesId> | <remainingAmount>"
            feeLabels.push(
              `${fullName} | ${feeTypeName} | ${studentFeesId} | ${remainingAmount}`
            )
          }
        })
      } catch (e) {
        console.warn(`Could not fetch fees for student ${studentId}:`, e)
      }
    }

    // ── Main data-entry sheet FIRST so SheetNames[0] is always "Fee Collection"
    // ExcelFileInput reads SheetNames[0], so this sheet must come first.
    const sheet = workbook.addWorksheet('Fee Collection')

    // ── Hidden lookup sheet SECOND ──────────────────────────────────
    // Cross-sheet formula references work regardless of sheet order.
    const lookupSheet = workbook.addWorksheet('Lookup')
    lookupSheet.state = 'veryHidden'

    studentNames.forEach((name, i) => {
      lookupSheet.getCell(`A${i + 1}`).value = name
    })
    feeLabels.forEach((label, i) => {
      lookupSheet.getCell(`B${i + 1}`).value = label
    })

    sheet.columns = [
      { header: 'Student Name', key: 'studentName', width: 32 },
      { header: 'Fee Type', key: 'feeType', width: 40 },
      { header: 'Method', key: 'method', width: 14 },
      { header: 'Bank Account Id', key: 'bankAccountId', width: 16 },
      { header: 'MFS Id', key: 'mfsId', width: 10 },
      { header: 'Payment Date', key: 'paymentDate', width: 16 },
      { header: 'Remarks', key: 'remarks', width: 24 },
    ]

    // Style the header row
    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFBBF24' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    headerRow.height = 20

    // ── Data validation (dropdowns) for rows 2–200 ─────────────────
    //
    // IMPORTANT: Excel requires the formulae string to be wrapped in
    // the sheet name reference. exceljs writes this correctly when the
    // worksheet is already added before the validation is set.
    //
    // For student names & fee labels we use cross-sheet references
    // because inline comma-separated lists have a 255-char limit in
    // Excel, which is easily exceeded with many students.

    const studentRange = `Lookup!$A$1:$A$${Math.max(studentNames.length, 1)}`
    const feeRange = `Lookup!$B$1:$B$${Math.max(feeLabels.length, 1)}`

    for (let row = 2; row <= 200; row++) {
      // Student Name
      sheet.getCell(`A${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        // showDropDown: false, // false = show the arrow button (Excel convention)
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Student',
        error: 'Please select a student from the dropdown.',
        formulae: [studentRange],
      }

      // Fee Type
      sheet.getCell(`B${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        // showDropDown: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Fee Type',
        error: 'Please select a fee type from the dropdown.',
        formulae: [feeRange],
      }

      // Method – short enough for inline list
      sheet.getCell(`C${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        // showDropDown: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Method',
        error: 'Choose: cash, bkash, nagad, rocket, or bank.',
        formulae: ['"cash,bkash,nagad,rocket,bank"'],
      }
    }

    // ── Write & save ────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'fee-collection-template.xlsx')
  }

  // -------------------------------------------------------------------
  // Handle parsed Excel data (preview only – no change needed)
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // Handle Excel data submission – maps names → IDs before sending
  // -------------------------------------------------------------------
  const handleExcelSubmit = async (submittedData: any[]) => {
    try {
      const data = submittedData
      console.log('handleExcelSubmit data:', data)
      console.log(
        'First row keys:',
        data[0]
          ? Object.keys(data[0]).map((k) => `"${k}" (len:${k.length})`)
          : 'no data'
      )
      const feeCollections: CollectFeesType[] = data
        .filter((row) => {
          const keys = Object.keys(row)
          const studentKey = keys.find((k) => k.trim() === 'Student Name')
          const feeKey = keys.find((k) => k.trim() === 'Fee Type')
          console.log('Keys found:', { studentKey, feeKey, allKeys: keys })
          return row[studentKey || 'Student Name'] && row[feeKey || 'Fee Type']
        })
        .map((row) => {
          // Use trimmed key matching to handle any whitespace differences
          const keys = Object.keys(row)
          const studentKey =
            keys.find((k) => k.trim() === 'Student Name') || 'Student Name'
          const feeKey = keys.find((k) => k.trim() === 'Fee Type') || 'Fee Type'
          const methodKey = keys.find((k) => k.trim() === 'Method') || 'Method'
          const dateKey =
            keys.find((k) => k.trim() === 'Payment Date') || 'Payment Date'
          const bankKey =
            keys.find((k) => k.trim() === 'Bank Account Id') ||
            'Bank Account Id'
          const mfsKey = keys.find((k) => k.trim() === 'MFS Id') || 'MFS Id'
          const remarksKey =
            keys.find((k) => k.trim() === 'Remarks') || 'Remarks'

          // ── Parse Student Name label ───────────────────────────────
          // Format: "Full Name | <studentId>"
          // e.g.  "Fatima Siraj Sizdah | 140"
          const studentLabel: string = row[studentKey] || ''
          const studentParts = studentLabel.split(' | ')
          const studentId = Number(studentParts[studentParts.length - 1])

          // ── Parse Fee Type label ───────────────────────────────────
          // Format: "Full Name | Fee Type Name | <studentFeesId> | <remainingAmount>"
          // e.g.  "Fatima Siraj Sizdah | January Fees | 1820 | 2000"
          const feeLabel: string = row[feeKey] || ''
          const feeParts = feeLabel.split(' | ')
          const studentFeesId = Number(feeParts[feeParts.length - 2])
          const paidAmount = Number(feeParts[feeParts.length - 1])

          // ── Normalize payment date ─────────────────────────────────
          let rawDate: string =
            row[dateKey] || new Date().toISOString().split('T')[0]
          if (rawDate && !rawDate.includes('-')) {
            const d = new Date(rawDate)
            rawDate = !isNaN(d.getTime())
              ? d.toISOString().split('T')[0]
              : rawDate
          }

          const result = {
            studentId,
            studentFeesId,
            paidAmount,
            method: (row[methodKey] || 'cash') as CollectFeesType['method'],
            bankAccountId: row[bankKey] ? Number(row[bankKey]) : null,
            mfsId: row[mfsKey] ? Number(row[mfsKey]) : null,
            paymentDate: rawDate,
            remarks: row[remarksKey] || '',
          }
          console.log('Parsed row:', result)
          return result
        })

      const unresolved = feeCollections.filter(
        (r) =>
          isNaN(r.studentId) || isNaN(r.studentFeesId) || r.studentFeesId === 0
      )
      if (unresolved.length > 0) {
        const proceed = window.confirm(
          `${unresolved.length} row(s) have missing student or fee data and will be skipped. Continue?`
        )
        if (!proceed) return
      }

      const validCollections = feeCollections.filter(
        (r) =>
          !isNaN(r.studentId) &&
          !isNaN(r.studentFeesId) &&
          r.studentFeesId !== 0
      )

      if (validCollections.length === 0) {
        alert(
          'No valid rows to import. Please download a fresh template and try again.'
        )
        return
      }

      await collectFeesMutation.mutateAsync(validCollections as any)
      setIsImportPopupOpen(false)
      setParsedExcelData([])
    } catch (error) {
      console.error('Error importing fee collections:', error)
      throw error
    }
  }

  const filteredAndSortedFees = useMemo(() => {
    if (!studentFees?.data) return []
    let fees = studentFees.data
    if (!showAllFees) {
      fees = fees.filter((fee: any) => fee.status !== 'Paid')
    }
    return [...fees].sort((a: any, b: any) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [studentFees?.data, showAllFees])

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-md">
            <Users className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Students</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={downloadTemplate}
                disabled={!studentsData?.data}
              >
                <Download className="h-4 w-4" />
                Template
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Download Excel template with student &amp; fee dropdowns
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setIsImportPopupOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead
                onClick={() => handleSort('firstName')}
                className="cursor-pointer"
              >
                Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('admissionNo')}
                className="cursor-pointer"
              >
                Admission No <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('rollNo')}
                className="cursor-pointer"
              >
                Roll No <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('className')}
                className="cursor-pointer"
              >
                Class <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('sectionName')}
                className="cursor-pointer"
              >
                Section <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('phoneNumber')}
                className="cursor-pointer"
              >
                Phone <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('phoneNumber')}
                className="cursor-pointer"
              >
                Total Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('phoneNumber')}
                className="cursor-pointer"
              >
                Due Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('phoneNumber')}
                className="cursor-pointer"
              >
                Paid Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="pl-8">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : studentsData?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No students found
                </TableCell>
              </TableRow>
            ) : paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No students match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student: any) => {
                const totalAmount =
                  student.studentFees?.reduce(
                    (sum: any, fee: any) => sum + (fee.amount || 0),
                    0
                  ) || 0
                const totalPaidAmount =
                  student.studentFees?.reduce(
                    (sum: any, fee: any) => sum + (fee.paidAmount || 0),
                    0
                  ) || 0
                const totalRemainingAmount =
                  student.studentFees?.reduce(
                    (sum: any, fee: any) => sum + (fee.remainingAmount || 0),
                    0
                  ) || 0

                return (
                  <TableRow key={student.studentDetails.studentId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/students-management/student-details/${student.studentDetails.studentId}`}
                        className="text-amber-600 font-semibold"
                      >
                        {`${student.studentDetails.firstName} ${student.studentDetails.lastName}`}
                      </Link>
                    </TableCell>
                    <TableCell>{student.studentDetails.admissionNo}</TableCell>
                    <TableCell>{student.studentDetails.rollNo}</TableCell>
                    <TableCell>
                      {student.studentDetails.className || '-'}
                    </TableCell>
                    <TableCell>
                      {student.studentDetails.sectionName || '-'}
                    </TableCell>
                    <TableCell>{student.studentDetails.phoneNumber}</TableCell>
                    <TableCell>{formatNumber(totalAmount)}</TableCell>
                    <TableCell>{formatNumber(totalRemainingAmount)}</TableCell>
                    <TableCell>{formatNumber(totalPaidAmount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-start gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() =>
                                handleFeeCollectionClick(
                                  student.studentDetails.studentId ?? 0
                                )
                              }
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Collect Fees</TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700"
                          onClick={() =>
                            handleEditClick(
                              student.studentDetails.studentId ?? 0
                            )
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() =>
                            handleDeleteClick(
                              student.studentDetails.studentId ?? 0
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sortedStudents.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => {
                if (
                  index === 0 ||
                  index === totalPages - 1 ||
                  (index >= currentPage - 2 && index <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={`page-${index}`}>
                      <PaginationLink
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (
                  index === currentPage - 3 ||
                  index === currentPage + 3
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationLink>...</PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Fee Collection Dialog */}
      <Dialog open={isFeeCollectionOpen} onOpenChange={setIsFeeCollectionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Collect Fees
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Form Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account</Label>
                  <CustomCombobox
                    items={
                      bankAccounts?.data?.map((b) => ({
                        id: b.bankAccountId?.toString() || '0',
                        name: `${b.bankName} - ${b.accountNumber} - ${b.branch}`,
                      })) || []
                    }
                    value={bankAccountId}
                    onChange={(v) => setBankAccountId(v)}
                    placeholder="Select bank account"
                  />
                </div>
              )}

              {['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
                <div className="space-y-2">
                  <Label htmlFor="mfsAccount">MFS Account</Label>
                  <CustomCombobox
                    items={filteredMfsAccounts}
                    value={mfsId}
                    onChange={(v) => setMfsId(v)}
                    placeholder={`Select ${paymentMethod} account`}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks"
                  rows={3}
                />
              </div>
            </div>

            {/* Student Fees Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Student Fees (
                  {formatNumber(
                    selectedFees.reduce((sum, feeId) => {
                      const fee = studentFees?.data?.find(
                        (f: any) => f.studentFeesId === feeId
                      )
                      return sum + (fee?.remainingAmount || 0)
                    }, 0)
                  )}
                  )
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllFees(!showAllFees)}
                    className="text-sm"
                  >
                    {showAllFees ? 'Show Less' : 'Show All'}
                  </Button>
                  <button
                    className="flex items-center gap-2 text-amber-600 hover:text-amber-700 border border-amber-600 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePrintReceipt}
                    disabled={
                      !studentFees?.data ||
                      studentFees?.data.every(
                        (fee: any) => fee.status === 'Unpaid'
                      )
                    }
                    type="button"
                  >
                    <Printer className="w-4" />
                    <span className="text-sm">Print Money Receipt</span>
                  </button>
                </div>
              </div>

              {isLoadingFees ? (
                <div className="text-center py-4">Loading fees...</div>
              ) : studentFees?.data?.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No fees found for this student
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedFees.length > 0 &&
                              selectedFees.length ===
                                filteredAndSortedFees.filter(
                                  (fee: any) => fee.status !== 'Paid'
                                ).length
                            }
                            onCheckedChange={handleSelectAllFees}
                          />
                        </TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedFees?.map((fee: any) => {
                        const isDueDatePassed =
                          new Date(fee.dueDate) < new Date()
                        const isPaid = fee.status === 'Paid'
                        return (
                          <TableRow key={fee.studentFeesId}>
                            <TableCell>
                              <Checkbox
                                checked={selectedFees.includes(
                                  fee.studentFeesId
                                )}
                                onCheckedChange={() =>
                                  handleFeeToggle(fee.studentFeesId)
                                }
                                disabled={isPaid}
                              />
                            </TableCell>
                            <TableCell>{fee.feesTypeName || 'N/A'}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  isDueDatePassed
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }
                              >
                                {formatNumber(fee.amount) || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  isDueDatePassed
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }
                              >
                                {formatNumber(fee.remainingAmount) || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  isDueDatePassed
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }
                              >
                                {formatNumber(fee.paidAmount) || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              {formatDate(fee.dueDate) || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs badge px-2 py-1 rounded ${
                                  fee.status === 'Unpaid'
                                    ? 'bg-red-100 text-red-700'
                                    : fee.status === 'Paid'
                                      ? 'bg-green-100 text-green-700'
                                      : fee.status === 'Partial'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : ''
                                }`}
                              >
                                {fee.status || 'Pending'}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={closePopup}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFees}
                disabled={
                  !selectedStudentIdForFees ||
                  !paymentMethod ||
                  !paymentDate ||
                  selectedFees.length === 0 ||
                  (paymentMethod === 'bank' && !bankAccountId) ||
                  (['bkash', 'nagad', 'rocket'].includes(paymentMethod) &&
                    !mfsId)
                }
                className="bg-amber-600 hover:bg-amber-700"
              >
                Collect Fees
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Reference for Money Receipt */}
      <div style={{ display: 'none' }}>
        <div ref={contentRef}>
          {selectedReceiptData && (
            <MoneyReceipt
              studentName={selectedReceiptData.studentName}
              className={selectedReceiptData.className}
              sectionName={selectedReceiptData.sectionName}
              admissionNo={selectedReceiptData.admissionNo}
              phoneNumber={selectedReceiptData.phoneNumber}
              paymentDate={selectedReceiptData.paymentDate}
              remarks={selectedReceiptData.remarks}
              fees={selectedReceiptData.fees}
            />
          )}
        </div>
      </div>

      {/* Import Popup */}
      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => {
          setIsImportPopupOpen(false)
          setParsedExcelData([])
        }}
        title="Import Fee Collections from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4 space-y-4">
          <div className="p-4 bg-amber-50 rounded-md text-sm text-gray-700 space-y-1">
            <p className="font-semibold">How to use:</p>
            <p>
              1. Click <strong>Template</strong> (top of page) to download the
              Excel file with dropdowns.
            </p>
            <p>
              2. Select <strong>Student Name</strong> and{' '}
              <strong>Fee Type</strong> from the dropdowns in each row.
            </p>
            <p>
              3. Fill in <strong>Method</strong>, <strong>Payment Date</strong>,
              and optional fields.
            </p>
            <p>
              4. Upload the file below and click <strong>Import</strong>.
            </p>
          </div>

          {/* Self-contained file picker — no ExcelFileInput dependency */}
          <div className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setParsedExcelData([])

                import('xlsx').then((XLSX) => {
                  const reader = new FileReader()
                  reader.onload = (evt) => {
                    try {
                      const workbook = XLSX.read(evt.target?.result as string, {
                        type: 'binary',
                      })
                      // Always read "Fee Collection" sheet, skip Lookup sheet
                      const sheetName = workbook.SheetNames.includes(
                        'Fee Collection'
                      )
                        ? 'Fee Collection'
                        : (workbook.SheetNames.find(
                            (n) => n !== 'Lookup' && !n.startsWith('_')
                          ) ?? workbook.SheetNames[0])
                      const sheet = workbook.Sheets[sheetName]
                      const raw = XLSX.utils.sheet_to_json(sheet, {
                        raw: false,
                      }) as any[]
                      console.log('File parsed, rows:', raw.length, raw)
                      setParsedExcelData(raw)
                    } catch (err) {
                      console.error('Parse error:', err)
                      alert('Failed to parse Excel file. Please try again.')
                    }
                  }
                  reader.readAsBinaryString(file)
                })
              }}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700"
            />

            {parsedExcelData.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-green-700 font-medium">
                  ✓ {parsedExcelData.length} row(s) ready to import
                </p>
                <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(parsedExcelData, null, 2)}
                  </pre>
                </div>
                <Button
                  onClick={() => handleExcelSubmit(parsedExcelData)}
                  className="bg-amber-600 hover:bg-amber-700 w-full"
                  disabled={collectFeesMutation.isPending}
                >
                  {collectFeesMutation.isPending
                    ? 'Importing...'
                    : `Import ${parsedExcelData.length} Record(s)`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Popup>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStudentId) {
                  deleteMutation.mutate({ id: deletingStudentId })
                }
                setIsDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Students
