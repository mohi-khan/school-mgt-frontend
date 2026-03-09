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
  Printer,
  Plus,
  Minus,
  Layers,
  CheckCircle2,
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
// BulkFeeRow – a single row in the bulk collect popup
// -------------------------------------------------------------------
type BulkFeeRowData = {
  id: number
  student: { id: string; name: string } | null
  feeType: { id: string; name: string } | null
  amount: string
  method: string
  bankAccountId: { id: string; name: string } | null
  mfsId: { id: string; name: string } | null
  paymentDate: string
  remarks: string
  // internal: loaded fees for the selected student
  loadedFees: Array<{ id: string; name: string; remainingAmount: number }>
  isLoadingFees: boolean
}

type BulkFeeRowProps = {
  row: BulkFeeRowData
  studentItems: { id: string; name: string }[]
  bankAccountItems: { id: string; name: string }[]
  mfsItems: (method: string) => { id: string; name: string }[]
  onUpdate: (id: number, patch: Partial<BulkFeeRowData>) => void
  onRemove: (id: number) => void
  onStudentChange: (
    rowId: number,
    student: { id: string; name: string } | null
  ) => void
}

const BulkFeeRow = ({
  row,
  studentItems,
  bankAccountItems,
  mfsItems,
  onUpdate,
  onRemove,
  onStudentChange,
}: BulkFeeRowProps) => {
  const showBank = row.method === 'bank'
  const showMfs = ['bkash', 'nagad', 'rocket'].includes(row.method)

  return (
    <div className="grid gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
      <button
        onClick={() => onRemove(row.id)}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
        type="button"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Row 1: Student + Fee Type */}
      <div className="grid grid-cols-2 gap-3 pr-6">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Student</Label>
          <CustomCombobox
            items={studentItems}
            value={row.student}
            onChange={(v) => onStudentChange(row.id, v)}
            placeholder="Search student..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Fee Type</Label>
          {row.isLoadingFees ? (
            <div className="h-10 flex items-center px-3 border rounded-md bg-white text-sm text-gray-400">
              Loading fees...
            </div>
          ) : (
            <CustomCombobox
              items={row.loadedFees.map((f) => ({ id: f.id, name: f.name }))}
              value={row.feeType}
              onChange={(v) => {
                const fee = row.loadedFees.find((f) => f.id === v?.id)
                onUpdate(row.id, {
                  feeType: v,
                  amount: fee ? String(fee.remainingAmount) : '',
                })
              }}
              placeholder={
                row.student ? 'Select fee type...' : 'Select student first'
              }
            />
          )}
        </div>
      </div>

      {/* Row 2: Amount + Method + Bank/MFS + Date */}
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Amount</Label>
          <Input
            type="number"
            min={1}
            value={row.amount}
            onChange={(e) => onUpdate(row.id, { amount: e.target.value })}
            placeholder="Enter amount"
            className="h-10 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Method</Label>
          <CustomCombobox
            items={[
              { id: 'cash', name: 'Cash' },
              { id: 'bkash', name: 'bKash' },
              { id: 'nagad', name: 'Nagad' },
              { id: 'rocket', name: 'Rocket' },
              { id: 'bank', name: 'Bank' },
            ]}
            value={
              row.method
                ? {
                    id: row.method,
                    name:
                      row.method.charAt(0).toUpperCase() + row.method.slice(1),
                  }
                : null
            }
            onChange={(v) =>
              onUpdate(row.id, {
                method: v?.id || '',
                bankAccountId: null,
                mfsId: null,
              })
            }
            placeholder="Select method"
          />
        </div>

        {showBank && (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">
              Bank Account
            </Label>
            <CustomCombobox
              items={bankAccountItems}
              value={row.bankAccountId}
              onChange={(v) => onUpdate(row.id, { bankAccountId: v })}
              placeholder="Select bank"
            />
          </div>
        )}

        {showMfs && (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">
              {row.method.charAt(0).toUpperCase() + row.method.slice(1)} Account
            </Label>
            <CustomCombobox
              items={mfsItems(row.method)}
              value={row.mfsId}
              onChange={(v) => onUpdate(row.id, { mfsId: v })}
              placeholder={`Select ${row.method}`}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">
            Payment Date
          </Label>
          <Input
            type="date"
            value={row.paymentDate}
            onChange={(e) => onUpdate(row.id, { paymentDate: e.target.value })}
            className="h-10 text-sm"
          />
        </div>
      </div>

      {/* Row 3: Remarks */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-600">
          Remarks (optional)
        </Label>
        <Input
          value={row.remarks}
          onChange={(e) => onUpdate(row.id, { remarks: e.target.value })}
          placeholder="Enter remarks..."
          className="h-10 text-sm"
        />
      </div>
    </div>
  )
}

// -------------------------------------------------------------------
// Students component
// -------------------------------------------------------------------
let bulkRowCounter = 1

const Students = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [token] = useAtom(tokenAtom)
  const { data: studentsData, isLoading } = useGetAllStudents()
  console.log('🚀 ~ Students ~ studentsData:', studentsData)
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
  const [paidAmounts, setPaidAmounts] = useState<Record<number, string>>({})

  const [isFeeCollectionOpen, setIsFeeCollectionOpen] = useState(false)
  const [isBulkCollectOpen, setIsBulkCollectOpen] = useState(false)
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

  // Bulk collect state
  const [bulkRows, setBulkRows] = useState<BulkFeeRowData[]>([])
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)

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

  // Derived items for bulk popup
  const studentItems = useMemo(() => {
    return (
      studentsData?.data?.map((s: any) => ({
        id: String(s.studentDetails.studentId),
        name: [
          `${s.studentDetails.firstName} ${s.studentDetails.lastName} - ${s.studentDetails.className} - ${s.studentDetails.sectionName}`,
          // s.studentDetails.className,
          // s.studentDetails.sectionName,
        ]
          .filter(Boolean)
          .join('-'),
      })) || []
    )
  }, [studentsData?.data])

  const bankAccountItems = useMemo(() => {
    return (
      bankAccounts?.data?.map((b: any) => ({
        id: b.bankAccountId?.toString() || '0',
        name: `${b.bankName} - ${b.accountNumber} - ${b.branch}`,
      })) || []
    )
  }, [bankAccounts?.data])

  const getMfsItems = useCallback(
    (method: string) => {
      if (!mfsData?.data) return []
      return mfsData.data
        .filter((mfs: any) => mfs.mfsType === method)
        .map((mfs: any) => ({
          id: mfs.mfsId?.toString() || '0',
          name: `${mfs.accountName} - ${mfs.mfsNumber}`,
        }))
    },
    [mfsData?.data]
  )

  const resetForm = useCallback(() => {
    setPaymentMethod('')
    setBankAccountId(null)
    setMfsId(null)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setRemarks('')
    setSelectedFees([])
    setShowAllFees(false)
    setPaidAmounts({})
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

  // -------------------------------------------------------------------
  // Bulk Collect helpers
  // -------------------------------------------------------------------
  const makeEmptyRow = (): BulkFeeRowData => ({
    id: bulkRowCounter++,
    student: null,
    feeType: null,
    amount: '',
    method: 'cash',
    bankAccountId: null,
    mfsId: null,
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    loadedFees: [],
    isLoadingFees: false,
  })

  const openBulkCollect = () => {
    setBulkRows([makeEmptyRow()])
    setIsBulkCollectOpen(true)
  }

  const addBulkRow = () => setBulkRows((prev) => [...prev, makeEmptyRow()])

  const removeBulkRow = (id: number) => {
    setBulkRows((prev) => {
      if (prev.length === 1) return [makeEmptyRow()]
      return prev.filter((r) => r.id !== id)
    })
  }

  const updateBulkRow = (id: number, patch: Partial<BulkFeeRowData>) => {
    setBulkRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
  }

  const handleBulkStudentChange = async (
    rowId: number,
    student: { id: string; name: string } | null
  ) => {
    // Reset feeType and mark as loading
    updateBulkRow(rowId, {
      student,
      feeType: null,
      amount: '',
      loadedFees: [],
      isLoadingFees: !!student,
    })

    if (!student || !token) return

    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['students', Number(student.id)],
        queryFn: () => getStudentFeesById(token, Number(student.id)),
        staleTime: 5 * 60 * 1000,
      })

      const fees: any[] = Array.isArray(result) ? result : (result?.data ?? [])
      const unpaidFees = fees.filter(
        (fee: any) =>
          fee.status !== 'Paid' &&
          fee.feesTypeName &&
          fee.studentFeesId !== undefined
      )

      const loadedFees = unpaidFees.map((fee: any) => ({
        id: String(fee.studentFeesId),
        name: `${fee.feesTypeName} (Due: ${formatNumber(fee.remainingAmount ?? 0)})`,
        remainingAmount: fee.remainingAmount ?? 0,
      }))

      updateBulkRow(rowId, { loadedFees, isLoadingFees: false })
    } catch (e) {
      console.warn('Could not fetch fees for student:', student.id, e)
      updateBulkRow(rowId, { isLoadingFees: false })
    }
  }

  const handleBulkSubmit = async () => {
    const validRows = bulkRows.filter((r) => r.student && r.feeType && r.method)

    if (validRows.length === 0) {
      alert(
        'Please fill in at least one complete row (Student, Fee Type, Method).'
      )
      return
    }

    const payload: CollectFeesType[] = validRows.map((r) => {
      const fee = r.loadedFees.find((f) => f.id === r.feeType?.id)
      const paidAmount =
        r.amount && Number(r.amount) > 0
          ? Number(r.amount)
          : fee?.remainingAmount || 0

      return {
        studentId: Number(r.student!.id),
        studentFeesId: Number(r.feeType!.id),
        paidAmount,
        method: r.method as CollectFeesType['method'],
        bankAccountId:
          r.method === 'bank' && r.bankAccountId
            ? Number(r.bankAccountId.id)
            : null,
        mfsId:
          ['bkash', 'nagad', 'rocket'].includes(r.method) && r.mfsId
            ? Number(r.mfsId.id)
            : null,
        paymentDate: r.paymentDate,
        remarks: r.remarks,
      }
    })

    setIsBulkSubmitting(true)
    try {
      await collectFeesMutation.mutateAsync(payload as any)
      setIsBulkCollectOpen(false)
      setBulkRows([])
    } catch (e) {
      console.error('Bulk submit error:', e)
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  // -------------------------------------------------------------------
  // Single fee collection helpers
  // -------------------------------------------------------------------
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
      const customAmount = paidAmounts[studentFeesId]
      const paidAmount =
        customAmount && Number(customAmount) > 0
          ? Number(customAmount)
          : fee?.remainingAmount || 0
      return {
        studentFeesId,
        studentId: selectedStudentIdForFees,
        method: paymentMethod as 'bank' | 'bkash' | 'nagad' | 'rocket' | 'cash',
        paidAmount,
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

  const filteredAndSortedFees = useMemo(() => {
    if (!studentFees?.data) return []
    let fees = studentFees.data

    const seen = new Set()
    fees = fees.filter((fee: any) => {
      if (seen.has(fee.studentFeesId)) return false
      seen.add(fee.studentFeesId)
      return true
    })

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
                className="gap-2 bg-transparent border-amber-500 text-amber-700 hover:bg-amber-50"
                onClick={openBulkCollect}
              >
                <Layers className="h-4 w-4" />
                Bulk Collect Fees
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Collect fees for multiple students at once
            </TooltipContent>
          </Tooltip>
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
                    (sum: any, fee: any) =>
                      sum +
                      (fee.status === 'Paid'
                        ? fee.amount || 0
                        : fee.status === 'Partial'
                          ? fee.paidAmount || 0
                          : 0),
                    0
                  ) || 0

                const totalRemainingAmount =
                  student.studentFees?.reduce(
                    (sum: any, fee: any) =>
                      sum +
                      (fee.status === 'Unpaid'
                        ? fee.amount || 0
                        : fee.status === 'Partial'
                          ? fee.remainingAmount || 0
                          : 0),
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

      {/* ================================================================
          Bulk Collect Fees Popup
      ================================================================ */}
      <Dialog open={isBulkCollectOpen} onOpenChange={setIsBulkCollectOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              Bulk Collect Fees
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Add multiple students and collect their fees in one submission.
              Search students by name or admission number.
            </p>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {bulkRows.map((row, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Entry #{idx + 1}
                  </span>
                  {row.student && row.feeType && row.method && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                </div>
                <BulkFeeRow
                  row={row}
                  studentItems={studentItems}
                  bankAccountItems={bankAccountItems}
                  mfsItems={getMfsItems}
                  onUpdate={updateBulkRow}
                  onRemove={removeBulkRow}
                  onStudentChange={handleBulkStudentChange}
                />
              </div>
            ))}

            {/* Add row button */}
            <button
              onClick={addBulkRow}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Another Entry
            </button>
          </div>

          {/* Summary bar */}
          {bulkRows.some((r) => r.student && r.feeType) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-sm">
              <span className="text-amber-800 font-medium">
                {
                  bulkRows.filter((r) => r.student && r.feeType && r.method)
                    .length
                }{' '}
                of {bulkRows.length} entries ready to submit
              </span>
              <span className="text-amber-700 font-semibold">
                Total:{' '}
                {formatNumber(
                  bulkRows
                    .filter((r) => r.student && r.feeType)
                    .reduce((sum, r) => {
                      const fee = r.loadedFees.find(
                        (f) => f.id === r.feeType?.id
                      )
                      return (
                        sum +
                        (r.amount && Number(r.amount) > 0
                          ? Number(r.amount)
                          : fee?.remainingAmount || 0)
                      )
                    }, 0)
                )}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkCollectOpen(false)
                setBulkRows([])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSubmit}
              disabled={
                isBulkSubmitting ||
                !bulkRows.some((r) => r.student && r.feeType && r.method)
              }
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              {isBulkSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit{' '}
                  {bulkRows.filter((r) => r.student && r.feeType && r.method)
                    .length > 0
                    ? `(${bulkRows.filter((r) => r.student && r.feeType && r.method).length})`
                    : ''}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Collection Dialog (single student) */}
      <Dialog open={isFeeCollectionOpen} onOpenChange={setIsFeeCollectionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Collect Fees
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <CustomCombobox
                  items={[
                    { id: 'cash', name: 'Cash' },
                    { id: 'bkash', name: 'bKash' },
                    { id: 'nagad', name: 'Nagad' },
                    { id: 'rocket', name: 'Rocket' },
                    { id: 'bank', name: 'Bank' },
                  ]}
                  value={
                    paymentMethod
                      ? {
                          id: paymentMethod,
                          name:
                            paymentMethod.charAt(0).toUpperCase() +
                            paymentMethod.slice(1),
                        }
                      : null
                  }
                  onChange={(v) => setPaymentMethod(v?.id || '')}
                  placeholder="Select method"
                />
              </div>

              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account</Label>
                  <CustomCombobox
                    items={bankAccountItems}
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

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Student Fees (
                  {formatNumber(
                    selectedFees.reduce((sum, feeId) => {
                      const fee = studentFees?.data?.find(
                        (f: any) => f.studentFeesId === feeId
                      )
                      const custom = paidAmounts[feeId]
                      return (
                        sum +
                        (custom && Number(custom) > 0
                          ? Number(custom)
                          : fee?.remainingAmount || 0)
                      )
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
                        {selectedFees.length > 0 && (
                          <TableHead>Pay Amount</TableHead>
                        )}
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedFees?.map((fee: any) => {
                        const today = new Date()
                        const dueDate = new Date(fee.dueDate)
                        const lastPaymentDate = fee.lastPaymentDate
                          ? new Date(fee.lastPaymentDate)
                          : null

                        // remove time
                        today.setHours(0, 0, 0, 0)
                        dueDate.setHours(0, 0, 0, 0)
                        if (lastPaymentDate)
                          lastPaymentDate.setHours(0, 0, 0, 0)

                        const isPaid = fee.status === 'Paid'
                        const isPartial = fee.status === 'Partial'
                        const isUnpaid = fee.status === 'Unpaid'

                        let colorClass = 'text-green-600'

                        if (isPaid) {
                          // 🔵 paid on time, 🔴 paid late (default blue if no lastPaymentDate)
                          colorClass =
                            lastPaymentDate && lastPaymentDate >= dueDate
                              ? 'text-red-600'
                              : 'text-blue-600'
                        } else if (today > dueDate) {
                          // 🔴 overdue, unpaid
                          colorClass = 'text-red-600'
                        } else if (isPartial) {
                          // 🟡 partial, still within due date
                          colorClass = 'text-yellow-600'
                        } else {
                          // 🟢 unpaid, not yet overdue
                          colorClass = 'text-green-600'
                        }

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
                              <span className={colorClass}>
                                {formatNumber(fee.amount) || 0}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span className={colorClass}>
                                {formatNumber(fee.remainingAmount) || 0}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span className={colorClass}>
                                {formatNumber(fee.paidAmount) || 0}
                              </span>
                            </TableCell>

                            {selectedFees.length > 0 && (
                              <TableCell>
                                {!isPaid &&
                                  selectedFees.includes(fee.studentFeesId) && (
                                    <Input
                                      type="number"
                                      min={1}
                                      max={fee.remainingAmount}
                                      placeholder={String(fee.remainingAmount)}
                                      value={
                                        paidAmounts[fee.studentFeesId] || ''
                                      }
                                      onChange={(e) =>
                                        setPaidAmounts((prev) => ({
                                          ...prev,
                                          [fee.studentFeesId]: e.target.value,
                                        }))
                                      }
                                      className="w-28 h-8 text-sm"
                                    />
                                  )}
                              </TableCell>
                            )}

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
