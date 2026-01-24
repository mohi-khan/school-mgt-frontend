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
import { ArrowUpDown, Search, Building2, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useGetBankAccounts,
  useAddBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
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
import type { CreateBankAccountsType, GetBankAccountsType } from '@/utils/type'

const BankAccounts = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: bankAccounts } = useGetBankAccounts()

  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetBankAccountsType>('bankName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingFeesGroupId, setDeletingFeesGroupId] = useState<number | null>(
    null
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const checkUserData = () => {
      const storedUserData = localStorage.getItem('currentUser')
      const storedToken = localStorage.getItem('authToken')
      if (!storedUserData || !storedToken) {
        console.log('No user data or token found in localStorage')
        router.push('/')
        return
      }
    }
    checkUserData()
  }, [userData, token, router])

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingBankAccount, setEditingBankAccount] =
    useState<GetBankAccountsType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateBankAccountsType>({
    bankName: '',
    accountNumber: '',
    branch: '',
    accountName: '',
    balance: 0,
    createdBy: userData?.userId || 0,
  })

  const handleSort = (column: keyof GetBankAccountsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredBankAccounts = useMemo(() => {
    if (!bankAccounts?.data) return []
    return bankAccounts.data.filter((account: any) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        account.bankName?.toLowerCase().includes(searchLower) ||
        account.accountNumber?.toLowerCase().includes(searchLower) ||
        account.accountName?.toLowerCase().includes(searchLower) ||
        account.balance?.toString().toLowerCase().includes(searchLower) ||
        account.branch?.toLowerCase().includes(searchLower)
      )
    })
  }, [bankAccounts?.data, searchTerm])

  const sortedBankAccounts = useMemo(() => {
    return [...filteredBankAccounts].sort((a, b) => {
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
  }, [filteredBankAccounts, sortColumn, sortDirection])

  const paginatedBankAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedBankAccounts.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedBankAccounts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedBankAccounts.length / itemsPerPage)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = (account: GetBankAccountsType) => {
    setIsEditMode(true)
    setEditingBankAccount(account)
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      branch: account.branch || '',
      accountName: account.accountName || '',
      balance: account.balance || 0,
      createdBy: userData?.userId || 0,
      updatedBy: userData?.userId || 0,
    })
    setIsPopupOpen(true)
  }

  const handleAdd = () => {
    setIsEditMode(false)
    setEditingBankAccount(null)
    resetForm()
    setIsPopupOpen(true)
  }

  const resetForm = useCallback(() => {
    setFormData({
      bankName: '',
      accountNumber: '',
      branch: '',
      accountName: '',
      balance: 0,
      createdBy: userData?.userId || 0,
    })
    setIsPopupOpen(false)
    setIsEditMode(false)
    setEditingBankAccount(null)
  }, [userData?.userId, setIsPopupOpen, setIsEditMode, setEditingBankAccount])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddBankAccount({
    onClose: closePopup,
    reset: resetForm,
  })

  const editMutation = useUpdateBankAccount({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteBankAccount({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        if (isEditMode && editingBankAccount) {
          if (
            editingBankAccount?.bankAccountId === undefined ||
            editingBankAccount?.createdBy === undefined
          )
            return

          editMutation.mutate({
            id: editingBankAccount.bankAccountId,
            data: {
              ...formData,
              //   bankAccountId: editingBankAccount.bankAccountId,
              updatedBy: userData?.userId || 0,
              createdBy: editingBankAccount.createdBy || 0,
              bankName: formData.bankName,
              accountNumber: formData.accountNumber,
              branch: formData.branch || null,
              accountName: formData.accountName,
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
        setError(`Failed to ${isEditMode ? 'update' : 'create'} bank account`)
        console.error(
          `Error ${isEditMode ? 'updating' : 'creating'} bank account:`,
          error
        )
      }
    },
    [
      formData,
      userData,
      isEditMode,
      editingBankAccount,
      addMutation,
      editMutation,
      resetForm,
    ]
  )

  const handleEditClick = (account: any) => {
    setIsEditMode(true)
    setEditingBankAccount(account)
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      branch: account.branch || '',
      accountName: account.accountName || '',
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
            <Building2 className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Bank Accounts</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bank accounts..."
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
                onClick={() => handleSort('bankName')}
                className="cursor-pointer"
              >
                Bank Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('accountNumber')}
                className="cursor-pointer"
              >
                Account Number <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('accountNumber')}
                className="cursor-pointer"
              >
                Account Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('branch')}
                className="cursor-pointer"
              >
                Branch <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('branch')}
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
            {!bankAccounts || bankAccounts.data === undefined ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading bank accounts...
                </TableCell>
              </TableRow>
            ) : !bankAccounts.data || bankAccounts.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No bank accounts found
                </TableCell>
              </TableRow>
            ) : paginatedBankAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No bank accounts match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedBankAccounts.map((account) => (
                <TableRow key={account.bankAccountId}>
                  <TableCell className="font-medium">
                    {account.bankName}
                  </TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell>{account.branch}</TableCell>
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
                          setDeletingFeesGroupId(account.bankAccountId ?? 0)
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

      {sortedBankAccounts.length > 0 && (
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
        title={isEditMode ? 'Edit Bank Account' : 'Add Bank Account'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name <span className="text-red-500">*</span></Label>
              <Input
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number <span className="text-red-500">*</span></Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                required
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="branch">Branch <span className="text-red-500">*</span></Label>
              <Input
                id="branch"
                name="branch"
                value={formData.branch || ''}
                onChange={handleInputChange}
                placeholder="Enter branch name"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Balance <span className="text-red-500">*</span></Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                value={formData.balance}
                onChange={handleInputChange}
                placeholder="Enter balance"
                required
                maxLength={50}
                disabled={isEditMode}
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

export default BankAccounts
