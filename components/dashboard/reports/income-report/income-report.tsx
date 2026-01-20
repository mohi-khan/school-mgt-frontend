'use client'

import { useState } from 'react'
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
import { File, FileSpreadsheet, Search } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetIncomeReport } from '@/hooks/use-api'
import { formatDate, formatNumber } from '@/utils/conversions'

const IncomeReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: incomeReports } = useGetIncomeReport(fromDate, toDate)
  console.log("🚀 ~ IncomeReport ~ incomeReports:", incomeReports)

  const exportToExcel = () => {
    const flatData = incomeReports?.data?.map((report) => ({
      Date: report.date ? formatDate(new Date(report.date)) : 'N/A',
      Name: report.name || 'N/A',
      'Income Head': report.incomeHead || 'N/A',
      'Money Receit Number': report.invoiceNumber || 'N/A',
      Method: report.method || 'N/A',
      'Bank Account':
      report.bankName && report.branch && report.accountNumber
      ? `${report.bankName} - ${report.branch} - ${report.accountNumber}`
      : '-',
      'MFS Account':
      report.mfsNumber && report.mfsAccountName
      ? `${report.mfsAccountName} - ${report.mfsNumber}`
      : '-',
      Amount: report.amount || 0,
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData || [])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, `income-report-${fromDate}-to-${toDate}.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('income-report-content')
    if (!targetRef) return

    await new Promise((res) => setTimeout(res, 200))

    const canvas = await html2canvas(targetRef, {
      scale: 2,
      useCORS: true,
    })

    const pdf = new jsPDF({
      orientation: 'l',
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
      const baseText = `Income Report from ${fromDate} to ${toDate} ( Date : `
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

    pdf.save(`income-report-${fromDate}-to-${toDate}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Income Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={!incomeReports?.data || incomeReports.data.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={!incomeReports?.data || incomeReports.data.length === 0}
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
      </div>

      {/* Report Content */}
      <div id="income-report-content" className="space-y-6">
        {!fromDate || !toDate ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-sm text-blue-600">
                Please select both from and to dates, then click Search
              </p>
            </CardContent>
          </Card>
        ) : !incomeReports?.data || incomeReports.data.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No income records found for the selected date range
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
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">Income Head</TableHead>
                      <TableHead className="font-bold">
                        Money Receit Number
                      </TableHead>
                      <TableHead className="font-bold">Method</TableHead>
                      <TableHead className="font-bold">Bank Account</TableHead>
                      <TableHead className="font-bold">MFS Account</TableHead>
                      <TableHead className="font-bold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeReports.data.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {report.date
                            ? formatDate(new Date(report.date))
                            : '-'}
                        </TableCell>
                        <TableCell>{report.name || '-'}</TableCell>
                        <TableCell>{report.incomeHead || '-'}</TableCell>
                        <TableCell>{report.invoiceNumber || '-'}</TableCell>
                        <TableCell className="capitalize">
                          {report.method || '-'}
                        </TableCell>
                        <TableCell>
                          {report.bankName &&
                          report.branch &&
                          report.accountNumber
                            ? `${report.bankName} - ${report.branch} - ${report.accountNumber}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {report.mfsNumber && report.mfsAccountName
                            ? `${report.mfsAccountName} - ${report.mfsNumber}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatNumber(Number(report.amount || 0))}
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

export default IncomeReport
