'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ArrowUpDown, Search, FileText, Edit2, Trash2, Download, Upload } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateExamResultsType, GetExamResultsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddExamResult,
  useGetExamResults,
  useUpdateExamResult,
  useDeleteExamResult,
  useGetSessions,
  useGetExams,
  useGetAllStudents,
  useGetExamSubjects,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelFileInput from '@/utils/excel-file-input'

const ExamResults = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: examResults } = useGetExamResults()
  const { data: sessions } = useGetSessions()
  const { data: exams } = useGetExams()
  const { data: students } = useGetAllStudents()
  console.log("🚀 ~ ExamResults ~ students:", students)
  const { data: subjects } = useGetExamSubjects()

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetExamResultsType>('studentName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingExamResultId, setEditingExamResultId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingExamResultId, setDeletingExamResultId] = useState<number | null>(null)

  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false)

  const [formData, setFormData] = useState<CreateExamResultsType>({
    sessionId: null,
    examId: null,
    studentId: null,
    examSubjectId: null,
    gainedMarks: 0,
    createdBy: userData?.userId || 0,
    updatedBy: null,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'gainedMarks' ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? Number(value) : null,
    }))
  }

  const resetForm = () => {
    setFormData({
      sessionId: null,
      examId: null,
      studentId: null,
      examSubjectId: null,
      gainedMarks: 0,
      createdBy: userData?.userId || 0,
      updatedBy: null,
    })
    setEditingExamResultId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddExamResult({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateExamResult({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteExamResult({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetExamResultsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredExamResults = useMemo(() => {
    if (!examResults?.data) return []
    return examResults.data.filter((result: GetExamResultsType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        result.studentName?.toLowerCase().includes(searchLower) ||
        result.examName?.toLowerCase().includes(searchLower) ||
        result.sessionName?.toLowerCase().includes(searchLower) ||
        result.examSubjectName?.toLowerCase().includes(searchLower)
      )
    })
  }, [examResults?.data, searchTerm])

  const sortedExamResults = useMemo(() => {
    return [...filteredExamResults].sort((a, b) => {
      const aValue = a[sortColumn] ?? ''
      const bValue = b[sortColumn] ?? ''

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
  }, [filteredExamResults, sortColumn, sortDirection])

  const paginatedExamResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedExamResults.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedExamResults, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedExamResults.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.gainedMarks < 0) {
      setError('Please enter valid gained marks')
      return
    }

    try {
      if (isEditMode && editingExamResultId) {
        updateMutation.mutate({
          id: editingExamResultId,
          data: {
            ...formData,
            updatedBy: userData?.userId || 0,
          },
        })
      } else {
        addMutation.mutate(formData)
      }
    } catch (err) {
      setError('Failed to save exam result')
      console.error(err)
    }
  }

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving exam result')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (result: GetExamResultsType) => {
    setFormData({
      sessionId: result.sessionId ?? null,
      examId: result.examId ?? null,
      studentId: result.studentId ?? null,
      examSubjectId: result.examSubjectId ?? null,
      gainedMarks: result.gainedMarks,
      createdBy: result.createdBy,
      updatedBy: userData?.userId || 0,
    })
    setEditingExamResultId(result.examResultId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (examResultId: number) => {
    setDeletingExamResultId(examResultId)
    setIsDeleteDialogOpen(true)
  }

  // Export to Excel function with IDs
  const exportToExcel = () => {
    if (!sortedExamResults || sortedExamResults.length === 0) {
      alert('No data to export')
      return
    }

    // Prepare data for export with IDs
    const flatData = sortedExamResults.map((result) => ({
      'Session Id': result.sessionId || '',
      'Exam Id': result.examId || '',
      'Student Id': result.studentId || '',
      'Exam Subject Id': result.examSubjectId || '',
      'Gained Marks': result.gainedMarks || 0,
      // Optional: Include names for reference
      'Session Name': result.sessionName || '',
      'Exam Name': result.examName || '',
      'Student Name': result.studentName || '',
      'Subject Name': result.examSubjectName || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const fileName = `exam-results-export-${timestamp}.xlsx`

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, fileName)
  }

  // Handle parsed Excel data
  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  // Handle Excel data submission - using IDs directly
  const handleExcelSubmit = async (data: any[]) => {
    try {
      // Process each row and create exam results
      const promises = data.map(async (row) => {
        const examResultData: CreateExamResultsType = {
          sessionId: row['Session Id'] ? Number(row['Session Id']) : null,
          examId: row['Exam Id'] ? Number(row['Exam Id']) : null,
          studentId: row['Student Id'] ? Number(row['Student Id']) : null,
          examSubjectId: row['Exam Subject Id'] ? Number(row['Exam Subject Id']) : null,
          gainedMarks: row['Gained Marks'] ? Number(row['Gained Marks']) : 0,
          createdBy: userData?.userId || 0,
          updatedBy: null,
        }

        return addMutation.mutateAsync(examResultData)
      })

      await Promise.all(promises)
      setIsImportPopupOpen(false)
    } catch (error) {
      console.error('Error importing exam results:', error)
      throw error
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <FileText className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Exam Results</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search exam results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsImportPopupOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportToExcel}
            disabled={!sortedExamResults || sortedExamResults.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={() => {
              resetForm()
              setIsPopupOpen(true)
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead
                onClick={() => handleSort('studentName')}
                className="cursor-pointer"
              >
                Student Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('examName')}
                className="cursor-pointer"
              >
                Exam Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('sessionName')}
                className="cursor-pointer"
              >
                Session <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('examSubjectName')}
                className="cursor-pointer"
              >
                Subject <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('gainedMarks')}
                className="cursor-pointer"
              >
                Gained Marks <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!examResults?.data ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading exam results...
                </TableCell>
              </TableRow>
            ) : examResults.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No exam results found
                </TableCell>
              </TableRow>
            ) : paginatedExamResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No exam results match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedExamResults.map((result) => (
                <TableRow key={result.examResultId}>
                  <TableCell className="capitalize">
                    {result.studentName || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {result.examName || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {result.sessionName || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {result.examSubjectName || '-'}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {result.gainedMarks}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(result)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          handleDeleteClick(result.examResultId || 0)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sortedExamResults.length > 0 && (
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

      {/* Add/Edit Exam Result Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={resetForm}
        title={isEditMode ? 'Edit Exam Result' : 'Add Exam Result'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Session */}
            <div className="space-y-2">
              <Label htmlFor="sessionId">Session</Label>
              <CustomCombobox
                items={
                  sessions?.data?.map((session) => ({
                    id: session?.sessionId?.toString() || '0',
                    name: session.sessionName || 'Unnamed session',
                  })) || []
                }
                value={
                  formData.sessionId
                    ? {
                        id: formData.sessionId.toString(),
                        name:
                          sessions?.data?.find(
                            (s) => s.sessionId === formData.sessionId
                          )?.sessionName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('sessionId', value ? String(value.id) : '')
                }
                placeholder="Select session"
              />
            </div>

            {/* Exam */}
            <div className="space-y-2">
              <Label htmlFor="examId">Exam</Label>
              <CustomCombobox
                items={
                  exams?.data?.map((exam) => ({
                    id: exam?.examId?.toString() || '0',
                    name: exam.examName || 'Unnamed exam',
                  })) || []
                }
                value={
                  formData.examId
                    ? {
                        id: formData.examId.toString(),
                        name:
                          exams?.data?.find((e) => e.examId === formData.examId)
                            ?.examName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('examId', value ? String(value.id) : '')
                }
                placeholder="Select exam"
              />
            </div>

            {/* Student */}
            <div className="space-y-2">
              <Label htmlFor="studentId">Student</Label>
              <CustomCombobox
                items={
                  students?.data?.map((student) => ({
                    id: student?.studentDetails?.studentId?.toString() || '0',
                    name: (`${student.studentDetails.firstName} ${student.studentDetails.lastName}`) || 'Unnamed student',
                  })) || []
                }
                value={
                  formData.studentId
                    ? {
                        id: formData.studentId.toString(),
                        name:
                          students?.data?.find(
                            (s) => s.studentDetails.studentId === formData.studentId
                          )?.studentDetails.firstName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('studentId', value ? String(value.id) : '')
                }
                placeholder="Select student"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="examSubjectId">Subject</Label>
              <CustomCombobox
                items={
                  subjects?.data?.map((subject) => ({
                    id: subject?.examSubjectId?.toString() || '0',
                    name: subject.subjectName || 'Unnamed subject',
                  })) || []
                }
                value={
                  formData.examSubjectId
                    ? {
                        id: formData.examSubjectId.toString(),
                        name:
                          subjects?.data?.find(
                            (s) => s.examSubjectId === formData.examSubjectId
                          )?.subjectName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'examSubjectId',
                    value ? String(value.id) : ''
                  )
                }
                placeholder="Select subject"
              />
            </div>

            {/* Gained Marks */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gainedMarks">
                Gained Marks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gainedMarks"
                name="gainedMarks"
                type="number"
                min="0"
                step="0.01"
                value={formData.gainedMarks}
                onChange={handleInputChange}
                placeholder="Enter gained marks"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Import Popup */}
      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        title="Import Exam Results from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-amber-50 rounded-md">
            <h3 className="font-semibold mb-2">Excel Format Requirements:</h3>
            <p className="text-sm text-gray-700 mb-2">
              Your Excel file should have the following columns with numeric IDs:
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li><strong>Session Id</strong> (Optional) - Numeric ID</li>
              <li><strong>Exam Id</strong> (Optional) - Numeric ID</li>
              <li><strong>Student Id</strong> (Optional) - Numeric ID</li>
              <li><strong>Exam Subject Id</strong> (Optional) - Numeric ID</li>
              <li><strong>Gained Marks</strong> (Required) - Numeric value</li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              <strong>Tip:</strong> Export your current data first to see the correct format and IDs!
            </p>
          </div>
          <ExcelFileInput
            onDataParsed={handleExcelDataParsed}
            onSubmit={handleExcelSubmit}
            submitButtonText="Import Exam Results"
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
            <AlertDialogTitle>Delete Exam Result</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam result? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExamResultId) {
                  deleteMutation.mutate({ id: deletingExamResultId })
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

export default ExamResults