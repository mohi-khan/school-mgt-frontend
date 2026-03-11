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
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useGetAllStudents,
  useDeleteStudent,
  useGetStudentFeesById,
  useCollectFees,
  useGetBankAccounts,
  useGetMfss,
} from '@/hooks/use-api'
import type { GetStudentWithFeesType, CollectFeesType } from '@/utils/type'
import Link from 'next/link'
import { tokenAtom } from '@/utils/user'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate, formatNumber } from '@/utils/conversions'
import { useReactToPrint } from 'react-to-print'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ─────────────────────────────────────────────────────────────────────────────
// MoneyReceipt
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Collect – Types
// ─────────────────────────────────────────────────────────────────────────────
const METHOD_OPTIONS = [
  { id: 'cash', name: 'Cash' },
  { id: 'bkash', name: 'bKash' },
  { id: 'nagad', name: 'Nagad' },
  { id: 'rocket', name: 'Rocket' },
  { id: 'bank', name: 'Bank' },
]
const MFS_METHODS = ['bkash', 'nagad', 'rocket']

type BulkStudentFeeEntry = {
  studentId: number
  studentName: string
  admissionNo: string
  className: string
  sectionName: string
  studentFeesId: number
  feesTypeName: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: 'Paid' | 'Partial' | 'Unpaid'
  dueDate: string
}

type BulkFeesMasterGroup = {
  groupKey: string
  feesGroupId: number
  feesGroupName: string
  feesTypeName: string
  dueDate: string
  students: BulkStudentFeeEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// buildFeesMasterGroups helper
// ─────────────────────────────────────────────────────────────────────────────
function buildFeesMasterGroups(studentsData: any[]): BulkFeesMasterGroup[] {
  const map = new Map<string, BulkFeesMasterGroup>()

  console.log(
    '[buildFeesMasterGroups] raw studentsData count:',
    studentsData.length
  )

  studentsData.forEach((s) => {
    const detail = s.studentDetails
    const fees: any[] = s.studentFees || []

    // DEBUG: log raw fee objects for first student to inspect structure
    if (detail?.studentId === studentsData[0]?.studentDetails?.studentId) {
      console.log(
        '[buildFeesMasterGroups] sample raw fees for student',
        detail?.studentId,
        ':',
        JSON.stringify(fees.slice(0, 2), null, 2)
      )
    }

    fees.forEach((fee) => {
      // FIX: log every fee's studentFeesId to catch where null enters
      // if (fee.studentFeesId == null) {
      //   console.warn(
      //     '[buildFeesMasterGroups] ⚠️ NULL studentFeesId found! studentId:',
      //     detail?.studentId,
      //     '| fee object keys:',
      //     Object.keys(fee),
      //     '| full fee:',
      //     JSON.stringify(fee)
      //   )
      // }

      const groupKey = `${fee.feesGroupId ?? 0}-${fee.feesTypeId ?? 0}-${fee.dueDate ?? ''}`

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          feesGroupId: fee.feesGroupId ?? 0,
          feesGroupName: fee.feesGroupName || 'Unassigned',
          feesTypeName: fee.feesTypeName || 'Unknown',
          dueDate: fee.dueDate || '',
          students: [],
        })
      }

      const entry: BulkStudentFeeEntry = {
        studentId: detail.studentId ?? 0,
        studentName: `${detail.firstName} ${detail.lastName}`,
        admissionNo: String(detail.admissionNo ?? ''),
        className: detail.className || '',
        sectionName: detail.sectionName || '',
        // FIX: ensure we read the correct field name — log both candidates
        studentFeesId: fee.studentFeesId ?? fee.studentFeeId ?? fee.id ?? 0,
        feesTypeName: fee.feesTypeName || '',
        amount: fee.amount || 0,
        paidAmount: fee.paidAmount || 0,
        remainingAmount: fee.remainingAmount || 0,
        status: fee.status || 'Unpaid',
        dueDate: fee.dueDate || '',
      }

      // console.log(
      //   '[buildFeesMasterGroups] entry for student',
      //   entry.studentId,
      //   '| studentFeesId:',
      //   entry.studentFeesId,
      //   '| raw fee.studentFeesId:',
      //   fee.studentFeesId,
      //   '| raw fee.studentFeeId:',
      //   fee.studentFeeId,
      //   '| raw fee.id:',
      //   fee.id
      // )

      map.get(groupKey)!.students.push(entry)
    })
  })

  return Array.from(map.values()).sort((a, b) => {
    const aUnpaid = a.students.filter((s) => s.status !== 'Paid').length
    const bUnpaid = b.students.filter((s) => s.status !== 'Paid').length
    return bUnpaid - aUnpaid
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// StatBadge
// ─────────────────────────────────────────────────────────────────────────────
const StatBadge = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) => (
  <div
    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${color}`}
  >
    <Icon className="h-3 w-3" />
    <span className="text-gray-500">{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// GroupAccordion
// ─────────────────────────────────────────────────────────────────────────────
const GroupAccordion = React.memo(
  ({
    group,
    bankAccountItems,
    mfsData,
    onCollectGroup,
    isSubmitting,
  }: {
    group: BulkFeesMasterGroup
    bankAccountItems: { id: string; name: string }[]
    mfsData: any
    onCollectGroup: React.MutableRefObject<
      (
        group: BulkFeesMasterGroup,
        payload: {
          method: string
          bankAccountId: { id: string; name: string } | null
          mfsId: { id: string; name: string } | null
          date: string
          remarks: string
          selectedIndices: number[]
          amounts: string[]
        }
      ) => void
    >
    isSubmitting?: boolean
  }) => {
    const [expanded, setExpanded] = useState(false)

    const [method, setMethod] = useState('cash')
    const [bankAccountId, setBankAccountId] = useState<{
      id: string
      name: string
    } | null>(null)
    const [mfsId, setMfsId] = useState<{ id: string; name: string } | null>(
      null
    )
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [remarks, setRemarks] = useState('')

    const n = group.students.length
    const [selected, setSelected] = useState<boolean[]>(() =>
      Array(n).fill(false)
    )
    const [amounts, setAmounts] = useState<string[]>(() => Array(n).fill(''))

    const mfsItems = useMemo(() => {
      if (!mfsData?.data || !MFS_METHODS.includes(method)) return []
      return mfsData.data
        .filter((m: any) => m.mfsType === method)
        .map((m: any) => ({
          id: m.mfsId?.toString() || '0',
          name: `${m.accountName} - ${m.mfsNumber}`,
        }))
    }, [mfsData, method])

    const totalStudents = group.students.length
    const paidFull = group.students.filter((s) => s.status === 'Paid').length
    const totalOwed = group.students.reduce((acc, st) => acc + st.amount, 0)
    const totalCollected = group.students.reduce(
      (acc, st) => acc + st.paidAmount,
      0
    )

    const unpaidIndices = group.students
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status !== 'Paid')
      .map(({ i }) => i)

    const selectedIndices = unpaidIndices.filter((i) => selected[i] === true)

    const willCollect = selectedIndices.reduce((sum, i) => {
      const amt = amounts[i]
      const student = group.students[i]
      return (
        sum +
        (amt && Number(amt) > 0 ? Number(amt) : (student.remainingAmount ?? 0))
      )
    }, 0)

    const allSelected =
      unpaidIndices.length > 0 &&
      unpaidIndices.every((i) => selected[i] === true)
    const someSelected = selectedIndices.length > 0
    const showBank = method === 'bank'
    const showMfs = MFS_METHODS.includes(method)

    const toggleSelectAll = (checked: boolean) => {
      setSelected((prev) => {
        const next = [...prev]
        unpaidIndices.forEach((i) => {
          next[i] = checked
        })
        return next
      })
    }

    const toggleOne = (i: number, checked: boolean) => {
      setSelected((prev) => {
        const next = [...prev]
        next[i] = checked
        return next
      })
    }

    const setAmount = (i: number, value: string) => {
      setAmounts((prev) => {
        const next = [...prev]
        next[i] = value
        return next
      })
    }

    const handleCollect = () => {
      // DEBUG: log the students being collected and their studentFeesIds
      console.log('[GroupAccordion handleCollect] group:', group.feesTypeName)
      console.log(
        '[GroupAccordion handleCollect] selectedIndices:',
        selectedIndices
      )
      selectedIndices.forEach((i) => {
        const student = group.students[i]
        console.log(
          '[GroupAccordion handleCollect] student index',
          i,
          '| studentId:',
          student.studentId,
          '| studentFeesId:',
          student.studentFeesId,
          '| studentName:',
          student.studentName,
          '| customAmount:',
          amounts[i]
        )
      })

      onCollectGroup.current(group, {
        method,
        bankAccountId,
        mfsId,
        date,
        remarks,
        selectedIndices,
        amounts,
      })
      setSelected((prev) => {
        const next = [...prev]
        selectedIndices.forEach((i) => {
          next[i] = false
        })
        return next
      })
      setAmounts((prev) => {
        const next = [...prev]
        selectedIndices.forEach((i) => {
          next[i] = ''
        })
        return next
      })
    }

    return (
      <div className="rounded-lg border-2 border-amber-300 overflow-hidden shadow-sm">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-amber-100 to-amber-50 p-4 flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
        >
          <button
            type="button"
            className="p-1 hover:bg-amber-200 rounded transition-colors shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-amber-700" />
            ) : (
              <ChevronDown className="h-5 w-5 text-amber-700" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900">
              <span className="text-amber-700 ml-1 text-xl">
                {group.feesTypeName}
              </span>
              {group.dueDate && (
                <span className="text-gray-500 ml-1 text-xs">
                  (Due: {formatDate(new Date(group.dueDate))})
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <StatBadge
                icon={Users}
                label="Students"
                value={`${paidFull}/${totalStudents} paid`}
                color="bg-blue-50 border-blue-200 text-blue-700"
              />
              <StatBadge
                icon={DollarSign}
                label="Total Owed"
                value={formatNumber(totalOwed)}
                color="bg-red-50 border-red-200 text-red-700"
              />
              <StatBadge
                icon={DollarSign}
                label="Collected"
                value={formatNumber(totalCollected)}
                color="bg-green-50 border-green-200 text-green-700"
              />
              {someSelected && (
                <StatBadge
                  icon={CheckCircle2}
                  label="Will Collect"
                  value={formatNumber(willCollect)}
                  color="bg-amber-50 border-amber-300 text-amber-700"
                />
              )}
            </div>
          </div>

          {someSelected && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0"
              disabled={isSubmitting}
              onClick={(e) => {
                e.stopPropagation()
                handleCollect()
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Collect ({selectedIndices.length})
            </Button>
          )}
        </div>

        {/* Body */}
        {expanded && (
          <div className="bg-white border-t border-amber-200">
            {/* Payment Controls */}
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Payment Settings — applies to all selected students in this
                group
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-sm w-36"
                  />
                </div>
                <div className="space-y-1 w-36">
                  <Label className="text-xs">Method</Label>
                  <Select
                    value={method}
                    onValueChange={(v) => {
                      setMethod(v)
                      setBankAccountId(null)
                      setMfsId(null)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {METHOD_OPTIONS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {showBank && (
                  <div className="space-y-1 w-56">
                    <Label className="text-xs">Bank Account</Label>
                    <CustomCombobox
                      items={bankAccountItems}
                      value={bankAccountId}
                      onChange={setBankAccountId}
                      placeholder="Select bank"
                    />
                  </div>
                )}
                {showMfs && (
                  <div className="space-y-1 w-56">
                    <Label className="text-xs capitalize">
                      {method} Account
                    </Label>
                    <CustomCombobox
                      items={mfsItems}
                      value={mfsId}
                      onChange={setMfsId}
                      placeholder={`Select ${method}`}
                    />
                  </div>
                )}
                <div className="space-y-1 flex-1 min-w-36">
                  <Label className="text-xs">Remarks (optional)</Label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(c) => toggleSelectAll(!!c)}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Class / Section</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-28">Pay Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.students.map((student, i) => {
                    const isPaid = student.status === 'Paid'
                    const isPartial = student.status === 'Partial'
                    const isSelected = selected[i] === true
                    const customAmount = amounts[i] ?? ''

                    const rowBg = isPaid
                      ? 'bg-green-50'
                      : isPartial
                        ? 'bg-yellow-50'
                        : isSelected
                          ? 'bg-amber-50'
                          : ''

                    return (
                      <TableRow key={i} className={rowBg}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            disabled={isPaid}
                            onCheckedChange={(c) => toggleOne(i, !!c)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {student.studentName}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {student.admissionNo}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {student.className} / {student.sectionName}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatNumber(student.amount)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatNumber(student.paidAmount)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatNumber(student.remainingAmount)}
                        </TableCell>
                        <TableCell>
                          {!isPaid && isSelected ? (
                            <Input
                              type="number"
                              min={1}
                              max={student.remainingAmount}
                              value={customAmount}
                              placeholder={String(student.remainingAmount)}
                              onChange={(e) => setAmount(i, e.target.value)}
                              className="h-7 text-sm w-24"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              student.status === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : student.status === 'Partial'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {student.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    )
  }
)

GroupAccordion.displayName = 'GroupAccordion'

// ─────────────────────────────────────────────────────────────────────────────
// BulkCollectFeesDialog
// ─────────────────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]

const BulkCollectFeesDialog = ({
  open,
  onOpenChange,
  feesMasterGroups,
  bankAccountItems,
  mfsData,
  onCollect,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  feesMasterGroups: BulkFeesMasterGroup[]
  bankAccountItems: { id: string; name: string }[]
  mfsData: any
  onCollect: (payload: CollectFeesType[]) => Promise<void>
  isSubmitting?: boolean
}) => {
  const collectRef = useRef<
    (
      group: BulkFeesMasterGroup,
      payload: {
        method: string
        bankAccountId: { id: string; name: string } | null
        mfsId: { id: string; name: string } | null
        date: string
        remarks: string
        selectedIndices: number[]
        amounts: string[]
      }
    ) => void
  >(null as any)

  collectRef.current = async (group, payload) => {
    console.log('[BulkCollectFeesDialog collectRef] group:', group.feesTypeName)
    console.log(
      '[BulkCollectFeesDialog collectRef] selectedIndices:',
      payload.selectedIndices
    )
    console.log(
      '[BulkCollectFeesDialog collectRef] group.students:',
      group.students
    )

    const collectPayload: CollectFeesType[] = payload.selectedIndices.map(
      (i) => {
        const student = group.students[i]

        // DEBUG: log each student entry just before building the payload
        console.log(
          '[BulkCollectFeesDialog collectRef] building payload for index',
          i,
          '| studentId:',
          student.studentId,
          '| studentFeesId:',
          student.studentFeesId,
          '| studentName:',
          student.studentName,
          '| raw student object:',
          JSON.stringify(student)
        )

        const amt = payload.amounts[i]
        const paidAmount =
          amt && Number(amt) > 0 ? Number(amt) : student.remainingAmount

        const entry = {
          studentId: Number(student.studentId),
          studentFeesId: Number(student.studentFeesId),
          paidAmount: Number(paidAmount),
          method: payload.method as CollectFeesType['method'],
          bankAccountId:
            payload.method === 'bank' && payload.bankAccountId
              ? Number(payload.bankAccountId.id)
              : null,
          mfsId:
            MFS_METHODS.includes(payload.method) && payload.mfsId
              ? Number(payload.mfsId.id)
              : null,
          paymentDate: payload.date,
          remarks: payload.remarks,
        }

        // DEBUG: log the final entry — studentFeesId should never be 0 or NaN here
        console.log(
          '[BulkCollectFeesDialog collectRef] final entry:',
          JSON.stringify(entry)
        )

        if (!entry.studentFeesId || isNaN(entry.studentFeesId)) {
          console.error(
            '[BulkCollectFeesDialog collectRef] ❌ studentFeesId is invalid!',
            'student.studentFeesId was:',
            student.studentFeesId,
            '| Number() result:',
            Number(student.studentFeesId)
          )
        }

        return entry
      }
    )

    console.log(
      '[BulkCollectFeesDialog collectRef] final collectPayload:',
      JSON.stringify(collectPayload, null, 2)
    )

    if (collectPayload.length === 0) return
    await onCollect(collectPayload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-white p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="bg-amber-100 p-1.5 rounded-md">
                <Layers className="h-5 w-5 text-amber-600" />
              </div>
              Bulk Collect Fees
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mt-1">
            Fees are grouped by fees master. Expand a group, select students,
            and click Collect.
          </p>
        </div>

        {/* Groups */}
        <div className="p-6 space-y-4">
          {feesMasterGroups.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No outstanding fees found.
            </div>
          ) : (
            feesMasterGroups.map((group) => (
              <GroupAccordion
                key={group.groupKey}
                group={group}
                bankAccountItems={bankAccountItems}
                mfsData={mfsData}
                isSubmitting={isSubmitting}
                onCollectGroup={collectRef}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Students component
// ─────────────────────────────────────────────────────────────────────────────
const Students = () => {
  const router = useRouter()
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

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredMfsAccounts = useMemo(() => {
    if (!mfsData?.data || !MFS_METHODS.includes(paymentMethod)) return []
    return mfsData.data
      .filter((mfs: any) => mfs.mfsType === paymentMethod)
      .map((mfs: any) => ({
        id: mfs.mfsId?.toString() || '0',
        name: `${mfs.accountName} - ${mfs.mfsNumber}`,
      }))
  }, [mfsData, paymentMethod])

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

  // Grouped data for bulk collect
  const feesMasterGroups = useMemo(
    () => buildFeesMasterGroups(studentsData?.data || []),
    [studentsData?.data]
  )

  // ── Single fee collect ────────────────────────────────────────────────────

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
    if (!selectedStudentIdForFees) {
      alert('Please select a student')
      return
    }
    if (selectedFees.length === 0) {
      alert('Please select at least one fee to collect')
      return
    }
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }
    if (paymentMethod === 'bank' && !bankAccountId) {
      alert('Please select a bank account')
      return
    }
    if (MFS_METHODS.includes(paymentMethod) && !mfsId) {
      alert(`Please select a ${paymentMethod} account`)
      return
    }

    const feeData = selectedFees.map((studentFeesId) => {
      const fee = studentFees?.data?.find(
        (f: any) => f.studentFeesId === studentFeesId
      )

      if (!fee) {
        throw new Error(`Fee with ID ${studentFeesId} not found`)
      }

      const customAmount = paidAmounts[studentFeesId]
      const paidAmount =
        customAmount && Number(customAmount) > 0
          ? Number(customAmount)
          : fee?.remainingAmount || 0

      return {
        studentFeesId: Number(studentFeesId),
        studentId: selectedStudentIdForFees,
        method: paymentMethod as 'bank' | 'bkash' | 'nagad' | 'rocket' | 'cash',
        paidAmount,
        bankAccountId:
          paymentMethod === 'bank' && bankAccountId
            ? Number(bankAccountId.id)
            : null,
        mfsId:
          MFS_METHODS.includes(paymentMethod) && mfsId
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
    if (!showAllFees) fees = fees.filter((fee: any) => fee.status !== 'Paid')
    return [...fees].sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
  }, [studentFees?.data, showAllFees])

  // ── Render ────────────────────────────────────────────────────────────────
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
                onClick={() => setIsBulkCollectOpen(true)}
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
              <TableHead className="cursor-pointer">
                Total Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer">
                Due Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer">
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
                              onClick={() => {
                                setSelectedStudentIdForFees(
                                  student.studentDetails.studentId ?? 0
                                )
                                setIsFeeCollectionOpen(true)
                              }}
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
                            router.push(
                              `/dashboard/students-management/edit-student/${student.studentDetails.studentId}`
                            )
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setDeletingStudentId(
                              student.studentDetails.studentId ?? 0
                            )
                            setIsDeleteDialogOpen(true)
                          }}
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

      {/* ── Bulk Collect Fees Dialog ────────────────────────────────────────── */}
      <BulkCollectFeesDialog
        open={isBulkCollectOpen}
        onOpenChange={setIsBulkCollectOpen}
        feesMasterGroups={feesMasterGroups}
        bankAccountItems={bankAccountItems}
        mfsData={mfsData}
        isSubmitting={isBulkSubmitting}
        onCollect={async (payload) => {
          setIsBulkSubmitting(true)
          try {
            await collectFeesMutation.mutateAsync(payload as any)
          } catch (e) {
            console.error('Bulk collect error:', e)
          } finally {
            setIsBulkSubmitting(false)
          }
        }}
      />

      {/* ── Single Student Fee Collection Dialog ───────────────────────────── */}
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
                  items={METHOD_OPTIONS}
                  value={
                    paymentMethod
                      ? METHOD_OPTIONS.find((m) => m.id === paymentMethod) ||
                        null
                      : null
                  }
                  onChange={(v) => setPaymentMethod(v?.id || '')}
                  placeholder="Select method"
                />
              </div>
              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <Label>Bank Account</Label>
                  <CustomCombobox
                    items={bankAccountItems}
                    value={bankAccountId}
                    onChange={(v) => setBankAccountId(v)}
                    placeholder="Select bank account"
                  />
                </div>
              )}
              {MFS_METHODS.includes(paymentMethod) && (
                <div className="space-y-2">
                  <Label>MFS Account</Label>
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
                        const todayDate = new Date()
                        const dueDate = new Date(fee.dueDate)
                        const lastPaymentDate = fee.lastPaymentDate
                          ? new Date(fee.lastPaymentDate)
                          : null
                        todayDate.setHours(0, 0, 0, 0)
                        dueDate.setHours(0, 0, 0, 0)
                        if (lastPaymentDate)
                          lastPaymentDate.setHours(0, 0, 0, 0)

                        const isPaid = fee.status === 'Paid'
                        const isPartial = fee.status === 'Partial'

                        let colorClass = 'text-green-600'
                        if (isPaid) {
                          colorClass =
                            lastPaymentDate && lastPaymentDate >= dueDate
                              ? 'text-red-600'
                              : 'text-blue-600'
                        } else if (todayDate > dueDate) {
                          colorClass = 'text-red-600'
                        } else if (isPartial) {
                          colorClass = 'text-yellow-600'
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
                  (MFS_METHODS.includes(paymentMethod) && !mfsId)
                }
                className="bg-amber-600 hover:bg-amber-700"
              >
                Collect Fees
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Reference */}
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
                if (deletingStudentId)
                  deleteMutation.mutate({ id: deletingStudentId })
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
