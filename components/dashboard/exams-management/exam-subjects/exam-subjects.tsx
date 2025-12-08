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
import { ArrowUpDown, Search, BookOpen, Edit2, Trash2 } from 'lucide-react'
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

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetExamSubjectsType>('examDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingExamSubjectId, setEditingExamSubjectId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingExamSubjectId, setDeletingExamSubjectId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateExamSubjectsType>({
    subjectName: '',
    subjectCode: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    duration: 60,
    examMarks: 100,
    classId: null,
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

  const handleSort = (column: keyof GetExamSubjectsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredExamSubjects = useMemo(() => {
    if (!examSubjects?.data) return []
    return examSubjects.data.filter((exam: GetExamSubjectsType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        exam.subjectName?.toLowerCase().includes(searchLower) ||
        exam.subjectCode?.toLowerCase().includes(searchLower) ||
        exam.className?.toLowerCase().includes(searchLower)
      )
    })
  }, [examSubjects?.data, searchTerm])

  const sortedExamSubjects = useMemo(() => {
    return [...filteredExamSubjects].sort((a, b) => {
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
  }, [filteredExamSubjects, sortColumn, sortDirection])

  const paginatedExamSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedExamSubjects.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedExamSubjects, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedExamSubjects.length / itemsPerPage)

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
            className="bg-amber-400 hover:bg-amber-500 text-black"
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
                onClick={() => handleSort('subjectName')}
                className="cursor-pointer"
              >
                Subject Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('subjectCode')}
                className="cursor-pointer"
              >
                Subject Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('className')}
                className="cursor-pointer"
              >
                Class <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('examDate')}
                className="cursor-pointer"
              >
                Exam Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('startTime')}
                className="cursor-pointer"
              >
                Start Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('duration')}
                className="cursor-pointer"
              >
                Duration (min) <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('examMarks')}
                className="cursor-pointer"
              >
                Marks <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!examSubjects?.data ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading exam subjects...
                </TableCell>
              </TableRow>
            ) : examSubjects.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No exam subjects found
                </TableCell>
              </TableRow>
            ) : paginatedExamSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No exam subjects match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedExamSubjects.map((exam) => (
                <TableRow key={exam.examSubjectId}>
                  <TableCell className="capitalize">
                    {exam.subjectName}
                  </TableCell>
                  <TableCell className="uppercase">
                    {exam.subjectCode}
                  </TableCell>
                  <TableCell>
                    {exam.className}
                  </TableCell>
                  <TableCell>{formatDate(new Date(exam.examDate))}</TableCell>
                  <TableCell>{formatTime(exam.startTime)}</TableCell>
                  <TableCell>{exam.duration}</TableCell>
                  <TableCell>{exam.examMarks}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(exam)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          handleDeleteClick(exam.examSubjectId || 0)
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
      {sortedExamSubjects.length > 0 && (
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
            <Button
              type="submit"
            >
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
        <AlertDialogContent>
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
    </div>
  )
}

export default ExamSubjects
