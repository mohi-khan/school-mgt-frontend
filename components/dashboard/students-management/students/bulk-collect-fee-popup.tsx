import React, { useState, useMemo, useRef } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  DollarSign,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import type { CollectFeesType } from '@/utils/type'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate, formatNumber } from '@/utils/conversions'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
export const METHOD_OPTIONS = [
  { id: 'cash', name: 'Cash' },
  { id: 'bkash', name: 'bKash' },
  { id: 'nagad', name: 'Nagad' },
  { id: 'rocket', name: 'Rocket' },
  { id: 'bank', name: 'Bank' },
]
export const MFS_METHODS = ['bkash', 'nagad', 'rocket']

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type BulkStudentFeeEntry = {
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

export type BulkFeesMasterGroup = {
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
export function buildFeesMasterGroups(
  studentsData: any[]
): BulkFeesMasterGroup[] {
  const map = new Map<string, BulkFeesMasterGroup>()

  console.log(
    '[buildFeesMasterGroups] raw studentsData count:',
    studentsData.length
  )

  studentsData.forEach((s) => {
    const detail = s.studentDetails
    const fees: any[] = s.studentFees || []

    if (detail?.studentId === studentsData[0]?.studentDetails?.studentId) {
      console.log(
        '[buildFeesMasterGroups] sample raw fees for student',
        detail?.studentId,
        ':',
        JSON.stringify(fees.slice(0, 2), null, 2)
      )
    }

    fees.forEach((fee) => {
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
        studentFeesId: fee.studentFeesId ?? fee.studentFeeId ?? fee.id ?? 0,
        feesTypeName: fee.feesTypeName || '',
        amount: fee.amount || 0,
        paidAmount: fee.paidAmount || 0,
        remainingAmount: fee.remainingAmount || 0,
        status: fee.status || 'Unpaid',
        dueDate: fee.dueDate || '',
      }

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
          selectedIndices: number[]
          amounts: string[]
          studentRemarks: string[]
        }
      ) => void
    >
    isSubmitting?: boolean
  }) => {
    const [expanded, setExpanded] = useState(false)
    const [studentSearch, setStudentSearch] = useState('')

    // Default method is 'cash'
    const [method, setMethod] = useState('cash')
    const [bankAccountId, setBankAccountId] = useState<{
      id: string
      name: string
    } | null>(null)
    const [mfsId, setMfsId] = useState<{ id: string; name: string } | null>(
      null
    )
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const n = group.students.length
    const [selected, setSelected] = useState<boolean[]>(() =>
      Array(n).fill(false)
    )
    const [amounts, setAmounts] = useState<string[]>(() => Array(n).fill(''))
    // Per-student remarks
    const [studentRemarks, setStudentRemarks] = useState<string[]>(() =>
      Array(n).fill('')
    )

    const mfsItems = useMemo(() => {
      if (!mfsData?.data || !MFS_METHODS.includes(method)) return []
      return mfsData.data
        .filter((m: any) => m.mfsType === method)
        .map((m: any) => ({
          id: m.mfsId?.toString() || '0',
          name: `${m.accountName} - ${m.mfsNumber}`,
        }))
    }, [mfsData, method])

    const filteredStudents = useMemo(() => {
      if (!studentSearch.trim()) return group.students
      const lower = studentSearch.toLowerCase()
      return group.students.filter(
        (s) =>
          s.studentName.toLowerCase().includes(lower) ||
          s.admissionNo.toLowerCase().includes(lower) ||
          s.className.toLowerCase().includes(lower) ||
          s.sectionName.toLowerCase().includes(lower)
      )
    }, [group.students, studentSearch])

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

    const setStudentRemark = (i: number, value: string) => {
      setStudentRemarks((prev) => {
        const next = [...prev]
        next[i] = value
        return next
      })
    }

    const handleCollect = () => {
      console.log('[GroupAccordion handleCollect] group:', group.feesTypeName)
      console.log(
        '[GroupAccordion handleCollect] selectedIndices:',
        selectedIndices
      )

      onCollectGroup.current(group, {
        method,
        bankAccountId,
        mfsId,
        date,
        selectedIndices,
        amounts,
        studentRemarks,
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
      setStudentRemarks((prev) => {
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
            {/* Payment Controls — no group-level remarks */}
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
              </div>
            </div>

            {/* Student Search */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name, admission no, class..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              {studentSearch && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Showing {filteredStudents.length} of {group.students.length}{' '}
                  students
                </p>
              )}
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
                    {someSelected && (
                      <TableHead className="w-28">Pay Amount</TableHead>
                    )}
                    {someSelected && (
                      <TableHead className="w-36">Reference</TableHead>
                    )}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={someSelected ? 10 : 8}
                        className="text-center py-6 text-gray-400 text-sm"
                      >
                        No students match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const i = group.students.indexOf(student)
                      const isPaid = student.status === 'Paid'
                      const isPartial = student.status === 'Partial'
                      const isSelected = selected[i] === true
                      const customAmount = amounts[i] ?? ''
                      const customRemark = studentRemarks[i] ?? ''

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
                          {someSelected && (
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
                          )}
                          {someSelected && (
                            <TableCell>
                              {!isPaid && isSelected ? (
                                <Input
                                  type="text"
                                  value={customRemark}
                                  placeholder="Reference..."
                                  onChange={(e) =>
                                    setStudentRemark(i, e.target.value)
                                  }
                                  className="h-7 text-sm w-32"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </TableCell>
                          )}
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
                    })
                  )}
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
        selectedIndices: number[]
        amounts: string[]
        studentRemarks: string[]
      }
    ) => void
  >(null as any)

  collectRef.current = async (group, payload) => {
    const collectPayload: CollectFeesType[] = payload.selectedIndices.map(
      (i) => {
        const student = group.students[i]

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
          // Each student gets their own remarks
          remarks: payload.studentRemarks[i] || '',
        }

        return entry
      }
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

export default BulkCollectFeesDialog
