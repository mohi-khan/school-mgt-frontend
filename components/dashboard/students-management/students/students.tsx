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
  DollarSign,
  Layers,
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
  useGetAllStudents,
  useGetStudentFeesById,
  useCollectFees,
  useGetBankAccounts,
  useGetMfss,
  useActivateStudent,
  useDeactivateStudent,
} from '@/hooks/use-api'
import type { GetStudentWithFeesType } from '@/utils/type'
import Link from 'next/link'
import { formatNumber } from '@/utils/conversions'
import { useReactToPrint } from 'react-to-print'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import BulkCollectFeesDialog, {
  buildFeesMasterGroups,
  MFS_METHODS,
} from './bulk-collect-fee-popup'
import SingleCollectFeesDialog from './single-collect-fee-popup'
import MoneyReceipt from './money-receipt'
import CustomSwitch from '@/utils/custom-switch'

const Students = () => {
  const router = useRouter()

  const { data: studentsData, isLoading } = useGetAllStudents()
  const { data: bankAccounts } = useGetBankAccounts()
  const { data: mfsData } = useGetMfss()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetStudentWithFeesType['studentDetails']>('firstName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  // ── Activate / Deactivate state ──────────────────────────────────────────
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [pendingStatusStudent, setPendingStatusStudent] = useState<{
    id: number
    currentlyActive: boolean
  } | null>(null)
  // Local mirror of each student's active state — only updated after confirmed API success
  const [activeStates, setActiveStates] = useState<Record<number, boolean>>({})

  const [paidAmounts, setPaidAmounts] = useState<Record<number, string>>({})
  const [feeRemarks, setFeeRemarks] = useState<Record<number, string>>({})
  const [feeDates, setFeeDates] = useState<Record<number, string>>({})

  const [isFeeCollectionOpen, setIsFeeCollectionOpen] = useState(false)
  const [isBulkCollectOpen, setIsBulkCollectOpen] = useState(false)
  const [selectedStudentIdForFees, setSelectedStudentIdForFees] = useState<
    number | null
  >(null)

  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
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
    divisionName: string
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

  // ── Activate / Deactivate mutations ──────────────────────────────────────

  const closeStatusDialog = useCallback(() => {
    setIsStatusDialogOpen(false)
    setPendingStatusStudent(null)
  }, [])

  const activateMutation = useActivateStudent({
    onClose: closeStatusDialog,
    reset: () => setPendingStatusStudent(null),
  })

  const deactivateMutation = useDeactivateStudent({
    onClose: closeStatusDialog,
    reset: () => setPendingStatusStudent(null),
  })

  const handleStatusToggle = (studentId: number, currentlyActive: boolean) => {
    // Do NOT change switch visually here — only open dialog
    setPendingStatusStudent({ id: studentId, currentlyActive })
    setIsStatusDialogOpen(true)
  }

  const handleConfirmStatusChange = () => {
    if (!pendingStatusStudent) return
    const { id, currentlyActive } = pendingStatusStudent
    if (currentlyActive) {
      deactivateMutation.mutate(
        { id },
        {
          onSuccess: () => {
            setActiveStates((prev) => ({ ...prev, [id]: false }))
          },
        }
      )
    } else {
      activateMutation.mutate(
        { id },
        {
          onSuccess: () => {
            setActiveStates((prev) => ({ ...prev, [id]: true }))
          },
        }
      )
    }
  }

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

  const feesMasterGroups = useMemo(
    () => buildFeesMasterGroups(studentsData?.data || []),
    [studentsData?.data]
  )

  // ── Single fee collect ────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setPaymentMethod('cash')
    setBankAccountId(null)
    setMfsId(null)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setRemarks('')
    setSelectedFees([])
    setShowAllFees(false)
    setPaidAmounts({})
    setFeeRemarks({})
    setFeeDates({})
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
          .includes(searchLower) ||
        String(student.studentDetails.divisionName)
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

    const today = new Date().toISOString().split('T')[0]

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
        paymentDate: feeDates[studentFeesId] || today,
        remarks: feeRemarks[studentFeesId] || remarks || '',
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
      divisionName: student.studentDetails.divisionName || 'N/A',
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
                onClick={() => handleSort('divisionName')}
                className="cursor-pointer"
              >
                Division <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
                <TableCell colSpan={11} className="text-center py-4">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : studentsData?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No students found
                </TableCell>
              </TableRow>
            ) : paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
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

                // Use local state if set (post-confirm), otherwise fall back to API value
                const isActive =
                  activeStates[student.studentDetails.studentId] ??
                  student.studentDetails.isActive ??
                  true

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
                    <TableCell>
                      {student.studentDetails.rollNo || '-'}
                    </TableCell>
                    <TableCell>
                      {student.studentDetails.className || '-'}
                    </TableCell>
                    <TableCell>
                      {student.studentDetails.divisionName || '-'}
                    </TableCell>
                    <TableCell>
                      {student.studentDetails.sectionName || '-'}
                    </TableCell>
                    <TableCell>{student.studentDetails.phoneNumber}</TableCell>
                    <TableCell>{formatNumber(totalAmount)}</TableCell>
                    <TableCell>{formatNumber(totalRemainingAmount)}</TableCell>
                    <TableCell>{formatNumber(totalPaidAmount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-start items-center gap-3">
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <CustomSwitch
                                checked={isActive}
                                onChange={() =>
                                  handleStatusToggle(
                                    student.studentDetails.studentId ?? 0,
                                    isActive
                                  )
                                }
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isActive
                              ? 'Deactivate student'
                              : 'Activate student'}
                          </TooltipContent>
                        </Tooltip>
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
      <SingleCollectFeesDialog
        open={isFeeCollectionOpen}
        onOpenChange={setIsFeeCollectionOpen}
        studentFees={studentFees}
        isLoadingFees={isLoadingFees}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        bankAccountId={bankAccountId}
        setBankAccountId={setBankAccountId}
        mfsId={mfsId}
        setMfsId={setMfsId}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        remarks={remarks}
        setRemarks={setRemarks}
        selectedFees={selectedFees}
        setSelectedFees={setSelectedFees}
        showAllFees={showAllFees}
        setShowAllFees={setShowAllFees}
        paidAmounts={paidAmounts}
        setPaidAmounts={setPaidAmounts}
        feeRemarks={feeRemarks}
        setFeeRemarks={setFeeRemarks}
        feeDates={feeDates}
        setFeeDates={setFeeDates}
        bankAccountItems={bankAccountItems}
        filteredMfsAccounts={filteredMfsAccounts}
        selectedStudentIdForFees={selectedStudentIdForFees}
        onClose={closePopup}
        onSubmit={handleSubmitFees}
        onPrintReceipt={handlePrintReceipt}
      />

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

      {/* ── Activate / Deactivate Confirmation Dialog ──────────────────────── */}
      <AlertDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatusStudent?.currentlyActive
                ? 'Deactivate Student'
                : 'Activate Student'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusStudent?.currentlyActive
                ? 'Are you sure you want to deactivate this student? They will lose access to the system.'
                : 'Are you sure you want to activate this student? They will regain access to the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={closeStatusDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              className={
                pendingStatusStudent?.currentlyActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {pendingStatusStudent?.currentlyActive
                ? 'Deactivate'
                : 'Activate'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Students
