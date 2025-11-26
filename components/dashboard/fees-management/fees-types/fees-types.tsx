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
import { ArrowUpDown, Search, Tag, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateFeesTypeType, GetFeesTypeType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddFeesType,
  useDeleteFeesType,
  useGetFeesTypes,
  useUpdateFeesType,
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

const FeesTypes = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: feesTypes } = useGetFeesTypes()
  console.log('🚀 ~ FeesTypes ~ feesTypes:', feesTypes)

  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [feesTypesPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetFeesTypeType>('typeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingFeesTypeId, setEditingFeesTypeId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingFeesTypeId, setDeletingFeesTypeId] = useState<number | null>(
    null
  )

  const [formData, setFormData] = useState<CreateFeesTypeType>({
    typeName: '',
    feesCode: '',
    description: null,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      typeName: '',
      feesCode: '',
      description: null,
    })
    setEditingFeesTypeId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [])

  const addMutation = useAddFeesType({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateFeesType({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteFeesType({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleDeleteClick = (feesTypeId: number) => {
    if (confirm('Are you sure you want to delete this fees type?')) {
      deleteMutation.mutate({ id: feesTypeId })
    }
  }

  const handleSort = (column: keyof GetFeesTypeType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredFeesTypes = useMemo(() => {
    if (!feesTypes?.data) return []
    return feesTypes.data.filter((type: any) =>
      type.typeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [feesTypes?.data, searchTerm])

  const sortedFeesTypes = useMemo(() => {
    return [...filteredFeesTypes].sort((a, b) => {
      const aValue = a.typeName ?? ''
      const bValue = b.typeName ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredFeesTypes, sortDirection])

  const paginatedFeesTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * feesTypesPerPage
    return sortedFeesTypes.slice(startIndex, startIndex + feesTypesPerPage)
  }, [sortedFeesTypes, currentPage, feesTypesPerPage])

  const totalPages = Math.ceil(sortedFeesTypes.length / feesTypesPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      console.log(
        'Submit - isEditMode:',
        isEditMode,
        'editingFeesTypeId:',
        editingFeesTypeId
      )
      setError(null)

      try {
        const submitData: CreateFeesTypeType = {
          typeName: formData.typeName,
          feesCode: formData.feesCode,
          description: formData.description,
        }

        if (isEditMode && editingFeesTypeId) {
          updateMutation.mutate({
            id: editingFeesTypeId,
            data: submitData,
          })
          console.log('update', isEditMode, editingFeesTypeId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save fees type')
        console.error(err)
      }
    },
    [formData, isEditMode, editingFeesTypeId, addMutation, updateMutation]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving fees type')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (type: any) => {
    setFormData({
      typeName: type.typeName,
      feesCode: type.feesCode,
      description: type.description,
    })
    setEditingFeesTypeId(type.feesTypeId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Tag className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Fees Types</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search fees types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-400 hover:bg-amber-500 text-black"
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
                onClick={() => handleSort('typeName')}
                className="cursor-pointer"
              >
                Type Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('feesCode')}
                className="cursor-pointer"
              >
                Fees Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('description')}
                className="cursor-pointer"
              >
                Description <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!feesTypes || feesTypes.data === undefined ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Loading fees types...
                </TableCell>
              </TableRow>
            ) : !feesTypes.data || feesTypes.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No fees types found
                </TableCell>
              </TableRow>
            ) : paginatedFeesTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No fees types match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedFeesTypes.map((type: any, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{type.typeName}</TableCell>
                  <TableCell>{type.feesCode || '-'}</TableCell>
                  <TableCell>{type.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(type)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingFeesTypeId(type.feesTypeId)
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

      {sortedFeesTypes.length > 0 && (
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
        title={isEditMode ? 'Edit Fees Type' : 'Add Fees Type'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="typeName">
                Type Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="typeName"
                name="typeName"
                value={formData.typeName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feesCode">Fees Code</Label>
              <Input
                id="feesCode"
                name="feesCode"
                value={formData.feesCode || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
              />
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
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fees Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fees type? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFeesTypeId) {
                  deleteMutation.mutate({ id: deletingFeesTypeId })
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

export default FeesTypes
