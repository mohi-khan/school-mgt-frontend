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
import { ArrowUpDown, Search, Wallet } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useGetOpeningBalances, useAddOpeningBalance } from '@/hooks/use-api'
import { formatDate, formatNumber } from '@/utils/conversions'
import type {
  CreateOpeningBalancesType,
  GetOpeningBalancesType,
} from '@/utils/type'

const BALANCE_TYPES = ['cash', 'bank', 'mfs'] as const

const OpeningBalances = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: openingBalances } = useGetOpeningBalances()

  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetOpeningBalancesType>('type')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

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
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateOpeningBalancesType>({
    type: 'cash',
    amount: 0,
    createdBy: userData?.userId || 0,
  })

  // Determine which types are already used
  const usedTypes = useMemo(() => {
    if (!openingBalances?.data) return new Set<string>()
    return new Set(
      openingBalances.data.map((b: GetOpeningBalancesType) => b.type)
    )
  }, [openingBalances?.data])

  const availableTypes = useMemo(
    () => BALANCE_TYPES.filter((t) => !usedTypes.has(t)),
    [usedTypes]
  )

  const handleSort = (column: keyof GetOpeningBalancesType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredBalances = useMemo(() => {
    if (!openingBalances?.data) return []
    return openingBalances.data.filter((balance: GetOpeningBalancesType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        balance.type?.toLowerCase().includes(searchLower) ||
        balance.amount?.toString().includes(searchLower)
      )
    })
  }, [openingBalances?.data, searchTerm])

  const sortedBalances = useMemo(() => {
    return [...filteredBalances].sort((a, b) => {
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
  }, [filteredBalances, sortColumn, sortDirection])

  const paginatedBalances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedBalances.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedBalances, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedBalances.length / itemsPerPage)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAdd = () => {
    if (availableTypes.length === 0) {
      setError('All balance types (cash, bank, mfs) have already been created.')
      return
    }
    setError(null)
    setFormData({
      type: availableTypes[0],
      amount: 0,
      createdBy: userData?.userId || 0,
    })
    setIsPopupOpen(true)
  }

  const resetForm = useCallback(() => {
    setFormData({
      type: availableTypes[0] ?? 'cash',
      amount: 0,
      createdBy: userData?.userId || 0,
    })
    setIsPopupOpen(false)
  }, [userData?.userId, availableTypes])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddOpeningBalance({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (usedTypes.has(formData.type)) {
        setError(`An opening balance for "${formData.type}" already exists.`)
        return
      }

      try {
        addMutation.mutate({
          ...formData,
          amount: Number(formData.amount),
          createdBy: userData?.userId || 0,
        })
        resetForm()
      } catch (error) {
        setError('Failed to create opening balance')
        console.error('Error creating opening balance:', error)
      }
    },
    [formData, userData, addMutation, resetForm, usedTypes]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Wallet className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Opening Balances</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search opening balances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={handleAdd}
            disabled={availableTypes.length === 0}
            title={
              availableTypes.length === 0
                ? 'All balance types have been created'
                : ''
            }
          >
            Add
          </Button>
        </div>
      </div>

      {error && !isPopupOpen && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead
                onClick={() => handleSort('type')}
                className="cursor-pointer"
              >
                Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('createdAt')}
                className="cursor-pointer"
              >
                Created At <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!openingBalances || openingBalances.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading opening balances...
                </TableCell>
              </TableRow>
            ) : !openingBalances.data || openingBalances.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No opening balances found
                </TableCell>
              </TableRow>
            ) : paginatedBalances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No opening balances match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedBalances.map((balance) => (
                <TableRow key={balance.openingBalanceId}>
                  <TableCell className="font-medium capitalize">
                    {balance.type}
                  </TableCell>
                  <TableCell>{formatNumber(balance.amount)}</TableCell>
                  <TableCell>{formatDate(balance.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sortedBalances.length > 0 && (
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
        title="Add Opening Balance"
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as 'cash' | 'bank' | 'mfs',
                  }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
                min={0.01}
                step="0.01"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Popup>
    </div>
  )
}

export default OpeningBalances
