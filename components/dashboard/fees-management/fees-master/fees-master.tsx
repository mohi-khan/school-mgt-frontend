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
import type { CreateFeesMasterType, GetFeesMasterType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import {
  formatDate,
  formatDateForInput,
  formatNumber,
} from '@/utils/conversions'
import {
  useAddFeesMaster,
  useGetFeesMasters,
  useUpdateFeesMaster,
  useDeleteFeesMaster,
  useGetFeesTypes,
  useGetFeesGroups,
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

const FeesMaster = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: feesMasters } = useGetFeesMasters()
  const { data: feesTypes } = useGetFeesTypes()
  const { data: feesGroups } = useGetFeesGroups()

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetFeesMasterType>('dueDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingFeesMasterId, setEditingFeesMasterId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingFeesMasterId, setDeletingFeesMasterId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateFeesMasterType>({
    feesGroupId: null,
    feesTypeId: null,
    dueDate: new Date().toISOString().split('T')[0],
    amount: 0,
    fineType: 'none',
    percentageFineAmount: null,
    fixedFineAmount: null,
    perDay: false,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }))
    } else if (type === 'date') {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData((prev) => ({ ...prev, [name]: target.checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'fineType') {
      setFormData((prev) => ({
        ...prev,
        [name]: value as 'none' | 'percentage' | 'fixed amount',
        percentageFineAmount:
          value === 'percentage' ? prev.percentageFineAmount : null,
        fixedFineAmount: value === 'fixed amount' ? prev.fixedFineAmount : null,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : null,
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      feesGroupId: null,
      feesTypeId: null,
      dueDate: new Date().toISOString().split('T')[0],
      amount: 0,
      fineType: 'none',
      percentageFineAmount: null,
      fixedFineAmount: null,
      perDay: false,
    })
    setEditingFeesMasterId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddFeesMaster({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateFeesMaster({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteFeesMaster({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetFeesMasterType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredFeesMasters = useMemo(() => {
    if (!feesMasters?.data) return []
    return feesMasters.data.filter((fees: GetFeesMasterType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        fees.amount?.toString().includes(searchLower) ||
        fees.fineType?.toLowerCase().includes(searchLower) ||
        fees.dueDate?.toString().includes(searchLower)
      )
    })
  }, [feesMasters?.data, searchTerm])

  const sortedFeesMasters = useMemo(() => {
    return [...filteredFeesMasters].sort((a, b) => {
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
  }, [filteredFeesMasters, sortColumn, sortDirection])

  const paginatedFeesMasters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedFeesMasters.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedFeesMasters, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedFeesMasters.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.amount || formData.amount === 0) {
      setError('Please enter amount')
      return
    }

    if (
      formData.fineType === 'percentage' &&
      (!formData.percentageFineAmount || formData.percentageFineAmount === 0)
    ) {
      setError('Please enter percentage fine amount')
      return
    }

    if (
      formData.fineType === 'fixed amount' &&
      (!formData.fixedFineAmount || formData.fixedFineAmount === 0)
    ) {
      setError('Please enter fixed fine amount')
      return
    }

    try {
      if (isEditMode && editingFeesMasterId) {
        updateMutation.mutate({
          id: editingFeesMasterId,
          data: formData,
        })
      } else {
        addMutation.mutate(formData)
      }
    } catch (err) {
      setError('Failed to save fees master')
      console.error(err)
    }
  }

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving fees master')
    }
  }, [addMutation.error, updateMutation.error])

  useEffect(() => {
    let calculatedFineAmount = 0

    if (formData.fineType === 'percentage' && formData.percentageFineAmount) {
      calculatedFineAmount =
        formData.amount +
        (formData.amount * formData.percentageFineAmount) / 100
    } else if (
      formData.fineType === 'fixed amount' &&
      formData.fixedFineAmount
    ) {
      calculatedFineAmount = formData.amount + formData.fixedFineAmount
    } else if (formData.fineType === 'none') {
      calculatedFineAmount = formData.amount
    }

    setFormData((prev) => ({
      ...prev,
      fineAmount: calculatedFineAmount,
    }))
  }, [
    formData.amount,
    formData.fineType,
    formData.percentageFineAmount,
    formData.fixedFineAmount,
  ])

  const handleEditClick = (fees: GetFeesMasterType) => {
    setFormData({
      feesGroupId: fees.feesGroupId ?? null,
      feesTypeId: fees.feesTypeId ?? null,
      dueDate: formatDateForInput(fees.dueDate),
      amount: fees.amount,
      fineType: fees.fineType,
      percentageFineAmount: fees.percentageFineAmount ?? null,
      fixedFineAmount: fees.fixedFineAmount ?? null,
      perDay: fees.perDay ?? false,
    })
    setEditingFeesMasterId(fees.feesMasterId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (feesMasterId: number) => {
    setDeletingFeesMasterId(feesMasterId)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Fees Master</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search fees..."
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
                onClick={() => handleSort('feesGroupName')}
                className="cursor-pointer"
              >
                Fees Group <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('feesTypeName')}
                className="cursor-pointer"
              >
                Fees Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('fineType')}
                className="cursor-pointer"
              >
                Fine Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('dueDate')}
                className="cursor-pointer"
              >
                Due Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Per Day <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!feesMasters?.data ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading fees masters...
                </TableCell>
              </TableRow>
            ) : feesMasters.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No fees masters found
                </TableCell>
              </TableRow>
            ) : paginatedFeesMasters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No fees masters match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedFeesMasters.map((fees) => (
                <TableRow key={fees.feesMasterId}>
                  <TableCell className="capitalize">
                    {fees.feesGroupName}
                  </TableCell>
                  <TableCell className="capitalize">
                    {fees.feesTypeName}
                  </TableCell>
                  <TableCell className="capitalize">{fees.fineType}</TableCell>
                  <TableCell>{formatDate(new Date(fees.dueDate))}</TableCell>
                  <TableCell>{formatNumber(fees.amount.toFixed(2))}</TableCell>
                  <TableCell>{fees.perDay ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(fees)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          handleDeleteClick(fees.feesMasterId || 0)
                        }
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
      {sortedFeesMasters.length > 0 && (
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

      {/* Fees Master Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={resetForm}
        title={isEditMode ? 'Edit Fees Master' : 'Add Fees Master'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fees Group */}
            <div className="space-y-2">
              <Label htmlFor="feesGroupId">Fees Group</Label>
              <CustomCombobox
                items={
                  feesGroups?.data?.map((group) => ({
                    id: group?.feesGroupId?.toString() || '0',
                    name: group.groupName || 'Unnamed group',
                  })) || []
                }
                value={
                  formData.feesGroupId
                    ? {
                        id: formData.feesGroupId.toString(),
                        name:
                          feesGroups?.data?.find(
                            (g) => g.feesGroupId === formData.feesGroupId
                          )?.groupName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'feesGroupId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select fees group"
              />
            </div>

            {/* Fees Type */}
            <div className="space-y-2">
              <Label htmlFor="feesTypeId">Fees Type</Label>
              <CustomCombobox
                items={
                  feesTypes?.data?.map((type) => ({
                    id: type?.feesTypeId?.toString() || '0',
                    name: type.typeName || 'Unnamed type',
                  })) || []
                }
                value={
                  formData.feesTypeId
                    ? {
                        id: formData.feesTypeId.toString(),
                        name:
                          feesTypes?.data?.find(
                            (t) => t.feesTypeId === formData.feesTypeId
                          )?.typeName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'feesTypeId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select fees type"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>

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

            {/* Fine Type */}
            <div className="space-y-2">
              <Label htmlFor="fineType">Fine Type</Label>
              <Select
                name="fineType"
                value={formData.fineType}
                onValueChange={(value) => handleSelectChange('fineType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Percentage Fine Amount */}
            {formData.fineType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="percentageFineAmount">
                  Percentage Fine Amount
                </Label>
                <Input
                  id="percentageFineAmount"
                  name="percentageFineAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.percentageFineAmount ?? ''}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Fixed Fine Amount */}
            {formData.fineType === 'fixed amount' && (
              <div className="space-y-2">
                <Label htmlFor="fixedFineAmount">Fixed Fine Amount</Label>
                <Input
                  id="fixedFineAmount"
                  name="fixedFineAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixedFineAmount ?? ''}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Per Day */}
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2">
                <Input
                  id="perDay"
                  name="perDay"
                  type="checkbox"
                  checked={formData.perDay || false}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="perDay" className="mb-0">
                  Per Day
                </Label>
              </div>
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
            <AlertDialogTitle>Delete Fees Master</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fees master? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFeesMasterId) {
                  deleteMutation.mutate({ id: deletingFeesMasterId })
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

export default FeesMaster
