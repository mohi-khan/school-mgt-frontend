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
import {
  Search,
  DollarSign,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')

  const [expandedParentGroups, setExpandedParentGroups] = useState<Set<string>>(
    new Set()
  )

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingFeesMasterId, setEditingFeesMasterId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingFeesMasterId, setDeletingFeesMasterId] = useState<
    number | null
  >(null)

  const [isCopyPopupOpen, setIsCopyPopupOpen] = useState(false)
  const [selectedGroupForCopy, setSelectedGroupForCopy] = useState<{
    feesGroupId: number
    feesGroupName: string
    year: number
  } | null>(null)
  const [copySubjects, setCopySubjects] = useState<
    Array<{
      feesGroupId: number | null
      feesGroupName: string
      feesTypeId: number | null
      feesTypeName: string
      dueDate: string
      amount: number
      fineType: 'none' | 'percentage' | 'fixed amount'
      percentageFineAmount: number | null
      fixedFineAmount: number | null
      perDay: boolean
    }>
  >([])

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

  const filteredFeesMasters = useMemo(() => {
    if (!feesMasters?.data) return []
    return feesMasters.data.filter((fees: GetFeesMasterType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        fees.feesGroupName?.toLowerCase().includes(searchLower) ||
        fees.feesTypeName?.toLowerCase().includes(searchLower) ||
        fees.fineType?.toLowerCase().includes(searchLower) ||
        fees.amount?.toString().includes(searchLower)
      )
    })
  }, [feesMasters?.data, searchTerm])

  // Two-level grouping: feesGroup + year
  const hierarchicalGroups = useMemo(() => {
    const parentGroups = new Map<
      string,
      {
        feesGroupId: number
        feesGroupName: string
        year: number
        fees: GetFeesMasterType[]
        latestCreatedAt: Date
      }
    >()

    const sortedFees = [...filteredFeesMasters].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    sortedFees.forEach((fee) => {
      const year = fee.dueDate ? new Date(fee.dueDate).getFullYear() : 0
      const parentKey = `${fee.feesGroupId || 0}-${year}`

      if (!parentGroups.has(parentKey)) {
        parentGroups.set(parentKey, {
          feesGroupId: fee.feesGroupId || 0,
          feesGroupName: fee.feesGroupName || 'Unassigned',
          year,
          fees: [],
          latestCreatedAt: fee.createdAt
            ? new Date(fee.createdAt)
            : new Date(0),
        })
      }

      const group = parentGroups.get(parentKey)!
      group.fees.push(fee)

      if (fee.createdAt) {
        const d = new Date(fee.createdAt)
        if (d > group.latestCreatedAt) group.latestCreatedAt = d
      }
    })

    return Array.from(parentGroups.values()).sort(
      (a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime()
    )
  }, [filteredFeesMasters])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return hierarchicalGroups.slice(startIndex, startIndex + itemsPerPage)
  }, [hierarchicalGroups, currentPage, itemsPerPage])

  const totalPages = Math.ceil(hierarchicalGroups.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
        updateMutation.mutate({ id: editingFeesMasterId, data: formData })
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
    } else {
      calculatedFineAmount = formData.amount
    }
    setFormData((prev) => ({ ...prev, fineAmount: calculatedFineAmount }))
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

  const toggleParentGroupExpanded = (groupKey: string) => {
    setExpandedParentGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const handleCopyClick = (group: (typeof hierarchicalGroups)[number]) => {
    const targetYear = group.year + 1
    const subjects = group.fees.map((fee) => {
      // Keep same month/day, change year to next year of the source data
      const originalDate = new Date(fee.dueDate)
      const newDate = new Date(originalDate)
      newDate.setFullYear(targetYear)
      const newDateStr = newDate.toISOString().split('T')[0]

      return {
        feesGroupId: fee.feesGroupId ?? null,
        feesGroupName: fee.feesGroupName || 'Unassigned',
        feesTypeId: fee.feesTypeId ?? null,
        feesTypeName: fee.feesTypeName || '',
        dueDate: newDateStr,
        amount: fee.amount,
        fineType: fee.fineType as 'none' | 'percentage' | 'fixed amount',
        percentageFineAmount: fee.percentageFineAmount ?? null,
        fixedFineAmount: fee.fixedFineAmount ?? null,
        perDay: fee.perDay ?? false,
      }
    })

    setSelectedGroupForCopy({
      feesGroupId: group.feesGroupId,
      feesGroupName: group.feesGroupName,
      year: targetYear,
    })
    setCopySubjects(subjects)
    setIsCopyPopupOpen(true)
  }

  const handleCopyFieldChange = (
    index: number,
    field: string,
    value: string | number | boolean
  ) => {
    setCopySubjects((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        // Clear fine amounts when fineType changes
        if (field === 'fineType') {
          updated.percentageFineAmount =
            value === 'percentage' ? item.percentageFineAmount : null
          updated.fixedFineAmount =
            value === 'fixed amount' ? item.fixedFineAmount : null
        }
        return updated
      })
    )
  }

  const handleCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const promises = copySubjects.map((subject) => {
        const data: CreateFeesMasterType = {
          feesGroupId: subject.feesGroupId,
          feesTypeId: subject.feesTypeId,
          dueDate: subject.dueDate,
          amount: subject.amount,
          fineType: subject.fineType,
          percentageFineAmount: subject.percentageFineAmount,
          fixedFineAmount: subject.fixedFineAmount,
          perDay: subject.perDay,
        }
        return addMutation.mutateAsync(data)
      })
      await Promise.all(promises)
      setIsCopyPopupOpen(false)
      setSelectedGroupForCopy(null)
      setCopySubjects([])
    } catch (err) {
      setError('Failed to copy fees master entries')
      console.error(err)
    }
  }

  const resetCopyForm = () => {
    setIsCopyPopupOpen(false)
    setSelectedGroupForCopy(null)
    setCopySubjects([])
    setError(null)
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

      {/* Hierarchical Display */}
      <div className="space-y-4">
        {!feesMasters?.data ? (
          <div className="text-center py-8 text-gray-600">
            Loading fees masters...
          </div>
        ) : feesMasters.data.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No fees masters found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No fees masters match your search
          </div>
        ) : (
          paginatedGroups.map((group) => {
            const parentKey = `${group.feesGroupId}-${group.year}`
            const isExpanded = expandedParentGroups.has(parentKey)

            return (
              <div
                key={parentKey}
                className="rounded-lg border-2 border-amber-300 overflow-hidden shadow-md"
              >
                {/* Group Header */}
                <div
                  className="bg-gradient-to-r from-amber-100 to-amber-50 p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleParentGroupExpanded(parentKey)}
                >
                  <button className="p-1 hover:bg-amber-200 rounded-md transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6 text-amber-700" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-amber-700" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg">
                      {group.feesGroupName}{' '}
                      <span className="text-amber-700">({group.year})</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1 flex gap-4">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-gray-600">Total Entries:</span>
                        <span className="font-medium text-amber-700">
                          {group.fees.length}
                        </span>
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyClick(group)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>

                {/* Fees Table */}
                {isExpanded && (
                  <div className="bg-white border-t border-amber-200 p-3">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="text-gray-700 font-semibold">
                            Fees Type
                          </TableHead>
                          <TableHead className="text-gray-700 font-semibold">
                            Fine Type
                          </TableHead>
                          <TableHead className="text-gray-700 font-semibold">
                            Due Date
                          </TableHead>
                          <TableHead className="text-gray-700 font-semibold">
                            Amount
                          </TableHead>
                          <TableHead className="text-gray-700 font-semibold">
                            Per Day
                          </TableHead>
                          <TableHead className="text-gray-700 font-semibold text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.fees.map((fee) => (
                          <TableRow
                            key={fee.feesMasterId}
                            className="hover:bg-amber-50"
                          >
                            <TableCell className="capitalize font-medium text-gray-800">
                              {fee.feesTypeName || '-'}
                            </TableCell>
                            <TableCell className="capitalize text-gray-700">
                              {fee.fineType}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {formatDate(new Date(fee.dueDate))}
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800">
                              {formatNumber(fee.amount.toFixed(2))}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {fee.perDay ? 'Yes' : 'No'}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => handleEditClick(fee)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleDeleteClick(fee.feesMasterId || 0)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {hierarchicalGroups.length > 0 && (
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

      {/* Add/Edit Fees Master Popup */}
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

      {/* Copy Fees Popup */}
      <Popup
        isOpen={isCopyPopupOpen}
        onClose={resetCopyForm}
        title={`Copy Fees from ${selectedGroupForCopy?.feesGroupName} (${selectedGroupForCopy ? selectedGroupForCopy.year - 1 : ''}) → ${selectedGroupForCopy?.year}`}
        size="sm:max-w-5xl"
      >
        <form onSubmit={handleCopySubmit} className="space-y-4 py-4">
          <p className="text-sm text-gray-600 pb-2 border-b">
            Copying{' '}
            <span className="font-semibold text-amber-700">
              {copySubjects.length}
            </span>{' '}
            entries to year{' '}
            <span className="font-semibold text-amber-700">
              {selectedGroupForCopy?.year}
            </span>
            . Due dates keep the same month &amp; day with the year updated to{' '}
            {selectedGroupForCopy?.year}. You can edit any field below before
            saving.
          </p>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {copySubjects.map((subject, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
              >
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="bg-amber-500 text-white px-2 py-1 rounded text-xs">
                    {index + 1}
                  </span>
                  {subject.feesGroupName}
                  {subject.feesTypeName && (
                    <span className="text-sm font-normal text-gray-600">
                      — {subject.feesTypeName}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {/* Due Date */}
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Due Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={subject.dueDate}
                      onChange={(e) =>
                        handleCopyFieldChange(index, 'dueDate', e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={subject.amount}
                      onChange={(e) =>
                        handleCopyFieldChange(
                          index,
                          'amount',
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>

                  {/* Fine Type */}
                  <div className="space-y-1">
                    <Label className="text-xs">Fine Type</Label>
                    <Select
                      value={subject.fineType}
                      onValueChange={(value) =>
                        handleCopyFieldChange(index, 'fineType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed amount">
                          Fixed Amount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Percentage Fine Amount */}
                  {subject.fineType === 'percentage' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Percentage Fine Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={subject.percentageFineAmount ?? ''}
                        onChange={(e) =>
                          handleCopyFieldChange(
                            index,
                            'percentageFineAmount',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Fixed Fine Amount */}
                  {subject.fineType === 'fixed amount' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Fixed Fine Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={subject.fixedFineAmount ?? ''}
                        onChange={(e) =>
                          handleCopyFieldChange(
                            index,
                            'fixedFineAmount',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Per Day */}
                  <div className="space-y-1 flex items-end">
                    <div className="flex items-center gap-2">
                      <Input
                        type="checkbox"
                        checked={subject.perDay}
                        onChange={(e) =>
                          handleCopyFieldChange(
                            index,
                            'perDay',
                            e.target.checked
                          )
                        }
                        className="w-4 h-4"
                      />
                      <Label className="mb-0 text-xs">Per Day</Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={resetCopyForm}
              className="hover:bg-gray-100 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {addMutation.isPending
                ? 'Copying...'
                : `Copy ${copySubjects.length} Entries`}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  )
}

export default FeesMaster
