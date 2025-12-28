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
import { ArrowUpDown, Search, TrendingDown, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateExpenseHeadsType, GetExpenseHeadsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddExpenseHead,
  useDeleteExpenseHead,
  useGetExpenseHeads,
  useUpdateExpenseHead,
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

const ExpenseHeads = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: expenseHeads } = useGetExpenseHeads()
  console.log('🚀 ~ ExpenseHeads ~ expenseHeads:', expenseHeads)

  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expenseHeadsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetExpenseHeadsType>('expenseHead')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingExpenseHeadId, setEditingExpenseHeadId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingExpenseHeadId, setDeletingExpenseHeadId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateExpenseHeadsType>({
    expenseHead: '',
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
      expenseHead: '',
      description: null,
      createdBy: userData?.userId || 0,
    })
    setEditingExpenseHeadId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddExpenseHead({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateExpenseHead({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteExpenseHead({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleDeleteClick = (expenseHeadId: number) => {
    if (confirm('Are you sure you want to delete this expense head?')) {
      deleteMutation.mutate({ id: expenseHeadId })
    }
  }

  const handleSort = (column: keyof GetExpenseHeadsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredExpenseHeads = useMemo(() => {
    if (!expenseHeads?.data) return []
    return expenseHeads.data.filter((head: any) =>
      head.expenseHead?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [expenseHeads?.data, searchTerm])

  const sortedExpenseHeads = useMemo(() => {
    return [...filteredExpenseHeads].sort((a, b) => {
      const aValue = a.expenseHead ?? ''
      const bValue = b.expenseHead ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredExpenseHeads, sortDirection])

  const paginatedExpenseHeads = useMemo(() => {
    const startIndex = (currentPage - 1) * expenseHeadsPerPage
    return sortedExpenseHeads.slice(
      startIndex,
      startIndex + expenseHeadsPerPage
    )
  }, [sortedExpenseHeads, currentPage, expenseHeadsPerPage])

  const totalPages = Math.ceil(sortedExpenseHeads.length / expenseHeadsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      console.log(
        'Submit - isEditMode:',
        isEditMode,
        'editingExpenseHeadId:',
        editingExpenseHeadId
      )
      setError(null)

      try {
        const submitData: CreateExpenseHeadsType = {
          expenseHead: formData.expenseHead,
          description: formData.description,
          createdBy: userData?.userId || 0,
        }

        if (isEditMode && editingExpenseHeadId) {
          updateMutation.mutate({
            id: editingExpenseHeadId,
            data: submitData,
          })
          console.log('update', isEditMode, editingExpenseHeadId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save expense head')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingExpenseHeadId,
      addMutation,
      updateMutation,
      userData?.userId,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving expense head')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (head: any) => {
    setFormData({
      expenseHead: head.expenseHead,
      description: head.description,
      createdBy: userData?.userId || 0,
    })
    setEditingExpenseHeadId(head.expenseHeadId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <TrendingDown className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Expense Heads</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search expense heads..."
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
                onClick={() => handleSort('expenseHead')}
                className="cursor-pointer"
              >
                Expense Head <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
            {!expenseHeads || expenseHeads.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading expense heads...
                </TableCell>
              </TableRow>
            ) : !expenseHeads.data || expenseHeads.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No expense heads found
                </TableCell>
              </TableRow>
            ) : paginatedExpenseHeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No expense heads match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedExpenseHeads.map((head: any, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {head.expenseHead}
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
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => {
                          setDeletingExpenseHeadId(head.expenseHeadId)
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

      {sortedExpenseHeads.length > 0 && (
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
        title={isEditMode ? 'Edit Expense Head' : 'Add Expense Head'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="expenseHead">
                Expense Head <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="expenseHead"
                name="expenseHead"
                value={formData.expenseHead}
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
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
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
            <AlertDialogTitle>Delete Expense Head</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense head? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExpenseHeadId) {
                  deleteMutation.mutate({ id: deletingExpenseHeadId })
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

export default ExpenseHeads
