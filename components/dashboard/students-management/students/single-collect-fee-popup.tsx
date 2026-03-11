import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Printer } from 'lucide-react'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate, formatNumber } from '@/utils/conversions'
import { MFS_METHODS, METHOD_OPTIONS } from './bulk-collect-fee-popup'

type SingleCollectFeesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentFees: any
  isLoadingFees: boolean
  paymentMethod: string
  setPaymentMethod: (v: string) => void
  bankAccountId: { id: string; name: string } | null
  setBankAccountId: (v: { id: string; name: string } | null) => void
  mfsId: { id: string; name: string } | null
  setMfsId: (v: { id: string; name: string } | null) => void
  paymentDate: string
  setPaymentDate: (v: string) => void
  remarks: string
  setRemarks: (v: string) => void
  selectedFees: number[]
  setSelectedFees: React.Dispatch<React.SetStateAction<number[]>>
  showAllFees: boolean
  setShowAllFees: (v: boolean) => void
  paidAmounts: Record<number, string>
  setPaidAmounts: React.Dispatch<React.SetStateAction<Record<number, string>>>
  bankAccountItems: { id: string; name: string }[]
  filteredMfsAccounts: { id: string; name: string }[]
  selectedStudentIdForFees: number | null
  onClose: () => void
  onSubmit: () => void
  onPrintReceipt: () => void
}

const SingleCollectFeesDialog = ({
  open,
  onOpenChange,
  studentFees,
  isLoadingFees,
  paymentMethod,
  setPaymentMethod,
  bankAccountId,
  setBankAccountId,
  mfsId,
  setMfsId,
  paymentDate,
  setPaymentDate,
  remarks,
  setRemarks,
  selectedFees,
  setSelectedFees,
  showAllFees,
  setShowAllFees,
  paidAmounts,
  setPaidAmounts,
  bankAccountItems,
  filteredMfsAccounts,
  selectedStudentIdForFees,
  onClose,
  onSubmit,
  onPrintReceipt,
}: SingleCollectFeesDialogProps) => {
  const filteredAndSortedFees = useMemo(() => {
    if (!studentFees?.data) return []
    let fees = studentFees.data
    const seen = new Set()
    fees = fees.filter((fee: any) => {
      if (seen.has(fee.studentFeesId)) return false
      seen.add(fee.studentFeesId)
      return true
    })
    if (!showAllFees) fees = fees.filter((fee: any) => fee.status !== 'Paid')
    return [...fees].sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
  }, [studentFees?.data, showAllFees])

  const handleFeeToggle = (feeId: number) => {
    setSelectedFees((prev) =>
      prev.includes(feeId)
        ? prev.filter((id) => id !== feeId)
        : [...prev, feeId]
    )
  }

  const handleSelectAllFees = (checked: boolean) => {
    if (checked) {
      const unpaidFees =
        studentFees?.data
          ?.filter((fee: any) => fee.status !== 'Paid')
          .map((fee: any) => fee.studentFeesId) || []
      setSelectedFees(unpaidFees)
    } else {
      setSelectedFees([])
    }
  }

  const totalWillCollect = selectedFees.reduce((sum, feeId) => {
    const fee = studentFees?.data?.find((f: any) => f.studentFeesId === feeId)
    const custom = paidAmounts[feeId]
    return (
      sum +
      (custom && Number(custom) > 0
        ? Number(custom)
        : fee?.remainingAmount || 0)
    )
  }, 0)

  const isSubmitDisabled =
    !selectedStudentIdForFees ||
    !paymentMethod ||
    !paymentDate ||
    selectedFees.length === 0 ||
    (paymentMethod === 'bank' && !bankAccountId) ||
    (MFS_METHODS.includes(paymentMethod) && !mfsId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Collect Fees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <CustomCombobox
                items={METHOD_OPTIONS}
                value={
                  paymentMethod
                    ? METHOD_OPTIONS.find((m) => m.id === paymentMethod) || null
                    : null
                }
                onChange={(v) => setPaymentMethod(v?.id || '')}
                placeholder="Select method"
              />
            </div>
            {paymentMethod === 'bank' && (
              <div className="space-y-2">
                <Label>Bank Account</Label>
                <CustomCombobox
                  items={bankAccountItems}
                  value={bankAccountId}
                  onChange={(v) => setBankAccountId(v)}
                  placeholder="Select bank account"
                />
              </div>
            )}
            {MFS_METHODS.includes(paymentMethod) && (
              <div className="space-y-2">
                <Label>MFS Account</Label>
                <CustomCombobox
                  items={filteredMfsAccounts}
                  value={mfsId}
                  onChange={(v) => setMfsId(v)}
                  placeholder={`Select ${paymentMethod} account`}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Student Fees ({formatNumber(totalWillCollect)})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAllFees(!showAllFees)}
                  className="text-sm"
                >
                  {showAllFees ? 'Show Less' : 'Show All'}
                </Button>
                <button
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700 border border-amber-600 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onPrintReceipt}
                  disabled={
                    !studentFees?.data ||
                    studentFees?.data.every(
                      (fee: any) => fee.status === 'Unpaid'
                    )
                  }
                  type="button"
                >
                  <Printer className="w-4" />
                  <span className="text-sm">Print Money Receipt</span>
                </button>
              </div>
            </div>

            {isLoadingFees ? (
              <div className="text-center py-4">Loading fees...</div>
            ) : studentFees?.data?.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No fees found for this student
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedFees.length > 0 &&
                            selectedFees.length ===
                              filteredAndSortedFees.filter(
                                (fee: any) => fee.status !== 'Paid'
                              ).length
                          }
                          onCheckedChange={handleSelectAllFees}
                        />
                      </TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      {selectedFees.length > 0 && (
                        <TableHead>Pay Amount</TableHead>
                      )}
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedFees?.map((fee: any) => {
                      const todayDate = new Date()
                      const dueDate = new Date(fee.dueDate)
                      const lastPaymentDate = fee.lastPaymentDate
                        ? new Date(fee.lastPaymentDate)
                        : null
                      todayDate.setHours(0, 0, 0, 0)
                      dueDate.setHours(0, 0, 0, 0)
                      if (lastPaymentDate) lastPaymentDate.setHours(0, 0, 0, 0)

                      const isPaid = fee.status === 'Paid'
                      const isPartial = fee.status === 'Partial'

                      let colorClass = 'text-green-600'
                      if (isPaid) {
                        colorClass =
                          lastPaymentDate && lastPaymentDate >= dueDate
                            ? 'text-red-600'
                            : 'text-blue-600'
                      } else if (todayDate > dueDate) {
                        colorClass = 'text-red-600'
                      } else if (isPartial) {
                        colorClass = 'text-yellow-600'
                      }

                      return (
                        <TableRow key={fee.studentFeesId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedFees.includes(fee.studentFeesId)}
                              onCheckedChange={() =>
                                handleFeeToggle(fee.studentFeesId)
                              }
                              disabled={isPaid}
                            />
                          </TableCell>
                          <TableCell>{fee.feesTypeName || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={colorClass}>
                              {formatNumber(fee.amount) || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={colorClass}>
                              {formatNumber(fee.remainingAmount) || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={colorClass}>
                              {formatNumber(fee.paidAmount) || 0}
                            </span>
                          </TableCell>
                          {selectedFees.length > 0 && (
                            <TableCell>
                              {!isPaid &&
                                selectedFees.includes(fee.studentFeesId) && (
                                  <Input
                                    type="number"
                                    min={1}
                                    max={fee.remainingAmount}
                                    placeholder={String(fee.remainingAmount)}
                                    value={paidAmounts[fee.studentFeesId] || ''}
                                    onChange={(e) =>
                                      setPaidAmounts((prev) => ({
                                        ...prev,
                                        [fee.studentFeesId]: e.target.value,
                                      }))
                                    }
                                    className="w-28 h-8 text-sm"
                                  />
                                )}
                            </TableCell>
                          )}
                          <TableCell>
                            {formatDate(fee.dueDate) || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs badge px-2 py-1 rounded ${
                                fee.status === 'Unpaid'
                                  ? 'bg-red-100 text-red-700'
                                  : fee.status === 'Paid'
                                    ? 'bg-green-100 text-green-700'
                                    : fee.status === 'Partial'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : ''
                              }`}
                            >
                              {fee.status || 'Pending'}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Collect Fees
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SingleCollectFeesDialog
