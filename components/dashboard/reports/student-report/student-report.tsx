'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  FileSpreadsheet,
  Search,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useGetAllStudents } from '@/hooks/use-api'
import { formatDate, formatNumber } from '@/utils/conversions'

const StudentReport = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(
    null
  )

  const { data: studentsData, isLoading } = useGetAllStudents()

  const students = useMemo(() => {
    return (
      studentsData?.data?.filter(
        (s: any) => s.studentDetails.isActive === true
      ) || []
    )
  }, [studentsData])

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students
    const lower = searchTerm.toLowerCase()
    return students.filter((s: any) => {
      const fullName =
        `${s.studentDetails.firstName} ${s.studentDetails.lastName}`.toLowerCase()
      return (
        fullName.includes(lower) ||
        String(s.studentDetails.admissionNo).includes(lower) ||
        String(s.studentDetails.rollNo).includes(lower) ||
        String(s.studentDetails.phoneNumber).includes(lower) ||
        String(s.studentDetails.className || '')
          .toLowerCase()
          .includes(lower) ||
        String(s.studentDetails.divisionName || '')
          .toLowerCase()
          .includes(lower)
      )
    })
  }, [students, searchTerm])

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  const handleRowClick = (studentId: number) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId))
  }

  const getFeesSummary = (student: any) => {
    const fees = student.studentFees || []
    const totalAmount = fees.reduce(
      (sum: number, f: any) => sum + (f.amount || 0),
      0
    )
    const totalPaid = fees.reduce(
      (sum: number, f: any) =>
        sum +
        (f.status === 'Paid'
          ? f.amount || 0
          : f.status === 'Partial'
            ? f.paidAmount || 0
            : 0),
      0
    )
    const totalDue = fees.reduce(
      (sum: number, f: any) =>
        sum +
        (f.status === 'Unpaid'
          ? f.amount || 0
          : f.status === 'Partial'
            ? f.remainingAmount || 0
            : 0),
      0
    )
    return { totalAmount, totalPaid, totalDue }
  }

  const exportToExcel = () => {
    const rows: any[] = []

    filteredStudents.forEach((s: any) => {
      const { totalAmount, totalPaid, totalDue } = getFeesSummary(s)
      const fees = s.studentFees || []

      // Student summary row
      rows.push({
        'Row Type': 'Student',
        'Admission No': s.studentDetails.admissionNo,
        'Roll No': s.studentDetails.rollNo,
        'First Name': s.studentDetails.firstName,
        'Last Name': s.studentDetails.lastName,
        Gender: s.studentDetails.gender,
        'Date of Birth': s.studentDetails.dateOfBirth
          ? formatDate(new Date(s.studentDetails.dateOfBirth))
          : 'N/A',
        Class: s.studentDetails.className || 'N/A',
        Division: s.studentDetails.divisionName || 'N/A',
        Section: s.studentDetails.sectionName || 'N/A',
        'Phone Number': s.studentDetails.phoneNumber,
        Email: s.studentDetails.email,
        'Admission Date': s.studentDetails.admissionDate
          ? formatDate(new Date(s.studentDetails.admissionDate))
          : 'N/A',
        'Father Name': s.studentDetails.fatherName || 'N/A',
        'Mother Name': s.studentDetails.motherName || 'N/A',
        'Fee Type': '',
        'Fee Amount': totalAmount,
        'Paid Amount': totalPaid,
        'Due Amount': totalDue,
        'Fee Status': '',
        'Due Date': '',
      })

      // Fee detail rows
      fees.forEach((fee: any) => {
        rows.push({
          'Row Type': '  → Fee',
          'Admission No': '',
          'Roll No': '',
          'First Name': '',
          'Last Name': '',
          Gender: '',
          'Date of Birth': '',
          Class: '',
          Division: '',
          Section: '',
          'Phone Number': '',
          Email: '',
          'Admission Date': '',
          'Father Name': '',
          'Mother Name': '',
          'Fee Type': fee.feesTypeName || 'N/A',
          'Fee Amount': fee.amount || 0,
          'Paid Amount': fee.paidAmount || 0,
          'Due Amount': fee.remainingAmount || 0,
          'Fee Status': fee.status || 'N/A',
          'Due Date': fee.dueDate ? formatDate(new Date(fee.dueDate)) : 'N/A',
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `student-report.xlsx`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-md">
            <Users className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Student Report</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 w-64"
            />
          </div>
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={filteredStudents.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Admission No</TableHead>
              <TableHead className="font-bold">Roll No</TableHead>
              <TableHead className="font-bold">Class</TableHead>
              <TableHead className="font-bold">Division</TableHead>
              <TableHead className="font-bold">Section</TableHead>
              <TableHead className="font-bold">Phone</TableHead>
              <TableHead className="font-bold">Total Amount</TableHead>
              <TableHead className="font-bold">Paid Amount</TableHead>
              <TableHead className="font-bold">Due Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-4 text-gray-500"
                >
                  {searchTerm
                    ? 'No students match your search'
                    : 'No active student records found'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student: any) => {
                const id = student.studentDetails.studentId
                const isExpanded = expandedStudentId === id
                const { totalAmount, totalPaid, totalDue } =
                  getFeesSummary(student)
                const fees = student.studentFees || []

                return (
                  <>
                    <TableRow
                      key={id}
                      className="cursor-pointer hover:bg-amber-50 transition-colors"
                      onClick={() => handleRowClick(id)}
                    >
                      <TableCell className="text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${student.studentDetails.firstName} ${student.studentDetails.lastName}`}
                      </TableCell>
                      <TableCell>
                        {student.studentDetails.admissionNo}
                      </TableCell>
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
                      <TableCell>
                        {student.studentDetails.phoneNumber}
                      </TableCell>
                      <TableCell>{formatNumber(totalAmount)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatNumber(totalPaid)}
                      </TableCell>
                      <TableCell className="text-red-500">
                        {formatNumber(totalDue)}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${id}-fees`} className="bg-gray-50">
                        <TableCell colSpan={11} className="p-0">
                          <div className="px-8 py-3">
                            {fees.length === 0 ? (
                              <p className="text-sm text-gray-400 py-2">
                                No fee records found for this student.
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-amber-50">
                                    <TableHead className="font-semibold text-xs">
                                      Fee Type
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs">
                                      Total Amount
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs">
                                      Paid Amount
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs">
                                      Due Amount
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs">
                                      Due Date
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs">
                                      Status
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {fees.map((fee: any, i: number) => (
                                    <TableRow
                                      key={fee.studentFeesId || i}
                                      className="bg-white"
                                    >
                                      <TableCell className="text-sm">
                                        {fee.feesTypeName || 'N/A'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {formatNumber(fee.amount || 0)}
                                      </TableCell>
                                      <TableCell className="text-sm text-green-600">
                                        {formatNumber(fee.paidAmount || 0)}
                                      </TableCell>
                                      <TableCell className="text-sm text-red-500">
                                        {formatNumber(fee.remainingAmount || 0)}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {fee.dueDate
                                          ? formatDate(new Date(fee.dueDate))
                                          : '-'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            fee.status === 'Paid'
                                              ? 'bg-green-100 text-green-700'
                                              : fee.status === 'Partial'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-600'
                                          }`}
                                        >
                                          {fee.status || 'N/A'}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
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
    </div>
  )
}

export default StudentReport
