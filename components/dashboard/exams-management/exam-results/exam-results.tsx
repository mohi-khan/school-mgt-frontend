'use client'

import React from 'react'

import type { ReactElement } from 'react'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
import {
  Search,
  FileText,
  Edit2,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Printer,
} from 'lucide-react'
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
  useGetClasses,
  useGetSections,
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
import { useReactToPrint } from 'react-to-print'

const ReportCard = React.forwardRef<
  HTMLDivElement,
  {
    studentName: string
    className: string
    sectionName: string
    examName: string
    sessionName: string
    results: GetExamResultsType[]
  }
>(({ studentName, className, sectionName, examName, results, sessionName }, ref) => {
  return (
    <div
      ref={ref}
      className="w-full max-w-4xl mx-auto bg-white shadow-lg print:shadow-none"
    >
      {/* Header */}
      <div className="border-b-4 border-amber-300 p-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-wide text-center">
          STUDENT REPORT CARD
        </h1>
        <h1 className="text-xl font-bold text-gray-800 tracking-wide text-center">
          {examName}
        </h1>

        {/* Student Info */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-6">
            <div className="flex gap-2 flex-1">
              <span className="text-gray-600">Name:</span>
              <p className="font-semibold border-b border-gray-400 flex-1">
                {studentName}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Date:</span>
              <p className="font-semibold border-b border-gray-400 min-w-[100px]">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex justify-between gap-6">
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
            <div className="flex gap-2 flex-1">
              <span className="text-gray-600">Session:</span>
              <p className="font-semibold border-b border-gray-400 flex-1">
                {sessionName}
              </p>
            </div>
          </div>

          {/* <div className="flex gap-2">
            <span className="text-gray-600">Exam Session:</span>
            <p className="font-semibold border-b border-gray-400 flex-1">
              {sessionName}
            </p>
          </div> */}
        </div>
      </div>

      {/* Grades Table */}
      <div className="p-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-amber-300">
              <th className="border border-gray-300 px-4 py-3 text-left text-black">
                Subject
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                Marks
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr key={result.examResultId}>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                  {result.examSubjectName || '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                  {result.gainedMarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes & Comments */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Notes</p>
            <div className="border border-gray-300 h-20"></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Teacher Comments
            </p>
            <div className="border border-gray-300 h-20"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 px-8 py-6 text-xs text-gray-500">
        <div className="grid grid-cols-3 gap-8 mt-6">
          <div>
            <p className="border-t border-gray-400 pt-2 text-center">
              Class Teacher
            </p>
          </div>
          <div></div>
          <div>
            <p className="border-t border-gray-400 pt-2 text-center">
              Principal
            </p>
          </div>
        </div>

        <p className="text-center mt-6">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
})

ReportCard.displayName = 'ReportCard'

const ExamResults = (): ReactElement => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: examResults } = useGetExamResults()
  const { data: sessions } = useGetSessions()
  const { data: exams } = useGetExams()
  const { data: students } = useGetAllStudents()
  const { data: classes } = useGetClasses()
  const { data: sections } = useGetSections()
  const { data: subjects } = useGetExamSubjects()

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetExamResultsType>('studentName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingExamResultId, setEditingExamResultId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingExamResultId, setDeletingExamResultId] = useState<
    number | null
  >(null)

  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false)

  const [formData, setFormData] = useState<
    CreateExamResultsType & {
      classId?: number | null
      sectionId?: number | null
    }
  >({
    sessionId: null,
    examId: null,
    studentId: null,
    examSubjectId: null,
    gainedMarks: 0,
    createdBy: userData?.userId || 0,
    updatedBy: null,
    classId: null,
    sectionId: null,
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef })
  const [selectedGroupForPrint, setSelectedGroupForPrint] = useState<{
    studentName: string
    examId: number
    examName: string
    sessionName: string
    results: GetExamResultsType[]
  } | null>(null)

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
    if (name === 'studentId') {
      const selectedStudent = students?.data?.find(
        (s) => s.studentDetails.studentId === Number(value)
      )
      if (selectedStudent) {
        setFormData((prev) => ({
          ...prev,
          [name]: value ? Number(value) : null,
          classId: selectedStudent.studentDetails.classId || null,
          sectionId: selectedStudent.studentDetails.sectionId || null,
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : null,
      }))
    }
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
      classId: null,
      sectionId: null,
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

  const groupedExamResults = useMemo(() => {
    const groups = new Map<
      string,
      {
        studentName: string
        examId: number
        examName: string
        className: string
        sectionName: string
        results: GetExamResultsType[]
      }
    >()

    filteredExamResults.forEach((result) => {
      const groupKey = `${result.studentName}-${result.examId}`
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          studentName: result.studentName || '',
          examId: result.examId || 0,
          examName: result.examName || '',
          className: result.className || '',
          sectionName: result.sectionName || '',
          results: [],
        })
      }
      groups.get(groupKey)!.results.push(result)
    })

    return Array.from(groups.values())
  }, [filteredExamResults])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return groupedExamResults.slice(startIndex, startIndex + itemsPerPage)
  }, [groupedExamResults, currentPage, itemsPerPage])

  const totalPages = Math.ceil(groupedExamResults.length / itemsPerPage)

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
      classId: (result as any)?.classId ?? null,
      sectionId: (result as any)?.sectionId ?? null,
    })
    setEditingExamResultId(result.examResultId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (examResultId: number) => {
    setDeletingExamResultId(examResultId)
    setIsDeleteDialogOpen(true)
  }

  const handlePrintGroup = (group: any) => {
    setSelectedGroupForPrint(group)
    setTimeout(() => {
      reactToPrintFn && reactToPrintFn()
    }, 100)
  }

  const toggleGroupExpanded = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const exportToExcel = () => {
    if (!groupedExamResults || groupedExamResults.length === 0) {
      alert('No data to export')
      return
    }

    const flatData = groupedExamResults.flatMap((group) =>
      group.results.map((result) => ({
        'Student Name': group.studentName || '',
        Class: group.className || '',
        Section: group.sectionName || '',
        'Session Name': result.sessionName || '',
        'Exam Name': group.examName || '',
        'Subject Name': result.examSubjectName || '',
        'Gained Marks': result.gainedMarks || 0,
      }))
    )

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results')

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const fileName = `exam-results-export-${timestamp}.xlsx`

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, fileName)
  }

  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  const handleExcelSubmit = async (data: any[]) => {
    try {
      const promises = data.map(async (row) => {
        const examResultData: CreateExamResultsType & {
          classId?: number | null
          sectionId?: number | null
        } = {
          sessionId: row['Session Id'] ? Number(row['Session Id']) : null,
          examId: row['Exam Id'] ? Number(row['Exam Id']) : null,
          studentId: row['Student Id'] ? Number(row['Student Id']) : null,
          examSubjectId: row['Exam Subject Id']
            ? Number(row['Exam Subject Id'])
            : null,
          gainedMarks: row['Gained Marks'] ? Number(row['Gained Marks']) : 0,
          createdBy: userData?.userId || 0,
          updatedBy: null,
          classId: row['Class Id'] ? Number(row['Class Id']) : null,
          sectionId: row['Section Id'] ? Number(row['Section Id']) : null,
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
            className="gap-2 bg-transparent"
            onClick={() => setIsImportPopupOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={exportToExcel}
            disabled={!groupedExamResults || groupedExamResults.length === 0}
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

      {/* Grouped Table */}
      <div className="space-y-4">
        {!examResults?.data ? (
          <div className="text-center py-8 text-gray-600">
            Loading exam results...
          </div>
        ) : examResults.data.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No exam results found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No exam results match your search
          </div>
        ) : (
          <>
            {paginatedGroups.map((group) => {
              const groupKey = `${group.studentName}-${group.examId}`
              const isExpanded = expandedGroups.has(groupKey)

              return (
                <div
                  key={groupKey}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div
                    className="bg-gradient-to-r bg-slate-50 p-4 flex items-center justify-between cursor-pointer transition-colors"
                    onClick={() => toggleGroupExpanded(groupKey)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button className="p-1 hover:bg-white rounded-md transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-amber-700" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-amber-700" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-base">
                          {group.studentName}
                        </div>
                        <div className="text-sm text-gray-700 space-x-6 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-gray-600">Class:</span>
                            <span className="font-medium">
                              {group.className}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-gray-600">Section:</span>
                            <span className="font-medium">
                              {group.sectionName}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-gray-600">Exam:</span>
                            <span className="font-medium text-amber-700">
                              {group.examName}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border bg-amber-50 text-amber-600 whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrintGroup(group)
                      }}
                    >
                      <Printer className="h-4 w-4" />
                      Download Report
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="bg-white border-t border-gray-200 p-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="text-gray-700 font-semibold">
                              Subject
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold text-right">
                              Gained Marks
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.results.map((result) => (
                            <TableRow
                              key={result.examResultId}
                              className="hover:bg-amber-50"
                            >
                              <TableCell className="capitalize font-medium text-gray-800">
                                {result.examSubjectName || '-'}
                              </TableCell>
                              <TableCell className="font-semibold text-gray-800 text-right text-base">
                                {result.gainedMarks}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => handleEditClick(result)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      handleDeleteClick(
                                        result.examResultId || 0
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {groupedExamResults.length > 0 && (
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
                    name:
                      `${student.studentDetails.firstName} ${student.studentDetails.lastName}` ||
                      'Unnamed student',
                  })) || []
                }
                value={
                  formData.studentId
                    ? {
                        id: formData.studentId.toString(),
                        name:
                          students?.data?.find(
                            (s) =>
                              s.studentDetails.studentId === formData.studentId
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

            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <CustomCombobox
                items={
                  classes?.data?.map((cls) => ({
                    id: cls?.classData.classId?.toString() || '0',
                    name: cls.classData.className || 'Unnamed class',
                  })) || []
                }
                value={
                  formData.classId
                    ? {
                        id: formData.classId.toString(),
                        name:
                          classes?.data?.find(
                            (c) => c.classData.classId === formData.classId
                          )?.classData.className || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('classId', value ? String(value.id) : '')
                }
                placeholder="Auto-selected from student"
                disabled={!!formData.studentId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectionId">Section</Label>
              <CustomCombobox
                items={
                  sections?.data?.map((section) => ({
                    id: section?.sectionId?.toString() || '0',
                    name: section.sectionName || 'Unnamed section',
                  })) || []
                }
                value={
                  formData.sectionId
                    ? {
                        id: formData.sectionId.toString(),
                        name:
                          sections?.data?.find(
                            (s) => s.sectionId === formData.sectionId
                          )?.sectionName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('sectionId', value ? String(value.id) : '')
                }
                placeholder="Auto-selected from student"
                disabled={!!formData.studentId}
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
              Your Excel file should have the following columns with numeric
              IDs:
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>
                <strong>Session Id</strong> - Numeric ID
              </li>
              <li>
                <strong>Exam Id</strong> - Numeric ID
              </li>
              <li>
                <strong>Student Id</strong> - Numeric ID
              </li>
              <li>
                <strong>Class Id</strong> - Numeric ID
              </li>
              <li>
                <strong>Section Id</strong> - Numeric ID
              </li>
              <li>
                <strong>Exam Subject Id</strong> - Numeric ID
              </li>
              <li>
                <strong>Gained Marks</strong> - Numeric value
              </li>
            </ul>
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

      {/* Print Reference for Report Card */}
      <div style={{ display: 'none' }}>
        <div ref={contentRef}>
          {selectedGroupForPrint && (
            <ReportCard
              studentName={selectedGroupForPrint.studentName}
              className={selectedGroupForPrint.results[0]?.className || 'N/A'}
              sectionName={
                selectedGroupForPrint.results[0]?.sectionName || 'N/A'
              }
              examName={selectedGroupForPrint.examName}
              results={selectedGroupForPrint.results}
              sessionName={selectedGroupForPrint.results[0]?.sessionName || 'N/A'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamResults
