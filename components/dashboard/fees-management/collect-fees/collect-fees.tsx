'use client'

import { useCallback, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ArrowUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useGetStudentFeesById, useCollectFees } from '@/hooks/use-api'
// import { PartialPaymentModal } from '@/components/fees/partial-payment-modal'
import type { GetStudentFeesType } from '@/utils/type'

const CollectFees = () => {
  const { studentId } = useParams()
  const { data: studentFees, isLoading } = useGetStudentFeesById(
    Number(studentId)
  )

  const [sortColumn, setSortColumn] = useState<string>('feesTypeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedFees, setSelectedFees] = useState<Set<number>>(new Set())
  const [isFullPaymentDialogOpen, setIsFullPaymentDialogOpen] = useState(false)
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false)
  const [partialPaymentFees, setPartialPaymentFees] = useState<
    GetStudentFeesType[]
  >([])

  const collectFeesMutation = useCollectFees({
    onClose: () => {
      setSelectedFees(new Set())
      setIsFullPaymentDialogOpen(false)
      setIsPartialPaymentOpen(false)
    },
    reset: () => setSelectedFees(new Set()),
  })

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedFees = useMemo(() => {
    if (!studentFees?.data) return []

    return [...studentFees.data].sort((a, b) => {
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
  }, [studentFees?.data, sortColumn, sortDirection])

  const isAllSelected = useMemo(() => {
    return sortedFees.length > 0 && selectedFees.size === sortedFees.length
  }, [sortedFees, selectedFees])

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedFees(new Set())
    } else {
      const allIds = new Set(sortedFees.map((fee) => fee.studentFeesId))
      setSelectedFees(allIds)
    }
  }, [isAllSelected, sortedFees])

  const handleSelectFee = useCallback((studentFeesId: number) => {
    setSelectedFees((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentFeesId)) {
        newSet.delete(studentFeesId)
      } else {
        newSet.add(studentFeesId)
      }
      return newSet
    })
  }, [])

  const handleFullPayment = useCallback(() => {
    const selectedFeesData = sortedFees.filter((fee) =>
      selectedFees.has(fee.studentFeesId!)
    )

    const payloadData = selectedFeesData.map((fee) => ({
      studentFeesId: fee.studentFeesId,
      paymentType: 'Paid' as const,
    }))

    collectFeesMutation.mutate(payloadData)
    setIsFullPaymentDialogOpen(false)
  }, [sortedFees, selectedFees, collectFeesMutation])

  const handlePartialPaymentClick = useCallback(() => {
    const selectedFeesData = sortedFees.filter((fee) =>
      selectedFees.has(fee.studentFeesId!)
    )
    setPartialPaymentFees(selectedFeesData)
    setIsPartialPaymentOpen(true)
  }, [sortedFees, selectedFees])

  const handlePartialPaymentSubmit = useCallback(
    (paymentData: any[]) => {
      collectFeesMutation.mutate(paymentData)
      setIsPartialPaymentOpen(false)
    },
    [collectFeesMutation]
  )

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
          <div className="bg-blue-100 p-2 rounded-md">
            <Check className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Collect Fees</h2>
            <p className="text-sm text-gray-500">Student ID: {studentId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={selectedFees.size === 0}
            onClick={handlePartialPaymentClick}
          >
            Partial Payment
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedFees.size === 0}
            onClick={() => setIsFullPaymentDialogOpen(true)}
          >
            Full Payment
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all fees"
                />
              </TableHead>
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
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('paidAmount')}
                className="cursor-pointer"
              >
                Paid Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('remainingAmount')}
                className="cursor-pointer"
              >
                Remaining <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('status')}
                className="cursor-pointer"
              >
                Status <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No fees found for this student
                </TableCell>
              </TableRow>
            ) : (
              sortedFees.map((fee) => (
                <TableRow key={fee.studentFeesId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedFees.has(fee.studentFeesId!)}
                      onCheckedChange={() =>
                        handleSelectFee(fee.studentFeesId!)
                      }
                      aria-label={`Select ${fee.feesTypeName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {fee.feesTypeName}
                  </TableCell>
                  <TableCell>₹{fee.amount}</TableCell>
                  <TableCell>₹{fee.paidAmount}</TableCell>
                  <TableCell>₹{fee.remainingAmount}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selected Fees Summary */}
      {selectedFees.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium">
            {selectedFees.size} fee(s) selected for payment
          </p>
        </div>
      )}

      {/* Full Payment Dialog */}
      <AlertDialog
        open={isFullPaymentDialogOpen}
        onOpenChange={setIsFullPaymentDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Full Payment</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to collect full payment for {selectedFees.size}{' '}
              fee(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => setIsFullPaymentDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFullPayment}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Payment
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partial Payment Modal */}
      {isPartialPaymentOpen && (
        <PartialPaymentModal
          fees={partialPaymentFees}
          isOpen={isPartialPaymentOpen}
          onClose={() => setIsPartialPaymentOpen(false)}
          onSubmit={handlePartialPaymentSubmit}
          isLoading={collectFeesMutation.isPending}
        />
      )}
    </div>
  )
}

export default CollectFees
