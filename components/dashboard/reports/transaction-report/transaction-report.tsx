'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { File, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetTransactionReport } from '@/hooks/use-api'
import { formatDate, formatNumber } from '@/utils/conversions'

const TransactionReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('all')

  const { data: transactionReports } = useGetTransactionReport(fromDate, toDate)

  // Filter data based on selected method
  const filteredData = useMemo(() => {
    if (!transactionReports?.data) return []
    if (selectedMethod === 'all') return transactionReports.data
    return transactionReports.data.filter(
      (report) => report.method === selectedMethod
    )
  }, [transactionReports?.data, selectedMethod])

  // Determine which columns to show based on selected method
  const columnVisibility = useMemo(() => {
    const bankMethods = [
      'bank',
      'bank to bank',
      'cash to bank',
      'bank to cash',
      'bank to mfs',
      'mfs to bank',
    ]
    const mfsMethods = [
      'mfs',
      'mfs to mfs',
      'cash to mfs',
      'mfs to cash',
      'bank to mfs',
      'mfs to bank',
    ]

    return {
      showBank:
        selectedMethod === 'all' || bankMethods.includes(selectedMethod),
      showMfs: selectedMethod === 'all' || mfsMethods.includes(selectedMethod),
    }
  }, [selectedMethod])

  const exportToExcel = () => {
    const flatData = filteredData?.map((report) => {
      const baseData: Record<string, any> = {
        Date: report.date ? formatDate(new Date(report.date)) : '-',
        Particulars: report.particulars || '-',
        Deposit: report.deposit || 0,
        Withdraw: report.withdraw || 0,
        Method: report.method || '-',
      }

      // Add bank column only if needed
      if (columnVisibility.showBank) {
        baseData['Bank Account'] =
          report.bankName && report.branch && report.accountNumber
            ? `${report.bankName} - ${report.branch} - ${report.accountNumber}`
            : '-'
      }

      // Add MFS column only if needed
      if (columnVisibility.showMfs) {
        baseData['MFS Account'] =
          report.mfsNumber && report.mfsAccountName
            ? `${report.mfsType} - ${report.mfsAccountName} - ${report.mfsNumber}`
            : '-'
      }

      baseData['Remarks'] = report.remarks || '-'

      return baseData
    })

    const worksheet = XLSX.utils.json_to_sheet(flatData || [])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, `transaction-report-${fromDate}-to-${toDate}.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('transaction-report-content')
    if (!targetRef) return

    await new Promise((res) => setTimeout(res, 200))

    const canvas = await html2canvas(targetRef, {
      scale: 2,
      useCORS: true,
    })

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const marginTop = 70
    const marginBottom = 40
    const horizontalPadding = 30
    const usablePageHeight = pageHeight - marginTop - marginBottom

    const imgWidth = pageWidth - horizontalPadding * 2
    const scale = imgWidth / canvas.width

    let heightLeftPx = canvas.height
    let sourceY = 0
    let pageCount = 0

    while (heightLeftPx > 0) {
      const sliceHeightPx = Math.min(heightLeftPx, usablePageHeight / scale)

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')

      tempCanvas.width = canvas.width
      tempCanvas.height = sliceHeightPx

      tempCtx?.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      )

      const imgDataSlice = tempCanvas.toDataURL('image/jpeg')

      if (pageCount > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        imgDataSlice,
        'JPEG',
        horizontalPadding,
        marginTop,
        imgWidth,
        sliceHeightPx * scale
      )

      heightLeftPx -= sliceHeightPx
      sourceY += sliceHeightPx
      pageCount++
    }

    const leftTextMargin = horizontalPadding
    const totalPages = pdf.internal.pages.length - 1

    const today = new Date()
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
    const monthName = today.toLocaleDateString('en-US', { month: 'long' })
    const day = today.getDate()
    const year = today.getFullYear()

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(12)
      pdf.setFont('bold')
      pdf.text('School Management System', leftTextMargin, 35)

      pdf.setFontSize(10)
      const baseText = `Transaction Report from ${fromDate} to ${toDate} ( Date : `
      pdf.setFont('bold')
      pdf.text(baseText, leftTextMargin, 50)
      let currentX = leftTextMargin + pdf.getTextWidth(baseText)
      pdf.text(dayName, currentX, 50)
      currentX += pdf.getTextWidth(dayName)
      pdf.text(', ', currentX, 50)
      currentX += pdf.getTextWidth(', ')
      pdf.text(monthName, currentX, 50)
      currentX += pdf.getTextWidth(monthName)
      pdf.text(` ${day}, ${year} )`, currentX, 50)

      pdf.setFontSize(10)
      pdf.setFont('normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - horizontalPadding - 50,
        pageHeight - marginBottom + 20
      )
    }

    pdf.save(`transaction-report-${fromDate}-to-${toDate}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transaction Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={!filteredData || filteredData.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={!filteredData || filteredData.length === 0}
          >
            <File className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="space-y-2">
            <Label htmlFor="from-date" className="text-sm font-medium">
              From Date:
            </Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="space-y-2">
            <Label htmlFor="to-date" className="text-sm font-medium">
              To Date:
            </Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="space-y-2">
            <Label htmlFor="method" className="text-sm font-medium">
              Method:
            </Label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger id="method" className="w-48">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="mfs">MFS</SelectItem>
                <SelectItem value="cash to bank">Cash to Bank</SelectItem>
                <SelectItem value="cash to mfs">Cash to MFS</SelectItem>
                <SelectItem value="bank to bank">Bank to Bank</SelectItem>
                <SelectItem value="mfs to mfs">MFS to MFS</SelectItem>
                <SelectItem value="bank to mfs">Bank to MFS</SelectItem>
                <SelectItem value="mfs to bank">MFS to Bank</SelectItem>
                <SelectItem value="bank to cash">Bank to Cash</SelectItem>
                <SelectItem value="mfs to cash">MFS to Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="transaction-report-content" className="space-y-6">
        {!fromDate || !toDate ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-sm text-amber-600">
                Please select both from and to dates
              </p>
            </CardContent>
          </Card>
        ) : !filteredData || filteredData.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No transaction records found for the selected criteria
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-amber-100 pdf-table-header">
                    <TableRow>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Particulars</TableHead>
                      <TableHead className="font-bold">Deposit</TableHead>
                      <TableHead className="font-bold">Withdraw</TableHead>
                      <TableHead className="font-bold">Method</TableHead>
                      {columnVisibility.showBank && (
                        <TableHead className="font-bold">
                          Bank Account
                        </TableHead>
                      )}
                      {columnVisibility.showMfs && (
                        <TableHead className="font-bold">MFS Account</TableHead>
                      )}
                      <TableHead className="font-bold">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((report, index) => (
                      <TableRow key={report.id || index}>
                        <TableCell>
                          {report.date
                            ? formatDate(new Date(report.date))
                            : '-'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {report.particulars || '-'}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatNumber(Number(report.deposit || 0))}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatNumber(Number(report.withdraw || 0))}
                        </TableCell>
                        <TableCell className="capitalize">
                          {report.method || '-'}
                        </TableCell>
                        {columnVisibility.showBank && (
                          <TableCell>
                            {report.bankName &&
                            report.branch &&
                            report.accountNumber
                              ? `${report.bankName} - ${report.branch} - ${report.accountNumber}`
                              : '-'}
                          </TableCell>
                        )}
                        {columnVisibility.showMfs && (
                          <TableCell className="capitalize">
                            {report.mfsNumber && report.mfsAccountName
                              ? `${report.mfsType} - ${report.mfsAccountName} - ${report.mfsNumber}`
                              : '-'}
                          </TableCell>
                        )}
                        <TableCell className="max-w-xs">
                          {report.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default TransactionReport
