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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, Search, Smartphone, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useGetMfss,
  useAddMfs,
  useUpdateMfs,
  useDeleteMfs,
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
import { formatDate, formatNumber } from '@/utils/conversions'
import type { CreateMfssType, GetMfssType } from '@/utils/type'

const Mfs = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: mfss } = useGetMfss()
  console.log('🚀 ~ Mfs ~ mfss:', mfss)

  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetMfssType>('accountName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingMfsId, setDeletingMfsId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingMfs, setEditingMfs] = useState<GetMfssType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateMfssType>({
    accountName: '',
    mfsNumber: '',
    mfsType: 'bkash',
    balance: 0,
    createdBy: userData?.userId || 0,
  })

  const handleSort = (column: keyof GetMfssType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredMfss = useMemo(() => {
    if (!mfss?.data) return []
    return mfss.data.filter((account: any) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        account.accountName?.toLowerCase().includes(searchLower) ||
        account.mfsNumber?.toLowerCase().includes(searchLower) ||
        account.mfsType?.toLowerCase().includes(searchLower) ||
        account.balance?.toString().toLowerCase().includes(searchLower)
      )
    })
  }, [mfss?.data, searchTerm])

  const sortedMfss = useMemo(() => {
    return [...filteredMfss].sort((a, b) => {
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
  }, [filteredMfss, sortColumn, sortDirection])

  const paginatedMfss = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedMfss.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedMfss, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedMfss.length / itemsPerPage)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (value: 'bkash' | 'nagad' | 'rocket') => {
    setFormData((prev) => ({
      ...prev,
      mfsType: value,
    }))
  }

  const handleEdit = (account: GetMfssType) => {
    setIsEditMode(true)
    setEditingMfs(account)
    setFormData({
      accountName: account.accountName,
      mfsNumber: account.mfsNumber,
      mfsType: account.mfsType,
      balance: account.balance || 0,
      createdBy: userData?.userId || 0,
      updatedBy: userData?.userId || 0,
    })
    setIsPopupOpen(true)
  }

  const handleAdd = () => {
    setIsEditMode(false)
    setEditingMfs(null)
    resetForm()
    setIsPopupOpen(true)
  }

  const resetForm = useCallback(() => {
    setFormData({
      accountName: '',
      mfsNumber: '',
      mfsType: 'bkash',
      balance: 0,
      createdBy: userData?.userId || 0,
    })
    setIsPopupOpen(false)
    setIsEditMode(false)
    setEditingMfs(null)
  }, [userData?.userId, setIsPopupOpen, setIsEditMode, setEditingMfs])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddMfs({
    onClose: closePopup,
    reset: resetForm,
  })

  const editMutation = useUpdateMfs({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteMfs({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        if (isEditMode && editingMfs) {
          if (
            editingMfs?.mfsId === undefined ||
            editingMfs?.createdBy === undefined
          )
            return

          editMutation.mutate({
            id: editingMfs.mfsId,
            data: {
              ...formData,
              updatedBy: userData?.userId || 0,
              createdBy: editingMfs.createdBy || 0,
              accountName: formData.accountName,
              mfsNumber: formData.mfsNumber,
              mfsType: formData.mfsType,
              balance: Number(formData.balance),
            },
          })
        } else {
          addMutation.mutate({
            ...formData,
            balance: Number(formData.balance),
            createdBy: userData?.userId || 0,
          })
        }
        resetForm()
      } catch (error) {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} MFS account`)
        console.error(
          `Error ${isEditMode ? 'updating' : 'creating'} MFS account:`,
          error
        )
      }
    },
    [
      formData,
      userData,
      isEditMode,
      editingMfs,
      addMutation,
      editMutation,
      resetForm,
    ]
  )

  const handleEditClick = (account: any) => {
    setIsEditMode(true)
    setEditingMfs(account)
    setFormData({
      accountName: account.accountName,
      mfsNumber: account.mfsNumber,
      mfsType: account.mfsType,
      balance: account.balance || 0,
      createdBy: userData?.userId || 0,
      updatedBy: userData?.userId || 0,
    })
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Smartphone className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">MFS Accounts</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search MFS accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={handleAdd}
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
                onClick={() => handleSort('accountName')}
                className="cursor-pointer"
              >
                Account Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('mfsNumber')}
                className="cursor-pointer"
              >
                MFS Number <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('mfsType')}
                className="cursor-pointer"
              >
                MFS Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('balance')}
                className="cursor-pointer"
              >
                Balance <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('createdAt')}
                className="cursor-pointer"
              >
                Created At <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!mfss || mfss.data === undefined ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading MFS accounts...
                </TableCell>
              </TableRow>
            ) : !mfss.data || mfss.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No MFS accounts found
                </TableCell>
              </TableRow>
            ) : paginatedMfss.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No MFS accounts match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedMfss.map((account) => (
                <TableRow key={account.mfsId}>
                  <TableCell className="font-medium">
                    {account.accountName}
                  </TableCell>
                  <TableCell>{account.mfsNumber}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.mfsType === 'bkash'
                          ? 'bg-pink-100 text-pink-800'
                          : account.mfsType === 'nagad'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {account.mfsType}
                    </span>
                  </TableCell>
                  <TableCell>{formatNumber(account.balance)}</TableCell>
                  <TableCell>{formatDate(account.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(account)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingMfsId(account.mfsId ?? 0)
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

      {sortedMfss.length > 0 && (
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
        onClose={resetForm}
        title={isEditMode ? 'Edit MFS Account' : 'Add MFS Account'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name*</Label>
              <Input
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                placeholder="Enter account name"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfsNumber">MFS Number*</Label>
              <Input
                id="mfsNumber"
                name="mfsNumber"
                value={formData.mfsNumber}
                onChange={handleInputChange}
                placeholder="Enter MFS number"
                required
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfsType">MFS Type*</Label>
              <Select
                value={
                  (formData.mfsType as 'bkash' | 'nagad' | 'rocket')
                }
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger id="mfsType">
                  <SelectValue placeholder="Select MFS type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">Bkash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Balance*</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                value={formData.balance}
                onChange={handleInputChange}
                placeholder="Enter balance"
                required
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? 'Update' : 'Save'}</Button>
          </div>
        </form>
      </Popup>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MFS Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this MFS account? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingMfsId) {
                  deleteMutation.mutate({ id: deletingMfsId })
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

export default Mfs
