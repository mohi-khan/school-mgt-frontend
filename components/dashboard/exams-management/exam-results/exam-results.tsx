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
  Users,
  BookOpen,
  ArrowUpDown,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateExamResultsType, GetExamResultsType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddExamResult,
  useGetExamResults,
  useUpdateExamResult,
  useDeleteExamResult,
  useGetSessions,
  useGetAllStudents,
  useGetExamSubjects,
  useGetClasses,
  useGetSections,
  useGetSectionsByClassId,
  useGetExamGroups,
} from '@/hooks/use-api'
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
import { CustomCombobox } from '@/utils/custom-combobox'
import { StudentWiseEntryModeFields } from './student-wise-entry-mode-fields'
import { SubjectWiseEntryModeFields } from './subject-wise-entry-mode-fields'
import { SingleEntryModeFields } from './single-entry-mode-fields'
import ReportCard from './report-card'
import SubjectReportCard from './subject-report-card'

type StudentResultEntry = {
  examSubjectId: number | null
  gainedMarks: number
}

const ExamResults = (): ReactElement => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: examResults } = useGetExamResults()
  const { data: sessions } = useGetSessions()
  const { data: examGroups } = useGetExamGroups()
  const { data: students } = useGetAllStudents()
  const { data: classes } = useGetClasses()
  const { data: sections } = useGetSections()

  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [searchTerm, setSearchTerm] = useState('')

  // Toggle between student-wise and subject-wise grouping
  const [groupingMode, setGroupingMode] = useState<'student' | 'subject'>(
    'student'
  )
  const [expandedParentGroups, setExpandedParentGroups] = useState<Set<string>>(
    new Set()
  )
  const [expandedChildGroups, setExpandedChildGroups] = useState<Set<string>>(
    new Set()
  )

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

  // Entry mode: 'single', 'student-wise', 'subject-wise'
  const [entryMode, setEntryMode] = useState<
    'single' | 'student-wise' | 'subject-wise'
  >('single')

  const [formData, setFormData] = useState<
    CreateExamResultsType & {
      classId?: number | null
      sectionId?: number | null
    }
  >({
    sessionId: null,
    examGroupsId: null,
    studentId: null,
    examSubjectId: null,
    gainedMarks: 0,
    createdBy: userData?.userId || 0,
    updatedBy: null,
    classId: null,
    sectionId: null,
  })
  // Dynamic sections based on selected class for subject-wise entry
  const { data: sectionsByClass } = useGetSectionsByClassId(
    formData.classId || 0
  )

  const { data: subjects } = useGetExamSubjects()

  // Filtered subjects by classId for student-wise entry
  const filteredSubjectsByClass = useMemo(() => {
    if (!subjects?.data || !formData.classId) return []
    return subjects.data.filter(
      (subject) => subject.classId === formData.classId
    )
  }, [subjects?.data, formData.classId])

  // For student-wise entry
  const [studentWiseResults, setStudentWiseResults] = useState<
    StudentResultEntry[]
  >([])

  // For subject-wise entry
  const [subjectWiseStudents, setSubjectWiseStudents] = useState<
    { studentId: number | null; gainedMarks: number }[]
  >([])

  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef })
  const [selectedGroupForPrint, setSelectedGroupForPrint] = useState<{
    type: 'student' | 'subject'
    studentName?: string
    subjectName?: string
    examGroupsId: number
    examGroupName: string
    sessionName: string
    className: string
    sectionName: string
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
          sessionId: selectedStudent.studentDetails.sessionId || null,
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
      examGroupsId: null,
      studentId: null,
      examSubjectId: null,
      gainedMarks: 0,
      createdBy: userData?.userId || 0,
      updatedBy: null,
      classId: null,
      sectionId: null,
    })
    setStudentWiseResults([])
    setSubjectWiseStudents([])
    setEditingExamResultId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
    setEntryMode('single')
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

  const filteredExamResults = useMemo(() => {
    if (!examResults?.data) return []
    return examResults.data.filter((result: GetExamResultsType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        result.studentName?.toLowerCase().includes(searchLower) ||
        result.examGroupName?.toLowerCase().includes(searchLower) ||
        result.sessionName?.toLowerCase().includes(searchLower) ||
        result.examSubjectName?.toLowerCase().includes(searchLower)
      )
    })
  }, [examResults?.data, searchTerm])

  const groupedExamResults = useMemo(() => {
    if (groupingMode === 'student') {
      // Group by exam group first (parent), then by student (child)
      const parentGroups = new Map<
        string,
        {
          examGroupId: number
          sessionId: number
          examGroupName: string
          sessionName: string
          studentGroups: Map<
            string,
            {
              studentId: number
              studentName: string
              className: string
              sectionName: string
              results: GetExamResultsType[]
            }
          >
          latestCreatedAt: Date
        }
      >()

      // Sort by createdAt (latest first)
      const sortedResults = [...filteredExamResults].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      sortedResults.forEach((result) => {
        const parentKey = `${result.examGroupsId || 0}-${result.sessionId || 0}`

        if (!parentGroups.has(parentKey)) {
          parentGroups.set(parentKey, {
            examGroupId: result.examGroupsId || 0,
            sessionId: result.sessionId || 0,
            examGroupName: result.examGroupName || 'Unassigned',
            sessionName: result.sessionName || 'Unassigned',
            studentGroups: new Map(),
            latestCreatedAt: result.createdAt
              ? new Date(result.createdAt)
              : new Date(0),
          })
        }

        const parentGroup = parentGroups.get(parentKey)!
        const studentKey = `${result.studentId || 0}`

        if (!parentGroup.studentGroups.has(studentKey)) {
          parentGroup.studentGroups.set(studentKey, {
            studentId: result.studentId || 0,
            studentName: result.studentName || 'Unassigned',
            className: result.className || 'Unassigned',
            sectionName: result.sectionName || 'Unassigned',
            results: [],
          })
        }

        parentGroup.studentGroups.get(studentKey)!.results.push(result)

        // Update latest createdAt
        if (result.createdAt) {
          const resultDate = new Date(result.createdAt)
          if (resultDate > parentGroup.latestCreatedAt) {
            parentGroup.latestCreatedAt = resultDate
          }
        }
      })

      // Convert to array and sort by latestCreatedAt (latest first)
      return Array.from(parentGroups.values())
        .map((parentGroup) => ({
          type: 'student' as const,
          ...parentGroup,
          studentGroups: Array.from(parentGroup.studentGroups.values()),
        }))
        .sort(
          (a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime()
        )
    } else {
      // Group by exam group first (parent), then by subject (child)
      const parentGroups = new Map<
        string,
        {
          examGroupId: number
          sessionId: number
          examGroupName: string
          sessionName: string
          subjectGroups: Map<
            number,
            {
              examSubjectId: number
              subjectName: string
              className: string
              sectionName: string
              results: GetExamResultsType[]
            }
          >
          latestCreatedAt: Date
        }
      >()

      // Sort by createdAt (latest first)
      const sortedResults = [...filteredExamResults].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      sortedResults.forEach((result) => {
        const parentKey = `${result.examGroupsId || 0}-${result.sessionId || 0}`

        if (!parentGroups.has(parentKey)) {
          parentGroups.set(parentKey, {
            examGroupId: result.examGroupsId || 0,
            sessionId: result.sessionId || 0,
            examGroupName: result.examGroupName || 'Unassigned',
            sessionName: result.sessionName || 'Unassigned',
            subjectGroups: new Map(),
            latestCreatedAt: result.createdAt
              ? new Date(result.createdAt)
              : new Date(0),
          })
        }

        const parentGroup = parentGroups.get(parentKey)!
        const subjectId = result.examSubjectId || 0

        if (!parentGroup.subjectGroups.has(subjectId)) {
          parentGroup.subjectGroups.set(subjectId, {
            examSubjectId: subjectId,
            subjectName: result.examSubjectName || 'Unassigned',
            className: result.className || 'Unassigned',
            sectionName: result.sectionName || 'Unassigned',
            results: [],
          })
        }

        parentGroup.subjectGroups.get(subjectId)!.results.push(result)

        // Update latest createdAt
        if (result.createdAt) {
          const resultDate = new Date(result.createdAt)
          if (resultDate > parentGroup.latestCreatedAt) {
            parentGroup.latestCreatedAt = resultDate
          }
        }
      })

      // Convert to array and sort by latestCreatedAt (latest first)
      return Array.from(parentGroups.values())
        .map((parentGroup) => ({
          type: 'subject' as const,
          ...parentGroup,
          subjectGroups: Array.from(parentGroup.subjectGroups.values()),
        }))
        .sort(
          (a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime()
        )
    }
  }, [filteredExamResults, groupingMode])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return groupedExamResults.slice(startIndex, startIndex + itemsPerPage)
  }, [groupedExamResults, currentPage, itemsPerPage])

  const totalPages = Math.ceil(groupedExamResults.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (entryMode === 'single') {
      // Single entry mode
      if (!formData.sessionId) {
        setError('Please select a session')
        return
      }
      if (!formData.classId) {
        setError('Please select a class')
        return
      }
      if (!formData.sectionId) {
        setError('Please select a section')
        return
      }
      if (!formData.studentId) {
        setError('Please select a student')
        return
      }
      if (!formData.examGroupsId) {
        setError('Please select an exam group')
        return
      }
      if (!formData.examSubjectId) {
        setError('Please select a subject')
        return
      }
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
    } else if (entryMode === 'student-wise') {
      // Student-wise entry: one student, multiple subjects
      if (!formData.studentId) {
        setError('Please select a student')
        return
      }
      if (!formData.sessionId) {
        setError('Session not found for selected student')
        return
      }
      if (!formData.classId) {
        setError('Class not found for selected student')
        return
      }
      if (!formData.sectionId) {
        setError('Section not found for selected student')
        return
      }
      if (!formData.examGroupsId) {
        setError('Please select an exam group')
        return
      }
      if (studentWiseResults.length === 0) {
        setError('Please add at least one subject result')
        return
      }

      try {
        const promises = studentWiseResults.map((entry) => {
          const resultData: CreateExamResultsType = {
            sessionId: formData.sessionId,
            examGroupsId: formData.examGroupsId,
            classId: formData.classId,
            sectionId: formData.sectionId,
            studentId: formData.studentId,
            examSubjectId: entry.examSubjectId,
            gainedMarks: entry.gainedMarks,
            createdBy: userData?.userId || 0,
            updatedBy: null,
          }
          console.log('[v0] Student-wise result data:', resultData)
          return addMutation.mutateAsync(resultData)
        })

        await Promise.all(promises)
        resetForm()
      } catch (err) {
        setError('Failed to save student results')
        console.error(err)
      }
    } else if (entryMode === 'subject-wise') {
      // Subject-wise entry: one subject, multiple students
      if (!formData.classId) {
        setError('Please select a class')
        return
      }
      if (!formData.sectionId) {
        setError('Please select a section')
        return
      }
      if (!formData.sessionId) {
        setError('Please select a session')
        return
      }
      if (!formData.examGroupsId) {
        setError('Please select an exam group')
        return
      }
      if (!formData.examSubjectId) {
        setError('Please select a subject')
        return
      }
      if (subjectWiseStudents.length === 0) {
        setError('Please add at least one student result')
        return
      }

      try {
        const promises = subjectWiseStudents.map((entry) => {
          const resultData: CreateExamResultsType = {
            sessionId: formData.sessionId,
            examGroupsId: formData.examGroupsId,
            classId: formData.classId,
            sectionId: formData.sectionId,
            studentId: entry.studentId,
            examSubjectId: formData.examSubjectId,
            gainedMarks: entry.gainedMarks,
            createdBy: userData?.userId || 0,
            updatedBy: null,
          }
          console.log('[v0] Subject-wise result data:', resultData)
          return addMutation.mutateAsync(resultData)
        })

        await Promise.all(promises)
        resetForm()
      } catch (err) {
        setError('Failed to save subject results')
        console.error(err)
      }
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
      examGroupsId: result.examGroupsId ?? null,
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
    setEntryMode('single')
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (examResultId: number) => {
    setDeletingExamResultId(examResultId)
    setIsDeleteDialogOpen(true)
  }

  const handlePrintGroup = (group: any) => {
    if (group.type === 'student') {
      setSelectedGroupForPrint({
        type: 'student',
        studentName: group.studentName,
        examGroupsId: group.examGroupsId,
        examGroupName: group.examGroupName,
        sessionName: group.sessionName,
        className: group.className,
        sectionName: group.sectionName,
        results: group.results,
      })
    } else {
      setSelectedGroupForPrint({
        type: 'subject',
        subjectName: group.subjectName,
        examGroupsId: group.examGroupsId,
        examGroupName: group.examGroupName,
        sessionName: group.sessionName,
        className: group.className,
        sectionName: group.sectionName,
        results: group.results,
      })
    }
    setTimeout(() => {
      reactToPrintFn && reactToPrintFn()
    }, 100)
  }

  const toggleParentGroupExpanded = (groupKey: string) => {
    setExpandedParentGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const toggleChildGroupExpanded = (groupKey: string) => {
    setExpandedChildGroups((prev) => {
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

    const flatData = (examResults?.data || []).map((result) => ({
      'Session Id': result.sessionId || '',
      'Exam Group Id': result.examGroupsId || '',
      'Student Id': result.studentId || '',
      'Class Id': result?.classId || '',
      'Section Id': result?.sectionId || '',
      'Exam Subject Id': result.examSubjectId || '',
      'Gained Marks': result.gainedMarks || 0,
      // Optional: Include names for reference
      'Session Name (No need while inserting data)': result.sessionName || '',
      'Exam Name (No need while inserting data)': result.examGroupName || '',
      'Student Name (No need while inserting data)': result.studentName || '',
      'Subject Name (No need while inserting data)':
        result.examSubjectName || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results')

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const fileName = `result-report-${timestamp}.xlsx`

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
          examGroupsId: row['Exam Group Id']
            ? Number(row['Exam Group Id'])
            : null,
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

  // Add subject result entry for student-wise mode
  const addSubjectEntry = () => {
    setStudentWiseResults([
      ...studentWiseResults,
      { examSubjectId: null, gainedMarks: 0 },
    ])
  }

  // Remove subject entry for student-wise mode
  const removeSubjectEntry = (index: number) => {
    setStudentWiseResults(studentWiseResults.filter((_, i) => i !== index))
  }

  // Update subject entry
  const updateSubjectEntry = (
    index: number,
    field: 'examSubjectId' | 'gainedMarks',
    value: number | null
  ) => {
    const updated = [...studentWiseResults]
    updated[index] = { ...updated[index], [field]: value }
    setStudentWiseResults(updated)
  }

  // Add student entry for subject-wise mode
  const addStudentEntry = () => {
    setSubjectWiseStudents([
      ...subjectWiseStudents,
      { studentId: null, gainedMarks: 0 },
    ])
  }

  // Remove student entry for subject-wise mode
  const removeStudentEntry = (index: number) => {
    setSubjectWiseStudents(subjectWiseStudents.filter((_, i) => i !== index))
  }

  // Update student entry
  const updateStudentEntry = (
    index: number,
    field: 'studentId' | 'gainedMarks',
    value: number | null
  ) => {
    const updated = [...subjectWiseStudents]
    updated[index] = { ...updated[index], [field]: value }
    setSubjectWiseStudents(updated)
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
            onClick={() =>
              setGroupingMode(
                groupingMode === 'student' ? 'subject' : 'student'
              )
            }
          >
            <ArrowUpDown className="h-4 w-4" />
            {groupingMode === 'student'
              ? 'Group by Subject'
              : 'Group by Student'}
          </Button>
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
            className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
            onClick={() => {
              resetForm()
              setEntryMode('student-wise')
              setIsPopupOpen(true)
            }}
          >
            <Users className="h-4 w-4" />
            Add Student-wise
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            onClick={() => {
              resetForm()
              setEntryMode('subject-wise')
              setIsPopupOpen(true)
            }}
          >
            <BookOpen className="h-4 w-4" />
            Add Subject-wise
          </Button>
        </div>
      </div>

      {/* Hierarchical Grouped Table */}
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
            {paginatedGroups.map((parentGroup: any) => {
              const parentKey = `${parentGroup.examGroupId}-${parentGroup.sessionId}`
              const isParentExpanded = expandedParentGroups.has(parentKey)

              return (
                <div
                  key={parentKey}
                  className="rounded-lg border-2 border-amber-300 overflow-hidden shadow-md"
                >
                  {/* Parent Group Header (Exam Group + Session) */}
                  <div
                    className="bg-gradient-to-r from-amber-100 to-amber-50 p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleParentGroupExpanded(parentKey)}
                  >
                    <button className="p-1 hover:bg-amber-200 rounded-md transition-colors">
                      {isParentExpanded ? (
                        <ChevronUp className="h-6 w-6 text-amber-700" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-amber-700" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">
                        {parentGroup.examGroupName} ({parentGroup.sessionName})
                      </div>
                      <div className="text-sm text-gray-700 mt-1 flex gap-4">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-600">
                            {groupingMode === 'student'
                              ? 'Students'
                              : 'Subjects'}
                            :
                          </span>
                          <span className="font-medium text-amber-700">
                            {groupingMode === 'student'
                              ? parentGroup.studentGroups?.length || 0
                              : parentGroup.subjectGroups?.length || 0}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-600">Total Results:</span>
                          <span className="font-medium text-amber-700">
                            {groupingMode === 'student'
                              ? parentGroup.studentGroups?.reduce(
                                  (sum: number, sg: any) =>
                                    sum + sg.results.length,
                                  0
                                ) || 0
                              : parentGroup.subjectGroups?.reduce(
                                  (sum: number, sg: any) =>
                                    sum + sg.results.length,
                                  0
                                ) || 0}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Child Groups (Student or Subject) */}
                  {isParentExpanded && (
                    <div className="bg-white p-4 space-y-3">
                      {groupingMode === 'student'
                        ? // Student groups
                          parentGroup.studentGroups?.map(
                            (studentGroup: any) => {
                              const childKey = `${parentKey}-${studentGroup.studentId}`
                              const isChildExpanded =
                                expandedChildGroups.has(childKey)

                              return (
                                <div
                                  key={childKey}
                                  className="rounded-lg border border-gray-300 overflow-hidden"
                                >
                                  {/* Student Group Header */}
                                  <div className="bg-slate-50 p-3 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div
                                      className="flex items-center gap-3 flex-1 cursor-pointer"
                                      onClick={() =>
                                        toggleChildGroupExpanded(childKey)
                                      }
                                    >
                                      <button className="p-1 hover:bg-white rounded-md transition-colors">
                                        {isChildExpanded ? (
                                          <ChevronUp className="h-5 w-5 text-gray-700" />
                                        ) : (
                                          <ChevronDown className="h-5 w-5 text-gray-700" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-800">
                                          {studentGroup.studentName}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-0.5 space-x-4">
                                          <span className="inline-flex items-center gap-1">
                                            <span>Class:</span>
                                            <span className="font-medium">
                                              {studentGroup.className}
                                            </span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <span>Section:</span>
                                            <span className="font-medium">
                                              {studentGroup.sectionName}
                                            </span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <span>Subjects:</span>
                                            <span className="font-medium text-amber-600">
                                              {studentGroup.results.length}
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
                                        handlePrintGroup({
                                          type: 'student',
                                          studentName: studentGroup.studentName,
                                          examGroupsId: parentGroup.examGroupId,
                                          examGroupName:
                                            parentGroup.examGroupName,
                                          sessionName: parentGroup.sessionName,
                                          className: studentGroup.className,
                                          sectionName: studentGroup.sectionName,
                                          results: studentGroup.results,
                                        })
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </div>

                                  {/* Results Table */}
                                  {isChildExpanded && (
                                    <div className="bg-white border-t border-gray-200 p-3">
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
                                          {studentGroup.results.map(
                                            (result: any) => (
                                              <TableRow
                                                key={result.examResultId}
                                                className="hover:bg-amber-50"
                                              >
                                                <TableCell className="capitalize font-medium text-gray-800">
                                                  {result.examSubjectName ||
                                                    '-'}
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
                                                      onClick={() =>
                                                        handleEditClick(result)
                                                      }
                                                    >
                                                      <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                      onClick={() =>
                                                        handleDeleteClick(
                                                          result.examResultId ||
                                                            0
                                                        )
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                          )
                        : // Subject groups
                          parentGroup.subjectGroups?.map(
                            (subjectGroup: any) => {
                              const childKey = `${parentKey}-${subjectGroup.examSubjectId}`
                              const isChildExpanded =
                                expandedChildGroups.has(childKey)

                              return (
                                <div
                                  key={childKey}
                                  className="rounded-lg border border-gray-300 overflow-hidden"
                                >
                                  {/* Subject Group Header */}
                                  <div className="bg-slate-50 p-3 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div
                                      className="flex items-center gap-3 flex-1 cursor-pointer"
                                      onClick={() =>
                                        toggleChildGroupExpanded(childKey)
                                      }
                                    >
                                      <button className="p-1 hover:bg-white rounded-md transition-colors">
                                        {isChildExpanded ? (
                                          <ChevronUp className="h-5 w-5 text-gray-700" />
                                        ) : (
                                          <ChevronDown className="h-5 w-5 text-gray-700" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-800">
                                          {subjectGroup.subjectName}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-0.5 space-x-4">
                                          <span className="inline-flex items-center gap-1">
                                            <span>Class:</span>
                                            <span className="font-medium">
                                              {subjectGroup.className}
                                            </span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <span>Section:</span>
                                            <span className="font-medium">
                                              {subjectGroup.sectionName}
                                            </span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <span>Students:</span>
                                            <span className="font-medium text-amber-600">
                                              {subjectGroup.results.length}
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
                                        handlePrintGroup({
                                          type: 'subject',
                                          subjectName: subjectGroup.subjectName,
                                          examGroupsId: parentGroup.examGroupId,
                                          examGroupName:
                                            parentGroup.examGroupName,
                                          sessionName: parentGroup.sessionName,
                                          className: subjectGroup.className,
                                          sectionName: subjectGroup.sectionName,
                                          results: subjectGroup.results,
                                        })
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </div>

                                  {/* Results Table */}
                                  {isChildExpanded && (
                                    <div className="bg-white border-t border-gray-200 p-3">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                                            <TableHead className="text-gray-700 font-semibold">
                                              Student Name
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
                                          {subjectGroup.results.map(
                                            (result: any) => (
                                              <TableRow
                                                key={result.examResultId}
                                                className="hover:bg-amber-50"
                                              >
                                                <TableCell className="capitalize font-medium text-gray-800">
                                                  {result.studentName || '-'}
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
                                                      onClick={() =>
                                                        handleEditClick(result)
                                                      }
                                                    >
                                                      <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                      onClick={() =>
                                                        handleDeleteClick(
                                                          result.examResultId ||
                                                            0
                                                        )
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                          )}
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
        title={
          isEditMode
            ? 'Edit Exam Result'
            : entryMode === 'student-wise'
              ? 'Add Results for Student (All Subjects)'
              : entryMode === 'subject-wise'
                ? 'Add Results for Subject (All Students)'
                : 'Add Exam Result'
        }
        size="sm:max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Common fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Exam Group */}
            <div className="space-y-2">
              <Label htmlFor="examGroupsId">
                Exam Group <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  examGroups?.data?.map((group) => ({
                    id: group?.examGroupsId?.toString() || '0',
                    name: group.examGroupName || 'Unnamed group',
                  })) || []
                }
                value={
                  formData.examGroupsId
                    ? {
                        id: formData.examGroupsId.toString(),
                        name:
                          examGroups?.data?.find(
                            (g) => g.examGroupsId === formData.examGroupsId
                          )?.examGroupName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'examGroupsId',
                    value ? String(value.id) : ''
                  )
                }
                placeholder="Select exam group"
              />
            </div>
          </div>

          {/* Student-wise entry */}
          {entryMode === 'student-wise' && (
            <StudentWiseEntryModeFields
              formData={formData}
              handleSelectChange={handleSelectChange}
              studentWiseResults={studentWiseResults}
              setStudentWiseResults={setStudentWiseResults} // ← Changed
              students={students}
              sessions={sessions}
              classes={classes}
              sections={sections}
              examGroups={examGroups}
              filteredSubjectsByClass={filteredSubjectsByClass}
              examResults={examResults}
            />
          )}

          {/* Subject-wise entry */}
          {entryMode === 'subject-wise' && (
            <SubjectWiseEntryModeFields
              formData={formData}
              handleSelectChange={handleSelectChange}
              subjectWiseStudents={subjectWiseStudents}
              setSubjectWiseStudents={setSubjectWiseStudents} // ← Changed
              students={students}
              sessions={sessions}
              classes={classes}
              sections={sections}
              examGroups={examGroups}
              sectionsByClass={sectionsByClass}
              filteredSubjectsByClass={filteredSubjectsByClass}
              examResults={examResults}
            />
          )}

          {/* Single entry mode (for editing) */}
          {entryMode === 'single' && (
            <SingleEntryModeFields
              formData={formData}
              handleSelectChange={handleSelectChange}
              handleInputChange={handleInputChange}
              students={students}
              sessions={sessions}
              classes={classes}
              sections={sections}
              examGroups={examGroups}
              subjects={subjects}
            />
          )}

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
                <strong>Exam Group Id</strong> - Numeric ID
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
          {selectedGroupForPrint &&
            selectedGroupForPrint.type === 'student' && (
              <ReportCard
                studentName={selectedGroupForPrint.studentName || ''}
                className={selectedGroupForPrint.className}
                sectionName={selectedGroupForPrint.sectionName}
                examGroupName={selectedGroupForPrint.examGroupName}
                results={selectedGroupForPrint.results}
                sessionName={selectedGroupForPrint.sessionName}
              />
            )}
          {selectedGroupForPrint &&
            selectedGroupForPrint.type === 'subject' && (
              <SubjectReportCard
                subjectName={selectedGroupForPrint.subjectName || ''}
                className={selectedGroupForPrint.className}
                sectionName={selectedGroupForPrint.sectionName}
                examGroupName={selectedGroupForPrint.examGroupName}
                results={selectedGroupForPrint.results}
                sessionName={selectedGroupForPrint.sessionName}
              />
            )}
        </div>
      </div>
    </div>
  )
}

export default ExamResults
