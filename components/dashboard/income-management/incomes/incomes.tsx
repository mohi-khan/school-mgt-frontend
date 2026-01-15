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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { CreateIncomesType, GetIncomesType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  formatDate,
  formatDateForInput,
  formatNumber,
} from '@/utils/conversions'
import {
  useAddIncome,
  useGetIncomes,
  useUpdateIncome,
  useDeleteIncome,
  useGetIncomeHeads,
  useGetBankAccounts,
  useGetMfss,
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
import { Textarea } from '@/components/ui/textarea'

const Incomes = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: incomes } = useGetIncomes()
  console.log('🚀 ~ Incomes ~ incomes:', incomes)
  const { data: incomeHeads } = useGetIncomeHeads()
  const { data: bankAccounts } = useGetBankAccounts()
  const { data: mfsData } = useGetMfss()

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetIncomesType>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingIncomeId, setDeletingIncomeId] = useState<number | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<string>('')

  const [formData, setFormData] = useState<CreateIncomesType>({
    incomeHeadId: 0,
    name: '',
    invoiceNumber: 0,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: null,
    method: 'cash',
    bankAccountId: null,
    mfsId: null,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }))
    } else if (type === 'date') {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setFormData({
      incomeHeadId: 0,
      name: '',
      invoiceNumber: 0,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: null,
      method: 'cash',
      bankAccountId: null,
      mfsId: null,
      createdBy: userData?.userId || 0,
    })
    setEditingIncomeId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddIncome({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateIncome({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteIncome({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetIncomesType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'method') {
      const paymentMethod = value as CreateIncomesType['method']
      setFormData((prev) => ({
        ...prev,
        method: paymentMethod,
        bankAccountId: null,
        mfsId: null,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const filteredIncomes = useMemo(() => {
    if (!incomes?.data) return []
    return incomes.data.filter((income: GetIncomesType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        income.name?.toLowerCase().includes(searchLower) ||
        income.invoiceNumber?.toString().includes(searchLower) ||
        income.amount?.toString().includes(searchLower) ||
        income.incomeHead?.toLowerCase().includes(searchLower)
      )
    })
  }, [incomes?.data, searchTerm])

  const sortedIncomes = useMemo(() => {
    return [...filteredIncomes].sort((a, b) => {
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
  }, [filteredIncomes, sortColumn, sortDirection])

  const paginatedIncomes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedIncomes.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedIncomes, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedIncomes.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || formData.name.trim() === '') {
      setError('Please enter name')
      return
    }

    if (!formData.invoiceNumber || formData.invoiceNumber === 0) {
      setError('Please enter invoice number')
      return
    }

    if (!formData.amount || formData.amount === 0) {
      setError('Please enter amount')
      return
    }

    try {
      const submitData = {
        ...formData,
        createdBy: userData?.userId || 0,
      }

      if (isEditMode && editingIncomeId) {
        updateMutation.mutate({
          id: editingIncomeId,
          data: submitData,
        })
      } else {
        addMutation.mutate(submitData)
      }
    } catch (err) {
      setError('Failed to save income')
      console.error(err)
    }
  }

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving income')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (income: GetIncomesType) => {
    setFormData({
      incomeHeadId: income.incomeHeadId ?? null,
      name: income.name,
      invoiceNumber: income.invoiceNumber,
      date: formatDateForInput(income.date),
      amount: income.amount,
      description: income.description ?? null,
      method: income.method,
      bankAccountId: income.bankAccountId,
      mfsId: income.mfsId,
      createdBy: userData?.userId || 0,
    })
    setEditingIncomeId(income.incomeId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (incomeId: number) => {
    setDeletingIncomeId(incomeId)
    setIsDeleteDialogOpen(true)
  }

  const filteredMfsAccounts = useMemo(() => {
    if (
      !mfsData?.data ||
      !['bkash', 'nagad', 'rocket'].includes(paymentMethod)
    ) {
      return []
    }
    return mfsData.data
      .filter((mfs: any) => mfs.mfsType === paymentMethod)
      .map((mfs: any) => ({
        id: mfs.mfsId?.toString() || '0',
        name: `${mfs.accountName} - ${mfs.mfsNumber}`,
      }))
  }, [mfsData, paymentMethod])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Incomes</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search incomes..."
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
                onClick={() => handleSort('name')}
                className="cursor-pointer"
              >
                Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('incomeHead')}
                className="cursor-pointer"
              >
                Income Head <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('invoiceNumber')}
                className="cursor-pointer"
              >
                Invoice Number <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('date')}
                className="cursor-pointer"
              >
                Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('method')}
                className="cursor-pointer"
              >
                Method <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('bankAccountId')}
                className="cursor-pointer"
              >
                Bank Account Details
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('bankAccountId')}
                className="cursor-pointer"
              >
                MFS Details
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!incomes?.data ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading incomes...
                </TableCell>
              </TableRow>
            ) : incomes.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No incomes found
                </TableCell>
              </TableRow>
            ) : paginatedIncomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No incomes match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedIncomes.map((income) => (
                <TableRow key={income.incomeId}>
                  <TableCell className="capitalize">{income.name}</TableCell>
                  <TableCell className="capitalize">
                    {income.incomeHead || 'N/A'}
                  </TableCell>
                  <TableCell>{income.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(new Date(income.date))}</TableCell>
                  <TableCell>{income.method}</TableCell>
                  <TableCell>
                    {income.bankName && income.branch && income.accountNumber
                      ? `${income.bankName} - ${income.branch} - ${income.accountNumber}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {income.mfsNumber && income.accountName ? `${income.accountName} - ${income.mfsNumber}` : '-'}
                  </TableCell>
                  <TableCell>
                    {formatNumber(income.amount.toFixed(2))}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(income)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteClick(income.incomeId || 0)}
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
      {sortedIncomes.length > 0 && (
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

      {/* Income Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={resetForm}
        title={isEditMode ? 'Edit Income' : 'Add Income'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Income Head */}
            <div className="space-y-2">
              <Label htmlFor="incomeHeadId">Income Head</Label>
              <CustomCombobox
                items={
                  incomeHeads?.data?.map((head) => ({
                    id: head?.incomeHeadId?.toString() || '0',
                    name: head.incomeHead || 'Unnamed head',
                  })) || []
                }
                value={
                  formData.incomeHeadId
                    ? {
                        id: formData.incomeHeadId.toString(),
                        name:
                          incomeHeads?.data?.find(
                            (h) => h.incomeHeadId === formData.incomeHeadId
                          )?.incomeHead || '',
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    incomeHeadId: value ? Number(value.id) : 0,
                  }))
                }
                placeholder="Select income head"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">
                Money Receit Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                type="number"
                min="1"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="method">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select
                name="method"
                value={formData.method}
                onValueChange={(value) => {
                  handleSelectChange('method', value)
                  setPaymentMethod(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'bank' && (
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account</Label>
                <CustomCombobox
                  items={
                    bankAccounts?.data?.map((b) => ({
                      id: b.bankAccountId?.toString() || '0',
                      name: `${b.bankName} - ${b.accountNumber} - ${b.branch}`,
                    })) || []
                  }
                  value={
                    formData.bankAccountId
                      ? {
                          id: formData.bankAccountId.toString(),
                          name: bankAccounts?.data?.find(
                            (b) => b.bankAccountId === formData.bankAccountId
                          )
                            ? `${bankAccounts.data.find((b) => b.bankAccountId === formData.bankAccountId)?.bankName} - ${bankAccounts.data.find((b) => b.bankAccountId === formData.bankAccountId)?.accountNumber}`
                            : '',
                        }
                      : null
                  }
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankAccountId: value ? Number(value.id) : 0,
                    }))
                  }
                  placeholder="Select bank account"
                />
              </div>
            )}

            {['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
              <div className="space-y-2">
                <Label htmlFor="mfsAccount">MFS Account</Label>
                <CustomCombobox
                  items={filteredMfsAccounts}
                  value={
                    formData.mfsId
                      ? {
                          id: formData.mfsId.toString(),
                          name: mfsData?.data?.find(
                            (h) => h.mfsId === formData.mfsId
                          )
                            ? `${mfsData.data.find((h) => h.mfsId === formData.mfsId)?.accountName} - ${mfsData.data.find((h) => h.mfsId === formData.mfsId)?.mfsNumber}`
                            : '',
                        }
                      : null
                  }
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      mfsId: value ? Number(value.id) : 0,
                    }))
                  }
                  placeholder={`Select ${paymentMethod} account`}
                />
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
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
            <AlertDialogTitle>Delete Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingIncomeId) {
                  deleteMutation.mutate({ id: deletingIncomeId })
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

export default Incomes
