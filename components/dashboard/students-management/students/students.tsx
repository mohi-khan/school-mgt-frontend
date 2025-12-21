'use client'
import { useCallback, useState, useMemo } from 'react'
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
} from 'lucide-react'
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
} from '@/hooks/use-api'
import type { GetStudentWithFeesType } from '@/utils/type'
import Link from 'next/link'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate } from '@/utils/conversions'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelFileInput from '@/utils/excel-file-input'
import { Popup } from '@/utils/popup'

const Students = () => {
  const router = useRouter()
  const { data: studentsData, isLoading } = useGetAllStudents()
  const { data: bankAccounts } = useGetBankAccounts()
  console.log('🚀 ~ Students ~ studentsData:', studentsData)
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
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [selectedFees, setSelectedFees] = useState<number[]>([])

  const { data: studentFees, isLoading: isLoadingFees } = useGetStudentFeesById(
    selectedStudentIdForFees ? Number(selectedStudentIdForFees) : 0
  )

  const resetForm = useCallback(() => {
    setPaymentMethod('')
    setBankAccountId(null)
    setPhoneNumber('')
    setPaymentDate('')
    setRemarks('')
    setSelectedFees([])
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
    router.push(`/students/${studentId}/edit`)
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
      // Only select fees that are not paid
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
        phoneNumber: ['bkash', 'nagad', 'rocket'].includes(paymentMethod)
          ? phoneNumber
          : null,
        paymentDate,
        remarks,
      }
    })

    collectFeesMutation.mutate(feeData as any)
  }

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Student Fees Id': '',
        'Student Id': '',
        Method: '',
        'Bank Account Id': '',
        'Phone Number': '',
        'Payment Date': '',
        Remarks: '',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Collection Template')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, 'fee-collection-template.xlsx')
  }

  // Handle parsed Excel data
  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  // Handle Excel data submission
  const handleExcelSubmit = async (data: any[]) => {
    try {
      // Process each row and create fee collection records
      const feeCollections = data.map((row) => ({
        studentFeesId: row['Student Fees Id']
          ? Number(row['Student Fees Id'])
          : null,
        studentId: row['Student Id'] ? Number(row['Student Id']) : null,
        method: row['Method'] || 'cash',
        bankAccountId: row['Bank Account Id']
          ? Number(row['Bank Account Id'])
          : null,
        phoneNumber: row['Phone Number'] || null,
        paymentDate:
          row['Payment Date'] || new Date().toISOString().split('T')[0],
        remarks: row['Remarks'] || 'Bulk collection',
      }))

      // Submit all fee collections
      await collectFeesMutation.mutateAsync(feeCollections as any)
      setIsImportPopupOpen(false)
    } catch (error) {
      console.error('Error importing fee collections:', error)
      throw error
    }
  }

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
          <Button
            variant="outline"
            className="gap-2"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button
            variant="outline"
            className="gap-2"
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
              paginatedStudents.map((student) => {
                // Calculate total amount
                const totalAmount =
                  student.studentFees?.reduce(
                    (sum, fee: any) => sum + (fee.amount || 0),
                    0
                  ) || 0

                // Calculate total paid amount
                const totalPaidAmount =
                  student.studentFees?.reduce(
                    (sum, fee: any) => sum + (fee.paidAmount || 0),
                    0
                  ) || 0

                // Calculate total remaining amount
                const totalRemainingAmount =
                  student.studentFees?.reduce(
                    (sum, fee: any) => sum + (fee.remainingAmount || 0),
                    0
                  ) || 0

                // Check if any fee has passed due date and has remaining amount
                const hasOverdueFees =
                  student.studentFees?.some(
                    (fee: any) =>
                      fee.dueDate &&
                      fee.remainingAmount > 0 &&
                      new Date(fee.dueDate) < new Date()
                  ) || false

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
                    <TableCell>{totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{totalRemainingAmount.toFixed(2)}</TableCell>
                    <TableCell>{totalPaidAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex justify-start gap-2">
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
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+880..."
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
              <h3 className="text-lg font-semibold">Student Fees</h3>
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
                                studentFees?.data?.filter(
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
                      {studentFees?.data?.map((fee: any) => {
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
                                {fee.amount || 0}
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
                                {fee.remainingAmount || 0}
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
                                {fee.paidAmount || 0}
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
                    !phoneNumber)
                }
                className="bg-amber-600 hover:bg-amber-700"
              >
                Collect Fees
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Popup */}
      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        title="Import Fee Collections from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-amber-50 rounded-md">
            <h3 className="font-semibold mb-2">Excel Format Requirements:</h3>
            <p className="text-sm text-gray-700 mb-2">
              Your Excel file should have the following columns:
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>
                <strong>Student Fees Id</strong> - Numeric ID of the student fee
              </li>
              <li>
                <strong>Student Id</strong> - Numeric ID of the student
              </li>
              <li>
                <strong>Method</strong> - Payment method (cash, bkash, nagad,
                rocket, bank)
              </li>
              <li>
                <strong>Bank Account Id</strong> - Required if method is &apos;bank&apos;
              </li>
              <li>
                <strong>Phone Number</strong> - Required if method is
                bkash/nagad/rocket
              </li>
              <li>
                <strong>Payment Date</strong> - Date in YYYY-MM-DD format
              </li>
              <li>
                <strong>Remarks</strong> - Optional remarks
              </li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              <strong>Tip:</strong> Download the template first to see the
              correct format!
            </p>
          </div>
          <ExcelFileInput
            onDataParsed={handleExcelDataParsed}
            onSubmit={handleExcelSubmit}
            submitButtonText="Import Fee Collections"
            dateColumns={['Payment Date']}
          />
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
