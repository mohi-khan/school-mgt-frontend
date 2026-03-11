import React from 'react'
import { formatDate, formatNumber } from '@/utils/conversions'

// ─────────────────────────────────────────────────────────────────────────────
// MoneyReceipt
// ─────────────────────────────────────────────────────────────────────────────
const MoneyReceipt = React.forwardRef<
  HTMLDivElement,
  {
    studentName: string
    className: string
    sectionName: string
    admissionNo: string
    phoneNumber: string
    paymentDate: string
    remarks: string
    fees: Array<{
      paymentMethod: string
      feesTypeName: string
      amount: number
      paidAmount: number
    }>
  }
>(
  (
    {
      studentName,
      className,
      sectionName,
      admissionNo,
      phoneNumber,
      paymentDate,
      fees,
    },
    ref
  ) => {
    const totalAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0)

    return (
      <div
        ref={ref}
        className="w-full max-w-4xl mx-auto bg-white shadow-lg print:shadow-none"
      >
        <div className="border-b-4 border-amber-300 p-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide text-center">
            MONEY RECEIPT
          </h1>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Student Name:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {studentName}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Date:</span>
                <p className="font-semibold border-b border-gray-400 min-w-[100px]">
                  {paymentDate
                    ? formatDate(new Date(paymentDate))
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Admission No:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {admissionNo}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Class:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {className}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Section:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {sectionName}
                </p>
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Phone:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {phoneNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-amber-300">
                <th className="border border-gray-300 px-4 py-3 text-left text-black">
                  Fee Type
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Payment Method
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Paid Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {fee.feesTypeName || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800 text-center">
                    {fee.paymentMethod || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800 text-center">
                    {formatNumber(fee.paidAmount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-50">
                <td
                  colSpan={2}
                  className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800"
                >
                  Total Paid:
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-lg">
                  {formatNumber(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-300 px-8 py-6 text-xs text-gray-500">
          <div className="grid grid-cols-3 gap-8 mt-20">
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Collected By
              </p>
            </div>
            <div></div>
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Authorized Signature
              </p>
            </div>
          </div>
          <p className="text-center mt-6">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }
)
MoneyReceipt.displayName = 'MoneyReceipt'

export default MoneyReceipt
