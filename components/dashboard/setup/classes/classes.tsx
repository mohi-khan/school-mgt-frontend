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
import type { CreateClassType, GetSectionsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddClass,
  useDeleteClass,
  useGetClasses,
  useGetSections,
  useUpdateClass,
} from '@/hooks/use-api'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const Classes = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: classes } = useGetClasses()
  console.log('🚀 ~ Classes ~ classes:', classes)
  const { data: sections } = useGetSections()

  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [classesPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<'className'>('className') // only className is sortable
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingClassId, setEditingClassId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingClassId, setDeletingClassId] = useState<number | null>(null)

  const [formData, setFormData] = useState<CreateClassType>({
    classData: {
      className: '',
      classCode: '',
      description: '',
      isActive: true,
    },
    sectionIds: [],
  })

  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      classData: {
        ...prev.classData,
        [name]: value,
      },
    }))
  }

  const handleSectionToggle = (sectionId: number) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const resetForm = () => {
    setFormData({
      classData: {
        className: '',
        classCode: '',
        description: '',
        isActive: true,
      },
      sectionIds: [],
    })
    setSelectedSectionIds([])
    setEditingClassId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [])

  const addMutation = useAddClass({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateClass({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteClass({
    onClose: closePopup, // optional if you want popup to close
    reset: resetForm, // optional, resets form state
  })

  const handleDeleteClick = (classId: number) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteMutation.mutate({ id: classId })
    }
  }

  const handleSort = (column: 'className') => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredClasses = useMemo(() => {
    if (!classes?.data) return []
    return classes.data.filter((classItem: any) =>
      classItem.classData.className
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  }, [classes?.data, searchTerm])

  const sortedClasses = useMemo(() => {
    return [...filteredClasses].sort((a, b) => {
      const aValue = a.classData.className ?? ''
      const bValue = b.classData.className ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredClasses, sortDirection])

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * classesPerPage
    return sortedClasses.slice(startIndex, startIndex + classesPerPage)
  }, [sortedClasses, currentPage, classesPerPage])

  const totalPages = Math.ceil(sortedClasses.length / classesPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      console.log(
        'Submit - isEditMode:',
        isEditMode,
        'editingClassId:',
        editingClassId
      )
      setError(null)

      if (selectedSectionIds.length === 0) {
        setError('At least one section must be selected')
        return
      }

      try {
        const submitData: CreateClassType = {
          classData: formData.classData,
          sectionIds: selectedSectionIds,
        }

        if (isEditMode && editingClassId) {
          updateMutation.mutate({
            id: editingClassId,
            data: submitData,
          })
          console.log('check', isEditMode, editingClassId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save class')
        console.error(err)
      }
    },
    [
      formData,
      selectedSectionIds,
      isEditMode,
      editingClassId,
      addMutation,
      updateMutation,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving class')
    }
  }, [addMutation.error, updateMutation.error])

  const getSectionNames = (sectionIds: number[] | undefined) => {
    if (!sectionIds || !sections?.data) return []
    return sectionIds
      .map((id) => sections?.data?.find((s) => s.sectionId === id)?.sectionName)
      .filter(Boolean)
  }

  const handleEditClick = (classItem: any) => {
    setFormData({
      classData: classItem.classData,
      sectionIds: classItem.sectionIds,
    })
    setSelectedSectionIds(classItem.sectionIds)
    setEditingClassId(classItem.classData.classId) // ← Changed from classItem.classId
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <BookOpen className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Classes</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead
                onClick={() => handleSort('className')}
                className="cursor-pointer"
              >
                Class <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Sections</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!classes || classes.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading classes...
                </TableCell>
              </TableRow>
            ) : !classes.data || classes.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No classes found
                </TableCell>
              </TableRow>
            ) : paginatedClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No classes match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedClasses.map((classItem: any, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {classItem.classData.className}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {getSectionNames(classItem.sectionIds).map(
                        (sectionName, idx) => (
                          <div
                            key={idx}
                            className="text-sm inline-flex items-center"
                          >
                            <p>{sectionName}</p>
                          </div>
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(classItem)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingClassId(classItem.classData.classId)
                          setIsDeleteDialogOpen(true)
                        }}
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

      {sortedClasses.length > 0 && (
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

      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Class' : 'Add Class'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="className">
                Class <span className="text-red-500">*</span>
              </Label>
              <Input
                id="className"
                name="className"
                value={formData.classData.className}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                name="classCode"
                value={formData.classData.classCode}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.classData.description || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-3">
              <Label>
                Sections <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3 bg-gray-50">
                {!sections || sections.data === undefined ? (
                  <p className="text-sm text-gray-500">Loading sections...</p>
                ) : sections?.data?.length === 0 ? (
                  <p className="text-sm text-gray-500">No sections available</p>
                ) : (
                  sections?.data?.map((section: GetSectionsType) => (
                    <div
                      key={section.sectionId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`section-${section.sectionId}`}
                        checked={selectedSectionIds.includes(
                          section.sectionId ?? 0
                        )}
                        onCheckedChange={() =>
                          handleSectionToggle(section.sectionId ?? 0)
                        }
                      />
                      <Label
                        htmlFor={`section-${section.sectionId}`}
                        className="cursor-pointer font-normal"
                      >
                        {section.sectionName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closePopup}>
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className='bg-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingClassId) {
                  deleteMutation.mutate({ id: deletingClassId })
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

export default Classes
