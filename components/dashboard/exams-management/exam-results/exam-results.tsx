'use client'

import React from 'react'
import type { ReactElement } from 'react'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
  useGetDivisions,
  useGetExamGroups,
  useGetClasses,
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
import { saveAs } from 'file-saver'
import ExcelFileInput from '@/utils/excel-file-input'
import { useReactToPrint } from 'react-to-print'
import { StudentWiseEntryModeFields } from './student-wise-entry-mode-fields'
import { SubjectWiseEntryModeFields } from './subject-wise-entry-mode-fields'
import { SingleEntryModeFields } from './single-entry-mode-fields'
import ReportCard from './report-card'
import SubjectReportCard from './subject-report-card'
import { toast } from '@/hooks/use-toast'

// ── helper ────────────────────────────────────────────────────────────────────
function columnIndexToLetter(col: number): string {
  let letter = ''
  while (col > 0) {
    const remainder = (col - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    col = Math.floor((col - 1) / 26)
  }
  return letter
}

// ── Column definitions ────────────────────────────────────────────────────────
const EXAM_RESULT_COLUMNS = [
  { header: 'Session', key: 'sessionId', width: 30, required: true }, // A 1
  { header: 'Exam Group', key: 'examGroupsId', width: 30, required: true }, // B 2
  { header: 'Division', key: 'divisionId', width: 30, required: true }, // C 3
  { header: 'Class', key: 'classId', width: 30, required: true }, // D 4
  { header: 'Student', key: 'studentId', width: 30, required: true }, // E 5
  { header: 'Exam Subject', key: 'examSubjectId', width: 30, required: true }, // F 6
  { header: 'Gained Marks', key: 'gainedMarks', width: 14, required: true }, // G 7
]

type StudentResultEntry = {
  examSubjectId: number | null
  gainedMarks: number
}

const ExamResults = (): ReactElement => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: examResults } = useGetExamResults()
  console.log('🚀 ~ ExamResults ~ examResults:', examResults)
  const { data: sessions } = useGetSessions()
  const { data: examGroups } = useGetExamGroups()
  const { data: students } = useGetAllStudents()
  const { data: divisions } = useGetDivisions()
  const { data: classes } = useGetClasses()
  const { data: subjects } = useGetExamSubjects()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
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
  const [entryMode, setEntryMode] = useState<
    'single' | 'student-wise' | 'subject-wise'
  >('single')

  const [formData, setFormData] = useState<CreateExamResultsType>({
    sessionId: null,
    examGroupsId: null,
    studentId: null,
    examSubjectId: null,
    divisionId: 0,
    classId: null,
    gainedMarks: 0,
    createdBy: userData?.userId || 0,
    updatedBy: null,
  })

  const filteredSubjectsByDivision = useMemo(() => {
    if (!subjects?.data || !formData.divisionId) return []
    return subjects.data.filter(
      (subject: any) => subject.divisionId === formData.divisionId
    )
  }, [subjects?.data, formData.divisionId])

  const [studentWiseResults, setStudentWiseResults] = useState<
    StudentResultEntry[]
  >([])
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
    divisionName: string
    className: string
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
        (s: any) => s.studentDetails.studentId === Number(value)
      )
      if (selectedStudent) {
        setFormData((prev) => ({
          ...prev,
          studentId: value ? Number(value) : null,
          divisionId: selectedStudent.studentDetails.divisionId || 0,
          sessionId: selectedStudent.studentDetails.sessionId || null,
          classId: selectedStudent.studentDetails.classId || null,
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
      divisionId: 0,
      classId: null,
      gainedMarks: 0,
      createdBy: userData?.userId || 0,
      updatedBy: null,
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
        result.className?.toLowerCase().includes(searchLower) ||
        result.examSubjectName?.toLowerCase().includes(searchLower)
      )
    })
  }, [examResults?.data, searchTerm])

  const groupedExamResults = useMemo(() => {
    if (groupingMode === 'student') {
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
              divisionName: string
              className: string
              results: GetExamResultsType[]
            }
          >
          latestCreatedAt: Date
        }
      >()

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
            studentName: result.studentName || 'N/A',
            divisionName: result.divisionName || 'N/A',
            className: result.className || 'N/A',
            results: [],
          })
        }
        parentGroup.studentGroups.get(studentKey)!.results.push(result)
        if (result.createdAt) {
          const resultDate = new Date(result.createdAt)
          if (resultDate > parentGroup.latestCreatedAt) {
            parentGroup.latestCreatedAt = resultDate
          }
        }
      })

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
              divisionName: string
              className: string
              results: GetExamResultsType[]
            }
          >
          latestCreatedAt: Date
        }
      >()

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
            subjectName: result.examSubjectName || 'N/A',
            divisionName: result.divisionName || 'N/A',
            className: result.className || 'N/A',
            results: [],
          })
        }
        parentGroup.subjectGroups.get(subjectId)!.results.push(result)
        if (result.createdAt) {
          const resultDate = new Date(result.createdAt)
          if (resultDate > parentGroup.latestCreatedAt) {
            parentGroup.latestCreatedAt = resultDate
          }
        }
      })

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
      if (!formData.sessionId) {
        setError('Please select a session')
        return
      }
      if (!formData.divisionId) {
        setError('Please select a division')
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
            data: { ...formData, updatedBy: userData?.userId || 0 },
          })
        } else {
          addMutation.mutate(formData)
        }
      } catch (err) {
        setError('Failed to save exam result')
        console.error(err)
      }
    } else if (entryMode === 'student-wise') {
      if (!formData.studentId) {
        setError('Please select a student')
        return
      }
      if (!formData.sessionId) {
        setError('Session not found for selected student')
        return
      }
      if (!formData.divisionId) {
        setError('Division not found for selected student')
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
            divisionId: formData.divisionId,
            classId: formData.classId,
            studentId: formData.studentId,
            examSubjectId: entry.examSubjectId,
            gainedMarks: entry.gainedMarks,
            createdBy: userData?.userId || 0,
            updatedBy: null,
          }
          return addMutation.mutateAsync(resultData)
        })
        await Promise.all(promises)
        resetForm()
      } catch (err) {
        setError('Failed to save student results')
        console.error(err)
      }
    } else if (entryMode === 'subject-wise') {
      if (!formData.divisionId) {
        setError('Please select a division')
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
            divisionId: formData.divisionId,
            classId: formData.classId,
            studentId: entry.studentId,
            examSubjectId: formData.examSubjectId,
            gainedMarks: entry.gainedMarks,
            createdBy: userData?.userId || 0,
            updatedBy: null,
          }
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
      divisionId: result.divisionId ?? 0,
      classId: result.classId ?? null,
      gainedMarks: result.gainedMarks,
      createdBy: result.createdBy,
      updatedBy: userData?.userId || 0,
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
        examGroupsId: group.examGroupId,
        examGroupName: group.examGroupName,
        sessionName: group.sessionName,
        divisionName: group.divisionName,
        className: group.className,
        results: group.results,
      })
    } else {
      setSelectedGroupForPrint({
        type: 'subject',
        subjectName: group.subjectName,
        examGroupsId: group.examGroupId,
        examGroupName: group.examGroupName,
        sessionName: group.sessionName,
        divisionName: group.divisionName,
        className: group.className,
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
      if (newSet.has(groupKey)) newSet.delete(groupKey)
      else newSet.add(groupKey)
      return newSet
    })
  }

  const toggleChildGroupExpanded = (groupKey: string) => {
    setExpandedChildGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) newSet.delete(groupKey)
      else newSet.add(groupKey)
      return newSet
    })
  }

  // ── Download Template ──────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const excelJsMod = await import('exceljs')
    const ExcelJS = excelJsMod.default ?? excelJsMod
    const workbook = new ExcelJS.Workbook()

    // ── 1. Build flat label arrays ───────────────────────────────────────────

    const sessionLabels: string[] = (sessions?.data ?? []).map(
      (s: any) => `${s.sessionName ?? 'Unnamed'} | ${s.sessionId}`
    )

    const examGroupLabels: string[] = (examGroups?.data ?? []).map(
      (g: any) => `${g.examGroupName ?? 'Unnamed'} | ${g.examGroupsId}`
    )

    const divisionLabels: string[] = (divisions?.data ?? []).map(
      (d: any) => `${d.divisionName ?? 'Unnamed'} | ${d.divisionId}`
    )

    // "First Last | studentId | divisionId"
    const studentLabels: string[] = (students?.data ?? []).map((s: any) => {
      const det = s.studentDetails ?? s
      const name =
        `${det.firstName ?? ''} ${det.lastName ?? ''}`.trim() || 'Unnamed'
      return `${name} | ${det.studentId} | ${det.divisionId ?? ''}`
    })

    // "Subject Name | examSubjectId | divisionId"
    // Try all common field name variants the API might return
    const subjectLabels: string[] = (subjects?.data ?? []).map((sub: any) => {
      const name =
        sub.examSubjectName ?? sub.subjectName ?? sub.name ?? 'Unnamed'
      const id = sub.examSubjectId ?? sub.subjectId ?? sub.id ?? ''
      const div = sub.divisionId ?? ''
      return `${name} | ${id} | ${div}`
    })

    const classLabels: string[] = (classes?.data ?? []).map(
      (c: any) =>
        `${c.classData?.className ?? 'Unnamed'} | ${c.classData?.classId ?? ''}`
    )

    // ── 2. Hidden Lookup sheet ───────────────────────────────────────────────
    const lookupSheet = workbook.addWorksheet('Lookup')
    lookupSheet.state = 'veryHidden'

    // Col A – sessions
    sessionLabels.forEach((label, i) => {
      lookupSheet.getCell(`A${i + 1}`).value = label
    })
    if (sessionLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$A$1:$A$${sessionLabels.length}`,
        'SessionList'
      )
    }

    // Col B – exam groups
    examGroupLabels.forEach((label, i) => {
      lookupSheet.getCell(`B${i + 1}`).value = label
    })
    if (examGroupLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$B$1:$B$${examGroupLabels.length}`,
        'ExamGroupList'
      )
    }

    // Col C – divisions
    divisionLabels.forEach((label, i) => {
      lookupSheet.getCell(`C${i + 1}`).value = label
    })
    if (divisionLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$C$1:$C$${divisionLabels.length}`,
        'DivisionList'
      )
    }

    // Col D – classes
    classLabels.forEach((label, i) => {
      lookupSheet.getCell(`D${i + 1}`).value = label
    })
    if (classLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$D$1:$D$${classLabels.length}`,
        'ClassList'
      )
    }

    // Col E – students
    studentLabels.forEach((label, i) => {
      lookupSheet.getCell(`E${i + 1}`).value = label
    })
    if (studentLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$E$1:$E$${studentLabels.length}`,
        'StudentList'
      )
    }

    // Col F – subjects
    subjectLabels.forEach((label, i) => {
      lookupSheet.getCell(`F${i + 1}`).value = label
    })
    if (subjectLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$F$1:$F$${subjectLabels.length}`,
        'SubjectList'
      )
    }

    // ── 3. Main "Exam Results" sheet ─────────────────────────────────────────
    const sheet = workbook.addWorksheet('Exam Results')

    sheet.columns = EXAM_RESULT_COLUMNS.map(({ header, key, width }) => ({
      header,
      key,
      width,
    }))

    // ── 4. Style header row ──────────────────────────────────────────────────
    const headerRow = sheet.getRow(1)

    EXAM_RESULT_COLUMNS.forEach(({ header, required }, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = required
        ? {
            richText: [
              {
                text: header,
                font: { bold: true, color: { argb: 'FF000000' } },
              },
              { text: ' *', font: { bold: true, color: { argb: 'FFDC2626' } } },
            ],
          }
        : {
            richText: [
              {
                text: header,
                font: { bold: true, color: { argb: 'FF000000' } },
              },
            ],
          }
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
    headerRow.height = 36

    // ── 5. Hint / sub-header row ─────────────────────────────────────────────
    const hintRow = sheet.getRow(2)

    const hints: Record<string, string> = {
      sessionId: 'e.g. 2024-25 | 3',
      examGroupsId: 'e.g. Mid-Term | 7',
      divisionId: 'e.g. Science | 2',
      classId: 'e.g. Class 10 | 1',
      studentId: 'e.g. Alice Smith | 101 | 2',
      examSubjectId: 'e.g. Mathematics | 5 | 2',
      gainedMarks: 'Numeric value',
    }

    EXAM_RESULT_COLUMNS.forEach(({ key }, idx) => {
      const cell = hintRow.getCell(idx + 1)
      cell.value = hints[key] ?? ''
      cell.font = { italic: true, size: 8, color: { argb: 'FF6B7280' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF9C3' },
      }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    hintRow.height = 14

    // ── 6. Column letters for data-validation ────────────────────────────────
    const sessionColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'sessionId') + 1
    ) // A
    const examGroupColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'examGroupsId') + 1
    ) // B
    const divisionColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'divisionId') + 1
    ) // C
    const classColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'classId') + 1
    ) // D
    const studentColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'studentId') + 1
    ) // E
    const examSubjectColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'examSubjectId') + 1
    ) // F
    const gainedMarksColLetter = columnIndexToLetter(
      EXAM_RESULT_COLUMNS.findIndex((c) => c.key === 'gainedMarks') + 1
    ) // G

    // ── 7. Per-row dropdowns (data rows start at 3) ──────────────────────────
    for (let row = 3; row <= 201; row++) {
      sheet.getCell(`${sessionColLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Session',
        error: 'Please select a session from the dropdown.',
        formulae: ['SessionList'],
      }

      sheet.getCell(`${examGroupColLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Exam Group',
        error: 'Please select an exam group from the dropdown.',
        formulae: ['ExamGroupList'],
      }

      sheet.getCell(`${divisionColLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Division',
        error: 'Please select a division from the dropdown.',
        formulae: ['DivisionList'],
      }

      sheet.getCell(`${classColLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Class',
        error: 'Please select a class from the dropdown.',
        formulae: ['ClassList'],
      }

      sheet.getCell(`${studentColLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Student',
        error: 'Please select a student from the dropdown.',
        formulae: ['StudentList'],
      }

      sheet.getCell(`${examSubjectColLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Exam Subject',
        error: 'Please select an exam subject from the dropdown.',
        formulae: ['SubjectList'],
      }

      sheet.getCell(`${gainedMarksColLetter}${row}`).dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Marks',
        error: 'Please enter a whole number >= 0.',
        formulae: [0],
      }
    }

    // ── 8. Freeze top 2 rows + col A ─────────────────────────────────────────
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }]

    // ── 9. Write & download ───────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'exam-results-template.xlsx')
  }

  // ── Parse & submit Excel data ──────────────────────────────────────────────
  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  const handleExcelSubmit = async (data: any[]) => {
    try {
      const normalizeKey = (k: string) => k.trim().replace(/\s*\*$/, '')

      const lastId = (label: string): number | null => {
        const parts = label.split(' | ')
        const id = Number(parts[parts.length - 1])
        return isNaN(id) ? null : id
      }

      const secondToLastId = (label: string): number | null => {
        const parts = label.split(' | ')
        if (parts.length < 2) return null
        const id = Number(parts[parts.length - 2])
        return isNaN(id) ? null : id
      }

      const validRows = data.filter((row) => {
        const keys = Object.keys(row).filter((k) => k !== '__EMPTY')
        if (keys.length === 0) return false

        const allHint = keys.every((k) =>
          String(row[k] ?? '')
            .trim()
            .startsWith('e.g.')
        )
        if (allHint) return false

        const sessionKey = keys.find((k) => normalizeKey(k) === 'Session')
        return sessionKey && String(row[sessionKey] ?? '').trim() !== ''
      })

      const resultsToCreate = validRows.map((row) => {
        const keys = Object.keys(row).filter((k) => k !== '__EMPTY')

        const get = (colHeader: string): any => {
          const key = keys.find((k) => normalizeKey(k) === colHeader.trim())
          return key ? row[key] : undefined
        }

        const sessionId = lastId(String(get('Session') ?? ''))
        const examGroupsId = lastId(String(get('Exam Group') ?? ''))
        const divisionId = lastId(String(get('Division') ?? ''))
        const classId = lastId(String(get('Class') ?? ''))
        const studentId = secondToLastId(String(get('Student') ?? ''))
        const examSubjectId = secondToLastId(String(get('Exam Subject') ?? ''))
        const gainedMarks = Number(get('Gained Marks') ?? 0)

        return {
          sessionId: sessionId ?? null,
          examGroupsId: examGroupsId ?? null,
          divisionId: divisionId ?? 0,
          classId: classId ?? null,
          studentId: studentId ?? null,
          examSubjectId: examSubjectId ?? null,
          gainedMarks: isNaN(gainedMarks) ? 0 : gainedMarks,
          createdBy: userData?.userId ?? 0,
          updatedBy: null,
        } as CreateExamResultsType
      })

      console.log('Exam results to create from Excel:', resultsToCreate)

      for (const resultData of resultsToCreate) {
        await addMutation.mutateAsync(resultData)
      }

      setIsImportPopupOpen(false)
      toast({
        title: 'Success!',
        description: `${resultsToCreate.length} exam result(s) imported successfully.`,
      })
    } catch (error) {
      console.error('Error importing exam results:', error)
      toast({
        title: 'Error',
        description:
          'Failed to import exam results. Please check the data and try again.',
        variant: 'destructive',
      })
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
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() =>
            setGroupingMode(groupingMode === 'student' ? 'subject' : 'student')
          }
        >
          <ArrowUpDown className="h-4 w-4" />
          {groupingMode === 'student' ? 'Group by Subject' : 'Group by Student'}
        </Button>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-4 w-4" />
          Download Template
        </Button>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => setIsImportPopupOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
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
                  {/* Parent Group Header */}
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

                  {/* Child Groups */}
                  {isParentExpanded && (
                    <div className="bg-white p-4 space-y-3">
                      {groupingMode === 'student'
                        ? parentGroup.studentGroups?.map(
                            (studentGroup: any) => {
                              const childKey = `${parentKey}-${studentGroup.studentId}`
                              const isChildExpanded =
                                expandedChildGroups.has(childKey)
                              return (
                                <div
                                  key={childKey}
                                  className="rounded-lg border border-gray-300 overflow-hidden"
                                >
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
                                            <span>Division:</span>
                                            <span className="font-medium">
                                              {studentGroup.divisionName}
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
                                          examGroupId: parentGroup.examGroupId,
                                          examGroupName:
                                            parentGroup.examGroupName,
                                          sessionName: parentGroup.sessionName,
                                          divisionName:
                                            studentGroup.divisionName,
                                          className: studentGroup.className,
                                          results: studentGroup.results,
                                        })
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </div>

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
                        : parentGroup.subjectGroups?.map(
                            (subjectGroup: any) => {
                              const childKey = `${parentKey}-${subjectGroup.examSubjectId}`
                              const isChildExpanded =
                                expandedChildGroups.has(childKey)
                              return (
                                <div
                                  key={childKey}
                                  className="rounded-lg border border-gray-300 overflow-hidden"
                                >
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
                                            <span>Division:</span>
                                            <span className="font-medium">
                                              {subjectGroup.divisionName}
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
                                          examGroupId: parentGroup.examGroupId,
                                          examGroupName:
                                            parentGroup.examGroupName,
                                          sessionName: parentGroup.sessionName,
                                          divisionName:
                                            subjectGroup.divisionName,
                                          className: subjectGroup.className,
                                          results: subjectGroup.results,
                                        })
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </div>

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

      {/* Add/Edit Popup */}
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
          {entryMode === 'student-wise' && (
            <StudentWiseEntryModeFields
              formData={formData}
              handleSelectChange={handleSelectChange}
              studentWiseResults={studentWiseResults}
              setStudentWiseResults={setStudentWiseResults}
              students={students}
              sessions={sessions}
              divisions={divisions}
              classes={classes}
              examGroups={examGroups}
              filteredSubjectsByDivision={filteredSubjectsByDivision}
              examResults={examResults}
            />
          )}

          {entryMode === 'subject-wise' && (
            <SubjectWiseEntryModeFields
              formData={formData}
              handleSelectChange={handleSelectChange}
              subjectWiseStudents={subjectWiseStudents}
              setSubjectWiseStudents={setSubjectWiseStudents}
              students={students}
              sessions={sessions}
              divisions={divisions}
              examGroups={examGroups}
              filteredSubjectsByDivision={filteredSubjectsByDivision}
              examResults={examResults}
            />
          )}

          {entryMode === 'single' && (
            <SingleEntryModeFields
              formData={formData}
              handleSelectChange={handleSelectChange}
              handleInputChange={handleInputChange}
              students={students}
              sessions={sessions}
              divisions={divisions}
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

      {/* Bulk Import Popup */}
      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        title="Import Exam Results from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-amber-50 rounded-md text-sm text-gray-700 space-y-1">
            <p className="font-semibold">How to use:</p>
            <p>
              1. Click <strong>Download Template</strong> to get the Excel file
              with dropdowns pre-filled from your data.
            </p>
            <p>
              2. Select values from the dropdown cells — each column shows a
              human-readable label (e.g. <em>Alice Smith | 101 | 2</em>); IDs
              are extracted automatically on import.
            </p>
            <p>
              3. Enter a numeric value in the <strong>Gained Marks</strong>{' '}
              column for each row.
            </p>
            <p>
              4. Fields marked with a red{' '}
              <span className="text-red-500 font-bold">*</span> in the template
              are required.
            </p>
            <p className="text-xs text-gray-500 pt-1">
              All foreign-key columns (Session, Exam Group, Division, Student,
              Exam Subject) use human-readable labels; IDs are extracted
              automatically on import.
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

      {/* Print Reference */}
      <div style={{ display: 'none' }}>
        <div ref={contentRef}>
          {selectedGroupForPrint?.type === 'student' && (
            <ReportCard
              studentName={selectedGroupForPrint.studentName || ''}
              divisionName={selectedGroupForPrint.divisionName}
              className={selectedGroupForPrint.className}
              examGroupName={selectedGroupForPrint.examGroupName}
              results={selectedGroupForPrint.results}
              sessionName={selectedGroupForPrint.sessionName}
            />
          )}
          {selectedGroupForPrint?.type === 'subject' && (
            <SubjectReportCard
              subjectName={selectedGroupForPrint.subjectName || ''}
              divisionName={selectedGroupForPrint.divisionName}
              className={selectedGroupForPrint.className}
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
