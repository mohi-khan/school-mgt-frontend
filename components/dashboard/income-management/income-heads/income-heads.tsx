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
import { ArrowUpDown, Search, DollarSign, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateIncomeHeadsType, GetIncomeHeadsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddIncomeHead,
  useDeleteIncomeHead,
  useGetIncomeHeads,
  useUpdateIncomeHead,
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

const IncomeHeads = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: incomeHeads } = useGetIncomeHeads()
  console.log('🚀 ~ IncomeHeads ~ incomeHeads:', incomeHeads)

  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [incomeHeadsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetIncomeHeadsType>('incomeHead')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingIncomeHeadId, setEditingIncomeHeadId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingIncomeHeadId, setDeletingIncomeHeadId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateIncomeHeadsType>({
    incomeHead: '',
    description: null,
    createdBy: userData?.userId || 0,
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

  const resetForm = useCallback(() => {
    setFormData({
      incomeHead: '',
      description: null,
      createdBy: userData?.userId || 0,
    })
    setEditingIncomeHeadId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddIncomeHead({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateIncomeHead({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteIncomeHead({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleDeleteClick = (incomeHeadId: number) => {
    if (confirm('Are you sure you want to delete this income head?')) {
      deleteMutation.mutate({ id: incomeHeadId })
    }
  }

  const handleSort = (column: keyof GetIncomeHeadsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredIncomeHeads = useMemo(() => {
    if (!incomeHeads?.data) return []
    return incomeHeads.data.filter((head: any) =>
      head.incomeHead?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [incomeHeads?.data, searchTerm])

  const sortedIncomeHeads = useMemo(() => {
    return [...filteredIncomeHeads].sort((a, b) => {
      const aValue = a.incomeHead ?? ''
      const bValue = b.incomeHead ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredIncomeHeads, sortDirection])

  const paginatedIncomeHeads = useMemo(() => {
    const startIndex = (currentPage - 1) * incomeHeadsPerPage
    return sortedIncomeHeads.slice(startIndex, startIndex + incomeHeadsPerPage)
  }, [sortedIncomeHeads, currentPage, incomeHeadsPerPage])

  const totalPages = Math.ceil(sortedIncomeHeads.length / incomeHeadsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      console.log(
        'Submit - isEditMode:',
        isEditMode,
        'editingIncomeHeadId:',
        editingIncomeHeadId
      )
      setError(null)

      try {
        const submitData: CreateIncomeHeadsType = {
          incomeHead: formData.incomeHead,
          description: formData.description,
          createdBy: userData?.userId || 0,
        }

        if (isEditMode && editingIncomeHeadId) {
          updateMutation.mutate({
            id: editingIncomeHeadId,
            data: submitData,
          })
          console.log('update', isEditMode, editingIncomeHeadId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save income head')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingIncomeHeadId,
      addMutation,
      updateMutation,
      userData?.userId,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving income head')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (head: any) => {
    setFormData({
      incomeHead: head.incomeHead,
      description: head.description,
      createdBy: userData?.userId || 0,
    })
    setEditingIncomeHeadId(head.incomeHeadId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Income Heads</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search income heads..."
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
                onClick={() => handleSort('incomeHead')}
                className="cursor-pointer"
              >
                Income Head <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
            {!incomeHeads || incomeHeads.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading income heads...
                </TableCell>
              </TableRow>
            ) : !incomeHeads.data || incomeHeads.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No income heads found
                </TableCell>
              </TableRow>
            ) : paginatedIncomeHeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No income heads match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedIncomeHeads.map((head: any, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {head.incomeHead}
                  </TableCell>
                  <TableCell>{head.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(head)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingIncomeHeadId(head.incomeHeadId)
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

      {sortedIncomeHeads.length > 0 && (
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
        title={isEditMode ? 'Edit Income Head' : 'Add Income Head'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="incomeHead">
                Income Head <span className="text-red-500">*</span>
              </Label>
              <Input
                id="incomeHead"
                name="incomeHead"
                value={formData.incomeHead}
                onChange={handleInputChange}
                required
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
            <AlertDialogTitle>Delete Income Head</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income head? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingIncomeHeadId) {
                  deleteMutation.mutate({ id: deletingIncomeHeadId })
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

export default IncomeHeads
