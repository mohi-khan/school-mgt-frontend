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
  useGetBankMfsCash,
  useAddBankMfsCash,
  useUpdateBankMfsCash,
  useDeleteBankMfsCash,
  useGetBankAccounts,
  useGetMfss,
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
import type { CreateBankMfsCashType, GetBankMfsCashType } from '@/utils/type'
import { Textarea } from '@/components/ui/textarea'
import { CustomCombobox } from '@/utils/custom-combobox'

type TransferType = 'bank' | 'mfs' | 'cash'

const BankMfsCash = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: bankMfsCash } = useGetBankMfsCash()
  console.log("🚀 ~ BankMfsCash ~ bankMfsCash:", bankMfsCash)
  const { data: bankAccounts } = useGetBankAccounts()
  const { data: mfss } = useGetMfss()

  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetBankMfsCashType>('date')
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
    useState<GetBankMfsCashType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [fromType, setFromType] = useState<TransferType>('bank')
  const [toType, setToType] = useState<TransferType>('bank')

  const [fromBankAccountId, setFromBankAccountId] = useState<string>('')
  const [toBankAccountId, setToBankAccountId] = useState<string>('')
  const [fromMfsId, setFromMfsId] = useState<string>('')
  const [toMfsId, setToMfsId] = useState<string>('')

  const [formData, setFormData] = useState<CreateBankMfsCashType>({
    fromBankAccountId: undefined,
    toBankAccountId: undefined,
    fromMfsId: undefined,
    toMfsId: undefined,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: null,
    createdBy: userData?.userId || 0,
  })

  const handleSort = (column: keyof GetBankMfsCashType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredConversions = useMemo(() => {
    if (!bankMfsCash?.data) return []
    return bankMfsCash.data.filter((conversion: any) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        conversion.fromBankName?.toLowerCase().includes(searchLower) ||
        conversion.toBankName?.toLowerCase().includes(searchLower) ||
        conversion.fromAccountNumber?.toLowerCase().includes(searchLower) ||
        conversion.toAccountNumber?.toLowerCase().includes(searchLower) ||
        conversion.fromMfsAccountName?.toLowerCase().includes(searchLower) ||
        conversion.toMfsAccountName?.toLowerCase().includes(searchLower) ||
        conversion.fromMfsNumber?.toLowerCase().includes(searchLower) ||
        conversion.toMfsNumber?.toLowerCase().includes(searchLower) ||
        conversion.amount?.toString().toLowerCase().includes(searchLower) ||
        conversion.description?.toLowerCase().includes(searchLower)
      )
    })
  }, [bankMfsCash?.data, searchTerm])

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
      fromBankAccountId: undefined,
      toBankAccountId: undefined,
      fromMfsId: undefined,
      toMfsId: undefined,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: null,
      createdBy: userData?.userId || 0,
    })
    setFromType('bank')
    setToType('bank')
    setFromBankAccountId('')
    setToBankAccountId('')
    setFromMfsId('')
    setToMfsId('')
    setIsPopupOpen(false)
    setIsEditMode(false)
    setEditingConversion(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddBankMfsCash({
    onClose: closePopup,
    reset: resetForm,
  })

  const editMutation = useUpdateBankMfsCash({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteBankMfsCash({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (fromType === 'bank' && !fromBankAccountId) {
        setError('Please select from bank account')
        return
      }
      if (fromType === 'mfs' && !fromMfsId) {
        setError('Please select from MFS account')
        return
      }

      if (toType === 'bank' && !toBankAccountId) {
        setError('Please select to bank account')
        return
      }
      if (toType === 'mfs' && !toMfsId) {
        setError('Please select to MFS account')
        return
      }

      if (
        fromType === 'bank' &&
        toType === 'bank' &&
        fromBankAccountId === toBankAccountId
      ) {
        setError('Source and destination bank accounts must be different')
        return
      }

      if (fromType === 'mfs' && toType === 'mfs' && fromMfsId === toMfsId) {
        setError('Source and destination MFS accounts must be different')
        return
      }

      if (fromType === 'cash' && toType === 'cash') {
        setError('Cannot transfer from cash to cash')
        return
      }

      try {
        const payload: any = {
          fromBankAccountId:
            fromType === 'bank' ? Number(fromBankAccountId) : undefined,
          toBankAccountId:
            toType === 'bank' ? Number(toBankAccountId) : undefined,
          fromMfsId: fromType === 'mfs' ? Number(fromMfsId) : undefined,
          toMfsId: toType === 'mfs' ? Number(toMfsId) : undefined,
          amount: Number(formData.amount),
          date: formData.date,
          description: formData.description,
          createdBy: userData?.userId || 0,
        }

        if (isEditMode && editingConversion) {
          if (
            editingConversion?.id === undefined ||
            editingConversion?.createdBy === undefined
          )
            return

          const updatePayload = {
            ...payload,
            updatedBy: userData?.userId || 0,
            createdBy: editingConversion.createdBy || 0,
          }

          console.log('[v0] Update payload:', updatePayload)

          editMutation.mutate({
            id: editingConversion.id,
            data: updatePayload,
          })
        } else {
          addMutation.mutate(payload)
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
      fromMfsId,
      toMfsId,
      fromType,
      toType,
      isEditMode,
      editingConversion,
      editMutation,
      addMutation,
      userData,
      resetForm,
    ]
  )

  const handleEditClick = (conversion: any) => {
    setIsEditMode(true)
    setEditingConversion(conversion)

    if (conversion.fromBankAccountId) {
      setFromType('bank')
      setFromBankAccountId(conversion.fromBankAccountId.toString())
    } else if (conversion.fromMfsId) {
      setFromType('mfs')
      setFromMfsId(conversion.fromMfsId?.toString() || '')
    } else {
      setFromType('cash')
    }

    if (conversion.toBankAccountId) {
      setToType('bank')
      setToBankAccountId(conversion.toBankAccountId.toString())
    } else if (conversion.toMfsId) {
      setToType('mfs')
      setToMfsId(conversion.toMfsId?.toString() || '')
    } else {
      setToType('cash')
    }

    const dateValue = conversion.date
      ? new Date(conversion.date).toISOString().split('T')[0]
      : ''
    setFormData({
      fromBankAccountId: conversion.fromBankAccountId,
      toBankAccountId: conversion.toBankAccountId,
      fromMfsId: conversion.fromMfsId,
      toMfsId: conversion.toMfsId,
      amount: conversion.amount,
      date: dateValue,
      description: conversion.description || null,
      createdBy: userData?.userId || 0,
      updatedBy: userData?.userId || 0,
    })
    setIsPopupOpen(true)
  }

  const getAvailableToTypes = (): TransferType[] => {
    if (fromType === 'cash') {
      return ['bank', 'mfs']
    }
    return ['bank', 'mfs', 'cash']
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <ArrowRightLeft className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Bank MFS Cash</h2>
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
                onClick={() => handleSort('fromMfsAccountName')}
                className="cursor-pointer"
              >
                From MFS <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('toBankName')}
                className="cursor-pointer"
              >
                To Bank <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('toMfsAccountName')}
                className="cursor-pointer"
              >
                To MFS <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!bankMfsCash ||
            bankMfsCash.data === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading conversions...
                </TableCell>
              </TableRow>
            ) : !bankMfsCash.data ||
              bankMfsCash.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No conversions found
                </TableCell>
              </TableRow>
            ) : paginatedConversions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No conversions match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedConversions.map((conversion) => (
                <TableRow key={conversion.id}>
                  <TableCell className="font-medium">
                    {conversion.fromBankName ? (
                      <div>
                        <div className="font-semibold">
                          {conversion.fromBankName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversion.fromBankAccountNumber} -{' '}
                          {conversion.fromBankBranch}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversion.fromMfsAccountName ? (
                      <div>
                        <div className="font-semibold">
                          {conversion.fromMfsAccountName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversion.fromMfsNumber} ({conversion.fromMfsType})
                        </div>
                      </div>
                    ) : conversion.fromBankName ? (
                      <div className="text-muted-foreground">-</div>
                    ) : (
                      <div className="font-semibold text-amber-600">Cash</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversion.toBankName ? (
                      <div>
                        <div className="font-semibold">
                          {conversion.toBankName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversion.toBankAccountNumber} - {conversion.toBankBranch}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversion.toMfsAccountName ? (
                      <div>
                        <div className="font-semibold">
                          {conversion.toMfsAccountName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversion.toMfsNumber} ({conversion.toMfsType})
                        </div>
                      </div>
                    ) : conversion.toBankName ? (
                      <div className="text-muted-foreground">-</div>
                    ) : (
                      <div className="font-semibold text-amber-600">Cash</div>
                    )}
                  </TableCell>
                  <TableCell>{formatNumber(conversion.amount)}</TableCell>
                  <TableCell>{formatDate(new Date(conversion.date))}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {conversion.description || '-'}
                    </div>
                  </TableCell>
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
                          setDeletingConversionId(conversion.id ?? 0)
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
            ? 'Edit Bank MFS Cash Transfer'
            : 'Add Bank MFS Cash Transfer'
        }
        size="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>From Type*</Label>
              <div className="flex gap-4">
                {(['bank', 'mfs', 'cash'] as const).map((type) => (
                  <label
                    key={`from-${type}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="fromType"
                      value={type}
                      checked={fromType === type}
                      onChange={(e) => {
                        setFromType(e.target.value as TransferType)
                        setFromBankAccountId('')
                        setFromMfsId('')
                      }}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {fromType === 'bank' && (
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
                          id: fromBankAccountId,
                          name: `${
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
                          }`,
                        }
                      : null
                  }
                  onChange={(item) => setFromBankAccountId(item?.id || '')}
                  placeholder="Select source bank account"
                />
              </div>
            )}

            {fromType === 'mfs' && (
              <div className="space-y-2">
                <Label htmlFor="fromMfsId">From MFS Account*</Label>
                <CustomCombobox
                  items={
                    mfss?.data?.map((m) => ({
                      id: m.mfsId?.toString() || '0',
                      name: `${m.accountName} - ${m.mfsNumber} (${m.mfsType})`,
                    })) || []
                  }
                  value={
                    mfss?.data?.find((m) => m.mfsId?.toString() === fromMfsId)
                      ? {
                          id: fromMfsId,
                          name: `${mfss.data.find((m) => m.mfsId?.toString() === fromMfsId)?.accountName} - ${
                            mfss.data.find(
                              (m) => m.mfsId?.toString() === fromMfsId
                            )?.mfsNumber
                          } (${mfss.data.find((m) => m.mfsId?.toString() === fromMfsId)?.mfsType})`,
                        }
                      : null
                  }
                  onChange={(item) => setFromMfsId(item?.id || '')}
                  placeholder="Select source MFS account"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>To Type*</Label>
              <div className="flex gap-4">
                {getAvailableToTypes().map((type) => (
                  <label
                    key={`to-${type}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="toType"
                      value={type}
                      checked={toType === type}
                      onChange={(e) => {
                        setToType(e.target.value as TransferType)
                        setToBankAccountId('')
                        setToMfsId('')
                      }}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {toType === 'bank' && (
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
                          id: toBankAccountId,
                          name: `${
                            bankAccounts.data.find(
                              (b) =>
                                b.bankAccountId?.toString() === toBankAccountId
                            )?.bankName
                          } - ${
                            bankAccounts.data.find(
                              (b) =>
                                b.bankAccountId?.toString() === toBankAccountId
                            )?.accountNumber
                          } - ${
                            bankAccounts.data.find(
                              (b) =>
                                b.bankAccountId?.toString() === toBankAccountId
                            )?.branch
                          }`,
                        }
                      : null
                  }
                  onChange={(item) => setToBankAccountId(item?.id || '')}
                  placeholder="Select destination bank account"
                />
              </div>
            )}

            {toType === 'mfs' && (
              <div className="space-y-2">
                <Label htmlFor="toMfsId">To MFS Account*</Label>
                <CustomCombobox
                  items={
                    mfss?.data?.map((m) => ({
                      id: m.mfsId?.toString() || '0',
                      name: `${m.accountName} - ${m.mfsNumber} (${m.mfsType})`,
                    })) || []
                  }
                  value={
                    mfss?.data?.find((m) => m.mfsId?.toString() === toMfsId)
                      ? {
                          id: toMfsId,
                          name: `${mfss.data.find((m) => m.mfsId?.toString() === toMfsId)?.accountName} - ${
                            mfss.data.find(
                              (m) => m.mfsId?.toString() === toMfsId
                            )?.mfsNumber
                          } (${mfss.data.find((m) => m.mfsId?.toString() === toMfsId)?.mfsType})`,
                        }
                      : null
                  }
                  onChange={(item) => setToMfsId(item?.id || '')}
                  placeholder="Select destination MFS account"
                />
              </div>
            )}

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
            <AlertDialogTitle>Delete Bank MFS Cash Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transfer? This action cannot
              be undone.
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

export default BankMfsCash
