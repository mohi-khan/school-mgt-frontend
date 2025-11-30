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
import type { CreateFeesGroupType, GetFeesGroupType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useAddFeesGroup,
  useDeleteFeesGroup,
  useGetFeesGroups,
  useUpdateFeesGroup,
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

const FeesGroups = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: feesGroups } = useGetFeesGroups()
  console.log('🚀 ~ FeesGroups ~ feesGroups:', feesGroups)

  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [feesGroupsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetFeesGroupType>('groupName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingFeesGroupId, setEditingFeesGroupId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingFeesGroupId, setDeletingFeesGroupId] = useState<number | null>(
    null
  )

  const [formData, setFormData] = useState<CreateFeesGroupType>({
    groupName: '',
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
      groupName: '',
      description: null,
    })
    setEditingFeesGroupId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [])

  const addMutation = useAddFeesGroup({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateFeesGroup({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteFeesGroup({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleDeleteClick = (feesGroupId: number) => {
    if (confirm('Are you sure you want to delete this fees group?')) {
      deleteMutation.mutate({ id: feesGroupId })
    }
  }

  const handleSort = (column: keyof GetFeesGroupType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredFeesGroups = useMemo(() => {
    if (!feesGroups?.data) return []
    return feesGroups.data.filter((group: any) =>
      group.groupName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [feesGroups?.data, searchTerm])

  const sortedFeesGroups = useMemo(() => {
    return [...filteredFeesGroups].sort((a, b) => {
      const aValue = a.groupName ?? ''
      const bValue = b.groupName ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredFeesGroups, sortDirection])

  const paginatedFeesGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * feesGroupsPerPage
    return sortedFeesGroups.slice(startIndex, startIndex + feesGroupsPerPage)
  }, [sortedFeesGroups, currentPage, feesGroupsPerPage])

  const totalPages = Math.ceil(sortedFeesGroups.length / feesGroupsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      console.log(
        'Submit - isEditMode:',
        isEditMode,
        'editingFeesGroupId:',
        editingFeesGroupId
      )
      setError(null)

      try {
        const submitData: CreateFeesGroupType = {
          groupName: formData.groupName,
          description: formData.description,
        }

        if (isEditMode && editingFeesGroupId) {
          updateMutation.mutate({
            id: editingFeesGroupId,
            data: submitData,
          })
          console.log('update', isEditMode, editingFeesGroupId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save fees group')
        console.error(err)
      }
    },
    [formData, isEditMode, editingFeesGroupId, addMutation, updateMutation]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving fees group')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (group: any) => {
    setFormData({
      groupName: group.groupName,
      description: group.description,
    })
    setEditingFeesGroupId(group.feesGroupId)
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
          <h2 className="text-lg font-semibold">Fees Groups</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search fees groups..."
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
                onClick={() => handleSort('groupName')}
                className="cursor-pointer"
              >
                Group Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
            {!feesGroups || feesGroups.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading fees groups...
                </TableCell>
              </TableRow>
            ) : !feesGroups.data || feesGroups.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No fees groups found
                </TableCell>
              </TableRow>
            ) : paginatedFeesGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No fees groups match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedFeesGroups.map((group: any, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {group.groupName}
                  </TableCell>
                  <TableCell>{group.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(group)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingFeesGroupId(group.feesGroupId)
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

      {sortedFeesGroups.length > 0 && (
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
        title={isEditMode ? 'Edit Fees Group' : 'Add Fees Group'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="groupName"
                name="groupName"
                value={formData.groupName}
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
            <AlertDialogTitle>Delete Fees Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fees group? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFeesGroupId) {
                  deleteMutation.mutate({ id: deletingFeesGroupId })
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

export default FeesGroups
