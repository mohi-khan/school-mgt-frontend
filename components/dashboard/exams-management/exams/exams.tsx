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
import { ArrowUpDown, Search, FileText, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateExamsType, GetExamsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddExam,
  useGetExams,
  useUpdateExam,
  useDeleteExam,
  useGetExamGroups,
  useGetSessions,
  useGetClasses,
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

const Exams = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: exams } = useGetExams()
  const { data: examGroups } = useGetExamGroups()
  const { data: sessions } = useGetSessions()
  const { data: classes } = useGetClasses()
  const { data: subjects } = useGetExamSubjects()

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetExamsType>('examName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingExamId, setEditingExamId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingExamId, setDeletingExamId] = useState<number | null>(null)

  const [formData, setFormData] = useState<CreateExamsType>({
    examName: '',
    examGroupsId: null,
    sessionId: null,
    classId: null,
    examSubjectId: null,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? Number(value) : null,
    }))
  }

  const resetForm = () => {
    setFormData({
      examName: '',
      examGroupsId: null,
      sessionId: null,
      classId: null,
      examSubjectId: null,
      createdBy: userData?.userId || 0,
    })
    setEditingExamId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddExam({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateExam({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteExam({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetExamsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredExams = useMemo(() => {
    if (!exams?.data) return []
    return exams.data.filter((exam: GetExamsType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        exam.examName?.toLowerCase().includes(searchLower) ||
        exam.examGroupName?.toLowerCase().includes(searchLower) ||
        exam.className?.toLowerCase().includes(searchLower) ||
        exam.subjectName?.toLowerCase().includes(searchLower)
      )
    })
  }, [exams?.data, searchTerm])

  const sortedExams = useMemo(() => {
    return [...filteredExams].sort((a, b) => {
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
  }, [filteredExams, sortColumn, sortDirection])

  const paginatedExams = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedExams.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedExams, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedExams.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.examName || formData.examName.trim() === '') {
      setError('Please enter exam name')
      return
    }

    try {
      if (isEditMode && editingExamId) {
        updateMutation.mutate({
          id: editingExamId,
          data: formData,
        })
      } else {
        addMutation.mutate(formData)
      }
    } catch (err) {
      setError('Failed to save exam')
      console.error(err)
    }
  }

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving exam')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (exam: GetExamsType) => {
    setFormData({
      examName: exam.examName,
      examGroupsId: exam.examGroupsId ?? null,
      sessionId: exam.sessionId ?? null,
      classId: exam.classId ?? null,
      examSubjectId: exam.examSubjectId ?? null,
      createdBy: userData?.userId || 0,
    })
    setEditingExamId(exam.examId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (examId: number) => {
    setDeletingExamId(examId)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <FileText className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Exams</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search exams..."
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
                onClick={() => handleSort('examName')}
                className="cursor-pointer"
              >
                Exam Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('examGroupName')}
                className="cursor-pointer"
              >
                Exam Group <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('sessionName')}
                className="cursor-pointer"
              >
                Session <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('className')}
                className="cursor-pointer"
              >
                Class <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('subjectName')}
                className="cursor-pointer"
              >
                Subject <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!exams?.data ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading exams...
                </TableCell>
              </TableRow>
            ) : exams.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No exams found
                </TableCell>
              </TableRow>
            ) : paginatedExams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No exams match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedExams.map((exam) => (
                <TableRow key={exam.examId}>
                  <TableCell className="capitalize">{exam.examName}</TableCell>
                  <TableCell className="capitalize">
                    {exam.examGroupName || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {exam.sessionName || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {exam.className || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {exam.subjectName || '-'}
                  </TableCell>
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
                        onClick={() => handleDeleteClick(exam.examId || 0)}
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
      {sortedExams.length > 0 && (
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

      {/* Exams Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={resetForm}
        title={isEditMode ? 'Edit Exam' : 'Add Exam'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Exam Name */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="examName">
                Exam Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="examName"
                name="examName"
                type="text"
                value={formData.examName}
                onChange={handleInputChange}
                placeholder="Enter exam name"
                required
              />
            </div>

            {/* Exam Group */}
            <div className="space-y-2">
              <Label htmlFor="examGroupsId">Exam Group</Label>
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

            {/* Class */}
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
                placeholder="Select class"
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

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExamId) {
                  deleteMutation.mutate({ id: deletingExamId })
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

export default Exams
