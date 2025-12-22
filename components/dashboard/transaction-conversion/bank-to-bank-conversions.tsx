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
  ArrowUpDown,
  Search,
  ArrowRightLeft,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  useGetBankToBankConversions,
  useAddBankToBankConversion,
  useUpdateBankToBankConversion,
  useDeleteBankToBankConversion,
} from '@/hooks/use-api'
import { useGetBankAccounts } from '@/hooks/use-api'
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
import type {
  CreateBankToBankConversionsType,
  GetBankToBankConversionsType,
} from '@/utils/type'
import { Textarea } from '@/components/ui/textarea'
import { CustomCombobox } from '@/utils/custom-combobox'

const BankToBankConversions = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: bankToBankConversions } = useGetBankToBankConversions()
  console.log(
    '🚀 ~ BankToBankConversions ~ bankToBankConversions:',
    bankToBankConversions
  )
  const { data: bankAccounts } = useGetBankAccounts()

  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetBankToBankConversionsType>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingConversionId, setDeletingConversionId] = useState<
    number | null
  >(null)
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
  const [editingConversion, setEditingConversion] =
    useState<GetBankToBankConversionsType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [fromBankAccountId, setFromBankAccountId] = useState<string>('')
  const [toBankAccountId, setToBankAccountId] = useState<string>('')

  const [formData, setFormData] = useState<CreateBankToBankConversionsType>({
    fromBankAccountId: 0,
    toBankAccountId: 0,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: null,
    createdBy: userData?.userId || 0,
  })

  const handleSort = (column: keyof GetBankToBankConversionsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredConversions = useMemo(() => {
    if (!bankToBankConversions?.data) return []
    return bankToBankConversions.data.filter((conversion: any) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        conversion.fromBankName?.toLowerCase().includes(searchLower) ||
        conversion.toBankName?.toLowerCase().includes(searchLower) ||
        conversion.fromAccountNumber?.toLowerCase().includes(searchLower) ||
        conversion.toAccountNumber?.toLowerCase().includes(searchLower) ||
        conversion.amount?.toString().toLowerCase().includes(searchLower) ||
        conversion.description?.toLowerCase().includes(searchLower)
      )
    })
  }, [bankToBankConversions?.data, searchTerm])

  const sortedConversions = useMemo(() => {
    return [...filteredConversions].sort((a, b) => {
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
  }, [filteredConversions, sortColumn, sortDirection])

  const paginatedConversions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedConversions.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedConversions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedConversions.length / itemsPerPage)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAdd = () => {
    setIsEditMode(false)
    setEditingConversion(null)
    resetForm()
    setIsPopupOpen(true)
  }

  const resetForm = useCallback(() => {
    setFormData({
      fromBankAccountId: 0,
      toBankAccountId: 0,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: null,
      createdBy: userData?.userId || 0,
    })
    setFromBankAccountId('')
    setToBankAccountId('')
    setIsPopupOpen(false)
    setIsEditMode(false)
    setEditingConversion(null)
  }, [userData?.userId, setIsPopupOpen, setIsEditMode, setEditingConversion])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddBankToBankConversion({
    onClose: closePopup,
    reset: resetForm,
  })

  const editMutation = useUpdateBankToBankConversion({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteBankToBankConversion({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Validation
      if (!fromBankAccountId || !toBankAccountId) {
        setError('Please select both bank accounts')
        return
      }

      if (fromBankAccountId === toBankAccountId) {
        setError('Source and destination bank accounts must be different')
        return
      }

      try {
        if (isEditMode && editingConversion) {
          if (
            editingConversion?.conversionId === undefined ||
            editingConversion?.createdBy === undefined
          )
            return

          const updatePayload = {
            fromBankAccountId: Number(fromBankAccountId),
            toBankAccountId: Number(toBankAccountId),
            amount: Number(formData.amount),
            date: formData.date, // Explicitly include date
            description: formData.description,
            updatedBy: userData?.userId || 0,
            createdBy: editingConversion.createdBy || 0,
          }

          console.log('[v0] Update payload:', updatePayload)

          editMutation.mutate({
            id: editingConversion.conversionId,
            data: updatePayload,
          })
        } else {
          addMutation.mutate({
            fromBankAccountId: Number(fromBankAccountId),
            toBankAccountId: Number(toBankAccountId),
            amount: Number(formData.amount),
            date: formData.date,
            description: formData.description,
            createdBy: userData?.userId || 0,
          })
        }
        resetForm()
      } catch (err) {
        setError('Failed to save conversion. Please try again.')
        console.error(err)
      }
    },
    [
      formData,
      fromBankAccountId,
      toBankAccountId,
      isEditMode,
      editingConversion,
      editMutation,
      addMutation,
      userData,
      resetForm
    ]
  )

  const handleEditClick = (conversion: any) => {
    setIsEditMode(true)
    setEditingConversion(conversion)
    setFromBankAccountId(conversion.fromBankAccountId.toString())
    setToBankAccountId(conversion.toBankAccountId.toString())
    const dateValue = conversion.date
      ? new Date(conversion.date).toISOString().split('T')[0]
      : ''
    setFormData({
      fromBankAccountId: conversion.fromBankAccountId,
      toBankAccountId: conversion.toBankAccountId,
      amount: conversion.amount,
      date: dateValue,
      description: conversion.description || null,
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
            <ArrowRightLeft className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Bank to Bank Conversions</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversions..."
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
                onClick={() => handleSort('fromBankName')}
                className="cursor-pointer"
              >
                From Bank <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('toBankName')}
                className="cursor-pointer"
              >
                To Bank <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('date')}
                className="cursor-pointer"
              >
                Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                onClick={() => handleSort('createdAt')}
                className="cursor-pointer"
              >
                Created At <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!bankToBankConversions ||
            bankToBankConversions.data === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading conversions...
                </TableCell>
              </TableRow>
            ) : !bankToBankConversions.data ||
              bankToBankConversions.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No conversions found
                </TableCell>
              </TableRow>
            ) : paginatedConversions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No conversions match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedConversions.map((conversion) => (
                <TableRow key={conversion.conversionId}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {conversion.fromBankName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conversion.fromAccountNumber} - {conversion.fromBranch}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">
                        {conversion.toBankName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conversion.toAccountNumber} - {conversion.toBranch}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatNumber(conversion.amount)}</TableCell>
                  <TableCell>{formatDate(new Date(conversion.date))}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {conversion.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(conversion.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(conversion)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingConversionId(conversion.conversionId ?? 0)
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

      {sortedConversions.length > 0 && (
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
        title={
          isEditMode
            ? 'Edit Bank to Bank Conversion'
            : 'Add Bank to Bank Conversion'
        }
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromBankAccountId">From Bank Account*</Label>
              <CustomCombobox
                items={
                  bankAccounts?.data?.map((b) => ({
                    id: b.bankAccountId?.toString() || '0',
                    name: `${b.bankName} - ${b.accountNumber} - ${b.branch}`,
                  })) || []
                }
                value={
                  bankAccounts?.data?.find(
                    (b) => b.bankAccountId?.toString() === fromBankAccountId
                  )
                    ? {
                        id:
                          bankAccounts?.data
                            ?.find(
                              (b) =>
                                b.bankAccountId?.toString() ===
                                fromBankAccountId
                            )
                            ?.bankAccountId?.toString() || '0',
                        name: bankAccounts?.data?.find(
                          (b) =>
                            b.bankAccountId?.toString() === fromBankAccountId
                        )
                          ? `${
                              bankAccounts.data.find(
                                (b) =>
                                  b.bankAccountId?.toString() ===
                                  fromBankAccountId
                              )?.bankName
                            } - ${
                              bankAccounts.data.find(
                                (b) =>
                                  b.bankAccountId?.toString() ===
                                  fromBankAccountId
                              )?.accountNumber
                            } - ${
                              bankAccounts.data.find(
                                (b) =>
                                  b.bankAccountId?.toString() ===
                                  fromBankAccountId
                              )?.branch
                            }`
                          : '',
                      }
                    : null
                }
                onChange={(item) => setFromBankAccountId(item?.id || '')}
                placeholder="Select source bank account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toBankAccountId">To Bank Account*</Label>
              <CustomCombobox
                items={
                  bankAccounts?.data?.map((b) => ({
                    id: b.bankAccountId?.toString() || '0',
                    name: `${b.bankName} - ${b.accountNumber} - ${b.branch}`,
                  })) || []
                }
                value={
                  bankAccounts?.data?.find(
                    (b) => b.bankAccountId?.toString() === toBankAccountId
                  )
                    ? {
                        id:
                          bankAccounts?.data
                            ?.find(
                              (b) =>
                                b.bankAccountId?.toString() === toBankAccountId
                            )
                            ?.bankAccountId?.toString() || '0',
                        name: bankAccounts?.data?.find(
                          (b) => b.bankAccountId?.toString() === toBankAccountId
                        )
                          ? `${
                              bankAccounts.data.find(
                                (b) =>
                                  b.bankAccountId?.toString() ===
                                  toBankAccountId
                              )?.bankName
                            } - ${
                              bankAccounts.data.find(
                                (b) =>
                                  b.bankAccountId?.toString() ===
                                  toBankAccountId
                              )?.accountNumber
                            } - ${
                              bankAccounts.data.find(
                                (b) =>
                                  b.bankAccountId?.toString() ===
                                  toBankAccountId
                              )?.branch
                            }`
                          : '',
                      }
                    : null
                }
                onChange={(item) => setToBankAccountId(item?.id || '')}
                placeholder="Select destination bank account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount*</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date*</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter description (optional)"
                rows={3}
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
            <AlertDialogTitle>Delete Bank to Bank Conversion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversion? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingConversionId) {
                  deleteMutation.mutate({ id: deletingConversionId })
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

export default BankToBankConversions
