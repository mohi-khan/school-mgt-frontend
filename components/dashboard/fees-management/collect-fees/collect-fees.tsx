'use client'

import { useCallback, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ArrowUpDown, DollarSign, Search } from 'lucide-react'
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
  useGetStudentFeesById,
  useCollectFees,
  useGetBankAccounts,
  useGetMfss,
} from '@/hooks/use-api'
import type { GetStudentFeesType, CollectFeesType } from '@/utils/type'
import { Popup } from '@/utils/popup'
import { formatNumber } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'

const CollectFees = () => {
  const { studentId } = useParams()
  const { data: bankAccounts } = useGetBankAccounts()
  const { data: mfsData } = useGetMfss()
  const { data: studentFees, isLoading } = useGetStudentFeesById(
    Number(studentId)
  )
  console.log('🚀 ~ CollectFees ~ studentFees:', studentFees)

  const [sortColumn, setSortColumn] = useState<string>('feesTypeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<GetStudentFeesType | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const [bankAccountId, setBankAccountId] = useState<{
    id: string
    name: string
  } | null>(null)

  const [mfsId, setMfsId] = useState<{
    id: string
    name: string
  } | null>(null)

  const [formData, setFormData] = useState<CollectFeesType>({
    studentFeesId: 0,
    studentId: 0,
    method: 'cash',
    bankAccountId: null,
    mfsId: null,
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  })

  const filteredMfsAccounts = useMemo(() => {
    if (
      !mfsData?.data ||
      !['bkash', 'nagad', 'rocket'].includes(formData.method)
    ) {
      return []
    }
    return mfsData.data
      .filter((mfs: any) => mfs.mfsType === formData.method)
      .map((mfs: any) => ({
        id: mfs.mfsId?.toString() || '0',
        name: `${mfs.accountName} - ${mfs.mfsNumber}`,
      }))
  }, [mfsData, formData.method])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setSelectedFee(null)
    setError(null)
  }, [])

  const resetForm = () => {
    setFormData({
      studentFeesId: 0,
      studentId: 0,
      method: 'cash',
      bankAccountId: null,
      mfsId: null,
      paidAmount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: '',
    })
    setBankAccountId(null)
    setMfsId(null)
    setSelectedFee(null)
    setIsPopupOpen(false)
    setError(null)
  }

  const collectFeesMutation = useCollectFees({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredFees = useMemo(() => {
    if (!studentFees?.data) return []
    return studentFees.data?.filter((fee: GetStudentFeesType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        fee.feesTypeName?.toLowerCase().includes(searchLower) ||
        fee.amount?.toString().includes(searchLower) ||
        fee.status?.toLowerCase().includes(searchLower)
      )
    })
  }, [studentFees?.data, searchTerm])

  const sortedFees = useMemo(() => {
    return [...filteredFees].sort((a, b) => {
      const aValue: any = a[sortColumn as keyof GetStudentFeesType] ?? ''
      const bValue: any = b[sortColumn as keyof GetStudentFeesType] ?? ''

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })
  }, [filteredFees, sortColumn, sortDirection])

  const handleCollectClick = (fee: GetStudentFeesType) => {
    setSelectedFee(fee)
    setFormData({
      studentFeesId: fee.studentFeesId || 0,
      studentId: Number(studentId),
      method: 'cash',
      bankAccountId: null,
      mfsId: null,
      paidAmount: fee.remainingAmount || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: '',
    })
    setBankAccountId(null)
    setMfsId(null)
    setIsPopupOpen(true)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'method') {
      const paymentMethod = value as CollectFeesType['method']
      setFormData((prev) => ({
        ...prev,
        method: paymentMethod,
        bankAccountId: null,
        mfsId: null,
      }))
      setBankAccountId(null)
      setMfsId(null)
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.paidAmount || formData.paidAmount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    if (
      selectedFee &&
      formData.paidAmount > (selectedFee.remainingAmount || 0)
    ) {
      setError('Payment amount cannot exceed remaining amount')
      return
    }

    try {
      const submitData = {
        ...formData,
        bankAccountId:
          formData.method === 'bank' && bankAccountId
            ? Number(bankAccountId.id)
            : null,
        mfsId:
          ['bkash', 'nagad', 'rocket'].includes(formData.method) && mfsId
            ? Number(mfsId.id)
            : null,
      }
      collectFeesMutation.mutate(submitData)
    } catch (err) {
      setError('Failed to collect fees')
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <p>Loading student fees...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Collect Fees</h2>
            <p className="text-sm text-gray-500">
              Student : {studentFees?.data && studentFees?.data[0]?.studentName}
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search fees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead
                onClick={() => handleSort('feesTypeName')}
                className="cursor-pointer"
              >
                Fee Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount (BDT) <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('paidAmount')}
                className="cursor-pointer"
              >
                Paid Amount (BDT){' '}
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('remainingAmount')}
                className="cursor-pointer"
              >
                Remaining Amount (BDT){' '}
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('status')}
                className="cursor-pointer"
              >
                Status <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {searchTerm
                    ? 'No fees match your search'
                    : 'No fees found for this student'}
                </TableCell>
              </TableRow>
            ) : (
              sortedFees.map((fee) => (
                <TableRow key={fee.studentFeesId}>
                  <TableCell className="font-medium">
                    {fee.feesTypeName}
                  </TableCell>
                  <TableCell>{formatNumber(fee.amount.toFixed(2))}</TableCell>
                  <TableCell>
                    {formatNumber(fee.paidAmount.toFixed(2))}
                  </TableCell>
                  <TableCell>
                    {formatNumber(fee.remainingAmount.toFixed(2))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        fee.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : fee.status === 'Partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {fee.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-amber-200 hover:bg-amber-300 text-black"
                      onClick={() => handleCollectClick(fee)}
                      disabled={fee.status === 'Paid'}
                    >
                      Collect Fee
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Collect Fee Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={resetForm}
        title="Collect Fee Payment"
        size="sm:max-w-lg"
      >
        {selectedFee && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Fee Information */}
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fee Type:</span>
                <span className="text-sm font-medium">
                  {selectedFee.feesTypeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-sm font-medium">
                  {formatNumber(selectedFee.amount.toFixed(2))} BDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Already Paid:</span>
                <span className="text-sm font-medium">
                  {formatNumber(selectedFee.paidAmount.toFixed(2))} BDT
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-semibold">Remaining:</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatNumber(selectedFee.remainingAmount.toFixed(2))} BDT
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="method">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select
                  name="method"
                  value={formData.method}
                  onValueChange={(value) => handleSelectChange('method', value)}
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

              {formData.method === 'bank' && (
                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Bank Account</Label>
                  <CustomCombobox
                    items={
                      bankAccounts?.data?.map((b) => ({
                        id: b.bankAccountId?.toString() || '0',
                        name: `${b.bankName} - ${b.accountNumber} - ${b.branch}`,
                      })) || []
                    }
                    value={bankAccountId}
                    onChange={(v) => setBankAccountId(v)}
                    placeholder="Select bank account"
                  />
                </div>
              )}

              {['bkash', 'nagad', 'rocket'].includes(formData.method) && (
                <div className="space-y-2">
                  <Label htmlFor="mfsAccount">MFS Account</Label>
                  <CustomCombobox
                    items={filteredMfsAccounts}
                    value={mfsId}
                    onChange={(v) => setMfsId(v)}
                    placeholder={`Select ${formData.method} account`}
                  />
                </div>
              )}

              {/* Paid Amount */}
              <div className="space-y-2">
                <Label htmlFor="paidAmount">
                  Paid Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paidAmount"
                  name="paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedFee.remainingAmount}
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paymentDate"
                  name="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  name="remarks"
                  type="text"
                  placeholder="Optional notes..."
                  value={formData.remarks}
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
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={collectFeesMutation.isPending}>
                {collectFeesMutation.isPending
                  ? 'Processing...'
                  : 'Collect Payment'}
              </Button>
            </div>
          </form>
        )}
      </Popup>
    </div>
  )
}

export default CollectFees
