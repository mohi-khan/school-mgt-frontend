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
import { File, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetMfsPaymentReport, useGetAllStudents } from '@/hooks/use-api'
import { formatDate, formatNumber } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'

const MfsPaymentReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  const { data: students } = useGetAllStudents()
  const { data: paymentReports } = useGetMfsPaymentReport(fromDate, toDate)

  // Filter payment data based on selected student
  const filteredPayments = useMemo(() => {
    if (!paymentReports?.data) return []

    if (!selectedStudentId) {
      return paymentReports.data
    }

    // Find the selected student's name to filter by
    const selectedStudent = students?.data?.find(
      (s) => s.studentDetails.studentId?.toString() === selectedStudentId
    )

    if (!selectedStudent) return paymentReports.data

    const selectedStudentName = `${selectedStudent.studentDetails.firstName} ${selectedStudent.studentDetails.lastName}`

    return paymentReports.data.filter(
      (payment) => payment.studentName === selectedStudentName
    )
  }, [paymentReports, selectedStudentId, students])

  const exportToExcel = () => {
    const flatData = filteredPayments.map((report) => ({
      'Payment Date': formatDate(new Date(report.paymentDate)),
      'Student Name': report.studentName,
      Class: report.studentClass,
      Section: report.studentSection,
      Session: report.studentSession,
      Method: report.method,
      'MFS Name': report.mfsName || 'N/A',
      'MFS Number': report.mfsNumber || 'N/A',
      'MFS Type': report.mfsType || 'N/A',
      'Paid Amount': formatNumber(Number(report.paidAmount)),
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MFS Payment Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, `mfs-payment-report-${fromDate}-to-${toDate}.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('mfs-payment-report-content')
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
      const baseText = `MFS Payment Report from ${fromDate} to ${toDate} ( Date : `
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

    pdf.save(`mfs-payment-report-${fromDate}-to-${toDate}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">MFS Payment Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={filteredPayments.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={filteredPayments.length === 0}
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
            <Label htmlFor="studentId" className="text-sm font-medium">
              Student (Optional):
            </Label>
            <CustomCombobox
              items={
                students?.data?.map((student) => ({
                  id: student?.studentDetails?.studentId?.toString() || '0',
                  name:
                    `${student.studentDetails.firstName} ${student.studentDetails.lastName}` ||
                    'Unnamed student',
                })) || []
              }
              value={
                selectedStudentId
                  ? {
                      id: selectedStudentId,
                      name:
                        students?.data?.find(
                          (s) =>
                            s.studentDetails.studentId?.toString() ===
                            selectedStudentId
                        )?.studentDetails.firstName || '',
                    }
                  : null
              }
              onChange={(value) =>
                setSelectedStudentId(value ? String(value.id) : '')
              }
              placeholder="Select student"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="mfs-payment-report-content" className="space-y-6">
        {!fromDate || !toDate ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-sm text-blue-600">
                Please select both from and to dates, then click Search
              </p>
            </CardContent>
          </Card>
        ) : filteredPayments.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No MFS payment records found for the selected criteria
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-amber-100 pdf-table-header">
                    <TableRow>
                      <TableHead className="font-bold">Payment Date</TableHead>
                      <TableHead className="font-bold">Student Name</TableHead>
                      <TableHead className="font-bold">Class</TableHead>
                      <TableHead className="font-bold">Section</TableHead>
                      <TableHead className="font-bold">Session</TableHead>
                      <TableHead className="font-bold">Method</TableHead>
                      <TableHead className="font-bold">MFS Name</TableHead>
                      <TableHead className="font-bold">MFS Number</TableHead>
                      <TableHead className="font-bold">MFS Type</TableHead>
                      <TableHead className="font-bold">Paid Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((report, index) => (
                      <TableRow key={report.studentPaymentId || index}>
                        <TableCell>
                          {formatDate(new Date(report.paymentDate))}
                        </TableCell>
                        <TableCell>{report.studentName}</TableCell>
                        <TableCell>{report.studentClass}</TableCell>
                        <TableCell>{report.studentSection}</TableCell>
                        <TableCell>{report.studentSession}</TableCell>
                        <TableCell>{report.method}</TableCell>
                        <TableCell>{report.mfsName || 'N/A'}</TableCell>
                        <TableCell>{report.mfsNumber || 'N/A'}</TableCell>
                        <TableCell>{report.mfsType || 'N/A'}</TableCell>
                        <TableCell className="text-green-600">
                          {formatNumber(Number(report.paidAmount))}
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

export default MfsPaymentReport
