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
import {
  Search,
  BookOpen,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateExamSubjectsType, GetExamSubjectsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { formatDate, formatDateForInput, formatTime } from '@/utils/conversions'
import {
  useAddExamSubject,
  useGetExamSubjects,
  useUpdateExamSubject,
  useDeleteExamSubject,
  useGetClasses,
  useGetSessions,
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
import { CustomCombobox } from '@/utils/custom-combobox'

const ExamSubjects = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: classes } = useGetClasses()
  const { data: examSubjects } = useGetExamSubjects()
  const { data: sessions } = useGetSessions()

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingExamSubjectId, setEditingExamSubjectId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingExamSubjectId, setDeletingExamSubjectId] = useState<
    number | null
  >(null)

  const [isCopyPopupOpen, setIsCopyPopupOpen] = useState(false)
  const [selectedGroupForCopy, setSelectedGroupForCopy] = useState<{
    classId: number
    sessionId: number
    className: string
    sessionName: string
    subjects: GetExamSubjectsType[]
  } | null>(null)
  const [copyFormData, setCopyFormData] = useState<{
    targetSessionId: number | null
    subjects: Array<{
      subjectName: string
      subjectCode: string
      examDate: string
      startTime: string
      duration: number
      examMarks: number
    }>
  }>({
    targetSessionId: null,
    subjects: [],
  })

  const [formData, setFormData] = useState<CreateExamSubjectsType>({
    subjectName: '',
    subjectCode: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    duration: 60,
    examMarks: 100,
    classId: null,
    sessionId: null,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }))
    } else if (type === 'date') {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else if (type === 'time') {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? Number(value) : null,
    }))
  }

  const resetForm = () => {
    setFormData({
      subjectName: '',
      subjectCode: '',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      duration: 60,
      examMarks: 100,
      classId: null,
      sessionId: null,
      createdBy: userData?.userId || 0,
    })
    setEditingExamSubjectId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddExamSubject({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateExamSubject({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteExamSubject({
    onClose: closePopup,
    reset: resetForm,
  })

  const filteredExamSubjects = useMemo(() => {
    if (!examSubjects?.data) return []
    return examSubjects.data.filter((exam: GetExamSubjectsType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        exam.subjectName?.toLowerCase().includes(searchLower) ||
        exam.subjectCode?.toLowerCase().includes(searchLower) ||
        exam.className?.toLowerCase().includes(searchLower) ||
        exam.sessionName?.toLowerCase().includes(searchLower)
      )
    })
  }, [examSubjects?.data, searchTerm])

  const groupedExamSubjects = useMemo(() => {
    const groups = new Map<
      string,
      {
        classId: number
        sessionId: number
        className: string
        sessionName: string
        subjects: GetExamSubjectsType[]
      }
    >()

    filteredExamSubjects.forEach((subject) => {
      const groupKey = `${subject.classId}-${subject.sessionId}`
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          classId: subject.classId || 0,
          sessionId: subject.sessionId || 0,
          className: subject.className || 'Unassigned',
          sessionName: subject.sessionName || 'Unassigned',
          subjects: [],
        })
      }
      groups.get(groupKey)!.subjects.push(subject)
    })

    return Array.from(groups.values())
  }, [filteredExamSubjects])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return groupedExamSubjects.slice(startIndex, startIndex + itemsPerPage)
  }, [groupedExamSubjects, currentPage, itemsPerPage])

  const totalPages = Math.ceil(groupedExamSubjects.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.subjectName || formData.subjectName.trim() === '') {
      setError('Please enter subject name')
      return
    }

    if (!formData.subjectCode || formData.subjectCode.trim() === '') {
      setError('Please enter subject code')
      return
    }

    if (!formData.examDate) {
      setError('Please select exam date')
      return
    }

    if (!formData.startTime) {
      setError('Please select start time')
      return
    }

    if (!formData.duration || formData.duration === 0) {
      setError('Please enter duration')
      return
    }

    if (!formData.examMarks || formData.examMarks === 0) {
      setError('Please enter exam marks')
      return
    }

    try {
      if (isEditMode && editingExamSubjectId) {
        updateMutation.mutate({
          id: editingExamSubjectId,
          data: formData as GetExamSubjectsType,
        })
      } else {
        addMutation.mutate(formData)
      }
    } catch (err) {
      setError('Failed to save exam subject')
      console.error(err)
    }
  }

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving exam subject')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (exam: GetExamSubjectsType) => {
    setFormData({
      subjectName: exam.subjectName,
      subjectCode: exam.subjectCode,
      examDate: formatDateForInput(exam.examDate),
      startTime: exam.startTime,
      duration: exam.duration,
      examMarks: exam.examMarks,
      classId: exam.classId,
      sessionId: exam.sessionId,
      createdBy: exam.createdBy,
    })
    setEditingExamSubjectId(exam.examSubjectId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (examSubjectId: number) => {
    setDeletingExamSubjectId(examSubjectId)
    setIsDeleteDialogOpen(true)
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

  const handleCopyClick = (group: any) => {
    setSelectedGroupForCopy(group)
    setCopyFormData({
      targetSessionId: null,
      subjects: group.subjects.map((subject: GetExamSubjectsType) => ({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        examDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        duration: subject.duration,
        examMarks: subject.examMarks,
      })),
    })
    setIsCopyPopupOpen(true)
  }

  const handleCopyFormChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setCopyFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) =>
        i === index ? { ...subject, [field]: value } : subject
      ),
    }))
  }

  const handleCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!copyFormData.targetSessionId) {
      setError('Please select a target session')
      return
    }

    if (!selectedGroupForCopy) {
      setError('No group selected')
      return
    }

    try {
      const promises = copyFormData.subjects.map(async (subject) => {
        const data: CreateExamSubjectsType = {
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          examDate: subject.examDate,
          startTime: subject.startTime,
          duration: subject.duration,
          examMarks: subject.examMarks,
          classId: selectedGroupForCopy.classId,
          sessionId: copyFormData.targetSessionId,
          createdBy: userData?.userId || 0,
        }
        return addMutation.mutateAsync(data)
      })

      await Promise.all(promises)
      setIsCopyPopupOpen(false)
      setSelectedGroupForCopy(null)
      setCopyFormData({ targetSessionId: null, subjects: [] })
    } catch (err) {
      setError('Failed to copy exam subjects')
      console.error(err)
    }
  }

  const resetCopyForm = () => {
    setIsCopyPopupOpen(false)
    setSelectedGroupForCopy(null)
    setCopyFormData({ targetSessionId: null, subjects: [] })
    setError(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <BookOpen className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Exam Subjects</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
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

      {/* Grouped Display */}
      <div className="space-y-4">
        {!examSubjects?.data ? (
          <div className="text-center py-8 text-gray-600">
            Loading exam subjects...
          </div>
        ) : examSubjects.data.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No exam subjects found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No exam subjects match your search
          </div>
        ) : (
          <>
            {paginatedGroups.map((group) => {
              const groupKey = `${group.classId}-${group.sessionId}`
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
                          {group.className} - {group.sessionName}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-gray-600">
                              Total Subjects:
                            </span>
                            <span className="font-medium text-amber-700">
                              {group.subjects.length}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyClick(group)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="bg-white border-t border-gray-200 p-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="text-gray-700 font-semibold">
                              Subject Name
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold">
                              Subject Code
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold">
                              Exam Date
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold">
                              Start Time
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold">
                              Duration (min)
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold">
                              Marks
                            </TableHead>
                            <TableHead className="text-gray-700 font-semibold text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.subjects.map((subject) => (
                            <TableRow
                              key={subject.examSubjectId}
                              className="hover:bg-amber-50"
                            >
                              <TableCell className="capitalize font-medium text-gray-800">
                                {subject.subjectName || '-'}
                              </TableCell>
                              <TableCell className="uppercase font-medium text-gray-700">
                                {subject.subjectCode || '-'}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {formatDate(new Date(subject.examDate))}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {formatTime(subject.startTime)}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {subject.duration}
                              </TableCell>
                              <TableCell className="font-semibold text-gray-800">
                                {subject.examMarks}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => handleEditClick(subject)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      handleDeleteClick(
                                        subject.examSubjectId || 0
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
      {groupedExamSubjects.length > 0 && (
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

      {/* Exam Subject Form Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={resetForm}
        title={isEditMode ? 'Edit Exam Subject' : 'Add Exam Subject'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subject Name */}
            <div className="space-y-2">
              <Label htmlFor="subjectName">
                Subject Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subjectName"
                name="subjectName"
                type="text"
                value={formData.subjectName}
                onChange={handleInputChange}
                placeholder="Enter subject name"
                required
              />
            </div>

            {/* Subject Code */}
            <div className="space-y-2">
              <Label htmlFor="subjectCode">
                Subject Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subjectCode"
                name="subjectCode"
                type="text"
                value={formData.subjectCode}
                onChange={handleInputChange}
                placeholder="Enter subject code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <CustomCombobox
                items={
                  classes?.data?.map((cls) => ({
                    id: cls?.classData?.classId?.toString() || '0',
                    name: cls.classData?.className || 'Unnamed class',
                  })) || []
                }
                value={
                  formData.classId
                    ? {
                        id: formData.classId.toString(),
                        name:
                          classes?.data?.find(
                            (c) => c.classData?.classId === formData.classId
                          )?.classData?.className || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('classId', value ? String(value.id) : '0')
                }
                placeholder="Select class"
              />
            </div>

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

            {/* Exam Date */}
            <div className="space-y-2">
              <Label htmlFor="examDate">
                Exam Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="examDate"
                name="examDate"
                type="date"
                value={formData.examDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Exam Marks */}
            <div className="space-y-2">
              <Label htmlFor="examMarks">
                Exam Marks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="examMarks"
                name="examMarks"
                type="number"
                min="1"
                value={formData.examMarks}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="hover:bg-gray-100 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Update' : 'Add'} Exam Subject
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam subject? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExamSubjectId) {
                  deleteMutation.mutate({ id: deletingExamSubjectId })
                  setIsDeleteDialogOpen(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Copy Subjects Popup */}
      <Popup
        isOpen={isCopyPopupOpen}
        onClose={resetCopyForm}
        title={`Copy Subjects from ${selectedGroupForCopy?.className} - ${selectedGroupForCopy?.sessionName}`}
        size="sm:max-w-5xl"
      >
        <form onSubmit={handleCopySubmit} className="space-y-4 py-4">
          {/* Target Session Selection */}
          <div className="space-y-2 pb-4 border-b">
            <Label htmlFor="targetSessionId">
              Target Session <span className="text-red-500">*</span>
            </Label>
            <CustomCombobox
              items={
                sessions?.data
                  ?.filter(
                    (s) => s.sessionId !== selectedGroupForCopy?.sessionId
                  )
                  .map((session) => ({
                    id: session?.sessionId?.toString() || '0',
                    name: session.sessionName || 'Unnamed session',
                  })) || []
              }
              value={
                copyFormData.targetSessionId
                  ? {
                      id: copyFormData.targetSessionId.toString(),
                      name:
                        sessions?.data?.find(
                          (s) => s.sessionId === copyFormData.targetSessionId
                        )?.sessionName || '',
                    }
                  : null
              }
              onChange={(value) =>
                setCopyFormData((prev) => ({
                  ...prev,
                  targetSessionId: value ? Number(value.id) : null,
                }))
              }
              placeholder="Select target session"
            />
          </div>

          {/* Subjects List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {copyFormData.subjects.map((subject, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
              >
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="bg-amber-500 text-white px-2 py-1 rounded text-xs">
                    {index + 1}
                  </span>
                  {subject.subjectName} ({subject.subjectCode})
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  {/* Exam Date */}
                  <div className="space-y-1">
                    <Label htmlFor={`examDate-${index}`} className="text-xs">
                      Exam Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`examDate-${index}`}
                      type="date"
                      value={subject.examDate}
                      onChange={(e) =>
                        handleCopyFormChange(index, 'examDate', e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1">
                    <Label htmlFor={`startTime-${index}`} className="text-xs">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`startTime-${index}`}
                      type="time"
                      value={subject.startTime}
                      onChange={(e) =>
                        handleCopyFormChange(index, 'startTime', e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <Label htmlFor={`duration-${index}`} className="text-xs">
                      Duration (min)
                    </Label>
                    <Input
                      id={`duration-${index}`}
                      type="number"
                      min="1"
                      value={subject.duration}
                      onChange={(e) =>
                        handleCopyFormChange(
                          index,
                          'duration',
                          Number(e.target.value)
                        )
                      }
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>

                  {/* Exam Marks */}
                  <div className="space-y-1">
                    <Label htmlFor={`examMarks-${index}`} className="text-xs">
                      Marks
                    </Label>
                    <Input
                      id={`examMarks-${index}`}
                      type="number"
                      min="1"
                      value={subject.examMarks}
                      onChange={(e) =>
                        handleCopyFormChange(
                          index,
                          'examMarks',
                          Number(e.target.value)
                        )
                      }
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={resetCopyForm}
              className="hover:bg-gray-100 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {addMutation.isPending
                ? 'Copying...'
                : `Copy ${copyFormData.subjects.length} Subjects`}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  )
}

export default ExamSubjects
