'use client'

import React from 'react'
import type { ReactElement } from 'react'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
  Search,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Printer,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react'
import type { GetExamResultsType } from '@/utils/type'
import { useGetExamResults } from '@/hooks/use-api'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useReactToPrint } from 'react-to-print'
import ReportCard from '../../exams-management/exam-results/report-card'
import SubjectReportCard from '../../exams-management/exam-results/subject-report-card'

const ResultReport = (): ReactElement => {
  const { data: examResults } = useGetExamResults()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [searchTerm, setSearchTerm] = useState('')

  // Toggle between student-wise and subject-wise grouping
  const [groupingMode, setGroupingMode] = useState<'student' | 'subject'>(
    'student'
  )
  const [expandedParentGroups, setExpandedParentGroups] = useState<Set<string>>(
    new Set()
  )
  const [expandedChildGroups, setExpandedChildGroups] = useState<Set<string>>(
    new Set()
  )

  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef })
  const [selectedGroupForPrint, setSelectedGroupForPrint] = useState<{
    type: 'student' | 'subject'
    studentName?: string
    subjectName?: string
    examGroupsId: number
    examGroupName: string
    sessionName: string
    divisionName: string
    className: string
    results: GetExamResultsType[]
  } | null>(null)

  const filteredExamResults = useMemo(() => {
    if (!examResults?.data) return []
    return examResults.data.filter((result: GetExamResultsType) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        result.studentName?.toLowerCase().includes(searchLower) ||
        result.examGroupName?.toLowerCase().includes(searchLower) ||
        result.sessionName?.toLowerCase().includes(searchLower) ||
        result.divisionName?.toLowerCase().includes(searchLower) ||
        result.className?.toLowerCase().includes(searchLower) ||
        result.examSubjectName?.toLowerCase().includes(searchLower)
      )
    })
  }, [examResults?.data, searchTerm])

  const groupedExamResults = useMemo(() => {
    if (groupingMode === 'student') {
      // Group by exam group first (parent), then by student (child)
      const parentGroups = new Map<
        string,
        {
          examGroupId: number
          sessionId: number
          examGroupName: string
          sessionName: string
          studentGroups: Map<
            string,
            {
              studentId: number
              studentName: string
              divisionName: string
              className: string
              results: GetExamResultsType[]
            }
          >
          latestCreatedAt: Date
        }
      >()

      // Sort by createdAt (latest first)
      const sortedResults = [...filteredExamResults].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      sortedResults.forEach((result) => {
        const parentKey = `${result.examGroupsId || 0}-${result.sessionId || 0}`

        if (!parentGroups.has(parentKey)) {
          parentGroups.set(parentKey, {
            examGroupId: result.examGroupsId || 0,
            sessionId: result.sessionId || 0,
            examGroupName: result.examGroupName || 'Unassigned',
            sessionName: result.sessionName || 'Unassigned',
            studentGroups: new Map(),
            latestCreatedAt: result.createdAt
              ? new Date(result.createdAt)
              : new Date(0),
          })
        }

        const parentGroup = parentGroups.get(parentKey)!
        const studentKey = `${result.studentId || 0}`

        if (!parentGroup.studentGroups.has(studentKey)) {
          parentGroup.studentGroups.set(studentKey, {
            studentId: result.studentId || 0,
            studentName: result.studentName || 'N/A',
            divisionName: result.divisionName || 'N/A',
            className: result.className || 'N/A',
            results: [],
          })
        }

        parentGroup.studentGroups.get(studentKey)!.results.push(result)

        // Update latest createdAt
        if (result.createdAt) {
          const resultDate = new Date(result.createdAt)
          if (resultDate > parentGroup.latestCreatedAt) {
            parentGroup.latestCreatedAt = resultDate
          }
        }
      })

      // Convert to array and sort by latestCreatedAt (latest first)
      return Array.from(parentGroups.values())
        .map((parentGroup) => ({
          type: 'student' as const,
          ...parentGroup,
          studentGroups: Array.from(parentGroup.studentGroups.values()),
        }))
        .sort(
          (a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime()
        )
    } else {
      // Group by exam group first (parent), then by subject (child)
      const parentGroups = new Map<
        string,
        {
          examGroupId: number
          sessionId: number
          examGroupName: string
          sessionName: string
          subjectGroups: Map<
            number,
            {
              examSubjectId: number
              subjectName: string
              divisionName: string
              className: string
              results: GetExamResultsType[]
            }
          >
          latestCreatedAt: Date
        }
      >()

      // Sort by createdAt (latest first)
      const sortedResults = [...filteredExamResults].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      sortedResults.forEach((result) => {
        const parentKey = `${result.examGroupsId || 0}-${result.sessionId || 0}`

        if (!parentGroups.has(parentKey)) {
          parentGroups.set(parentKey, {
            examGroupId: result.examGroupsId || 0,
            sessionId: result.sessionId || 0,
            examGroupName: result.examGroupName || 'Unassigned',
            sessionName: result.sessionName || 'Unassigned',
            subjectGroups: new Map(),
            latestCreatedAt: result.createdAt
              ? new Date(result.createdAt)
              : new Date(0),
          })
        }

        const parentGroup = parentGroups.get(parentKey)!
        const subjectId = result.examSubjectId || 0

        if (!parentGroup.subjectGroups.has(subjectId)) {
          parentGroup.subjectGroups.set(subjectId, {
            examSubjectId: subjectId,
            subjectName: result.examSubjectName || 'N/A',
            divisionName: result.divisionName || 'N/A',
            className: result.className || 'N/A',
            results: [],
          })
        }

        parentGroup.subjectGroups.get(subjectId)!.results.push(result)

        // Update latest createdAt
        if (result.createdAt) {
          const resultDate = new Date(result.createdAt)
          if (resultDate > parentGroup.latestCreatedAt) {
            parentGroup.latestCreatedAt = resultDate
          }
        }
      })

      // Convert to array and sort by latestCreatedAt (latest first)
      return Array.from(parentGroups.values())
        .map((parentGroup) => ({
          type: 'subject' as const,
          ...parentGroup,
          subjectGroups: Array.from(parentGroup.subjectGroups.values()),
        }))
        .sort(
          (a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime()
        )
    }
  }, [filteredExamResults, groupingMode])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return groupedExamResults.slice(startIndex, startIndex + itemsPerPage)
  }, [groupedExamResults, currentPage, itemsPerPage])

  const totalPages = Math.ceil(groupedExamResults.length / itemsPerPage)

  const handlePrintGroup = (group: any) => {
    if (group.type === 'student') {
      setSelectedGroupForPrint({
        type: 'student',
        studentName: group.studentName,
        examGroupsId: group.examGroupsId,
        examGroupName: group.examGroupName,
        sessionName: group.sessionName,
        divisionName: group.divisionName,
        className: group.className,
        results: group.results,
      })
    } else {
      setSelectedGroupForPrint({
        type: 'subject',
        subjectName: group.subjectName,
        examGroupsId: group.examGroupsId,
        examGroupName: group.examGroupName,
        sessionName: group.sessionName,
        divisionName: group.divisionName,
        className: group.className,
        results: group.results,
      })
    }
    setTimeout(() => {
      reactToPrintFn && reactToPrintFn()
    }, 100)
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

  const toggleChildGroupExpanded = (groupKey: string) => {
    setExpandedChildGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const exportToExcel = () => {
    if (!groupedExamResults || groupedExamResults.length === 0) {
      alert('No data to export')
      return
    }

    const flatData =
      examResults?.data?.map((result) => ({
        'Session Name': result.sessionName || '',
        'Exam Group Name': result.examGroupName || '',
        'Student Name': result.studentName || '',
        'Division Name': result.divisionName || '',
        'Class Name': result.className || '',
        'Subject Name': result.examSubjectName || '',
        'Gained Marks': result.gainedMarks || 0,
        'Total Marks': result.totalMarks || 0,
      })) || []

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results')

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const fileName = `result-report-${timestamp}.xlsx`

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, fileName)
  }

  // Export single parent group to Excel
  const exportParentGroupToExcel = (parentGroup: any) => {
    const allResults: any[] = []

    if (groupingMode === 'student') {
      parentGroup.studentGroups?.forEach((studentGroup: any) => {
        studentGroup.results.forEach((result: any) => {
          allResults.push({
            'Session Name': parentGroup.sessionName || '',
            'Exam Group Name': parentGroup.examGroupName || '',
            'Student Name': studentGroup.studentName || '',
            'Division Name': studentGroup.divisionName || '',
            'Class Name': studentGroup.className || '',
            'Subject Name': result.examSubjectName || '',
            'Gained Marks': result.gainedMarks || 0,
            'Total Marks': result.totalMarks || 0,
          })
        })
      })
    } else {
      parentGroup.subjectGroups?.forEach((subjectGroup: any) => {
        subjectGroup.results.forEach((result: any) => {
          allResults.push({
            'Session Name': parentGroup.sessionName || '',
            'Exam Group Name': parentGroup.examGroupName || '',
            'Student Name': result.studentName || '',
            'Division Name': subjectGroup.divisionName || '',
            'Class Name': subjectGroup.className || '',
            'Subject Name': subjectGroup.subjectName || '',
            'Gained Marks': result.gainedMarks || 0,
            'Total Marks': result.totalMarks || 0,
          })
        })
      })
    }

    if (allResults.length === 0) {
      alert('No data to export for this group')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(allResults)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results')

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const fileName =
      `${parentGroup.examGroupName}-${parentGroup.sessionName}-${timestamp}.xlsx`
        .replace(/\s+/g, '-')
        .toLowerCase()

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, fileName)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <FileText className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Result Report</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search exam results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() =>
              setGroupingMode(
                groupingMode === 'student' ? 'subject' : 'student'
              )
            }
          >
            <ArrowUpDown className="h-4 w-4" />
            {groupingMode === 'student'
              ? 'Group by Subject'
              : 'Group by Student'}
          </Button>
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={!groupedExamResults || groupedExamResults.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Hierarchical Grouped Table */}
      <div className="space-y-4">
        {!examResults?.data ? (
          <div className="text-center py-8 text-gray-600">
            Loading exam results...
          </div>
        ) : examResults.data.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No exam results found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No exam results match your search
          </div>
        ) : (
          <>
            {paginatedGroups.map((parentGroup: any) => {
              const parentKey = `${parentGroup.examGroupId}-${parentGroup.sessionId}`
              const isParentExpanded = expandedParentGroups.has(parentKey)

              return (
                <div
                  key={parentKey}
                  className="rounded-lg border-2 border-amber-300 overflow-hidden shadow-md"
                >
                  {/* Parent Group Header (Exam Group + Session) */}
                  <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-4 flex items-center gap-4">
                    <button
                      className="p-1 hover:bg-amber-200 rounded-md transition-colors"
                      onClick={() => toggleParentGroupExpanded(parentKey)}
                    >
                      {isParentExpanded ? (
                        <ChevronUp className="h-6 w-6 text-amber-700" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-amber-700" />
                      )}
                    </button>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleParentGroupExpanded(parentKey)}
                    >
                      <div className="font-bold text-gray-900 text-lg">
                        {parentGroup.examGroupName} ({parentGroup.sessionName})
                      </div>
                      <div className="text-sm text-gray-700 mt-1 flex gap-4">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-600">
                            {groupingMode === 'student'
                              ? 'Students'
                              : 'Subjects'}
                            :
                          </span>
                          <span className="font-medium text-amber-700">
                            {groupingMode === 'student'
                              ? parentGroup.studentGroups?.length || 0
                              : parentGroup.subjectGroups?.length || 0}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-600">Total Results:</span>
                          <span className="font-medium text-amber-700">
                            {groupingMode === 'student'
                              ? parentGroup.studentGroups?.reduce(
                                  (sum: number, sg: any) =>
                                    sum + sg.results.length,
                                  0
                                ) || 0
                              : parentGroup.subjectGroups?.reduce(
                                  (sum: number, sg: any) =>
                                    sum + sg.results.length,
                                  0
                                ) || 0}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation()
                        exportParentGroupToExcel(parentGroup)
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>

                  {/* Child Groups (Student or Subject) */}
                  {isParentExpanded && (
                    <div className="bg-white p-4 space-y-3">
                      {groupingMode === 'student'
                        ? // Student groups
                          parentGroup.studentGroups?.map(
                            (studentGroup: any) => {
                              const childKey = `${parentKey}-${studentGroup.studentId}`
                              const isChildExpanded =
                                expandedChildGroups.has(childKey)

                              return (
                                <div
                                  key={childKey}
                                  className="rounded-lg border border-gray-300 overflow-hidden"
                                >
                                  {/* Student Group Header */}
                                  <div className="bg-slate-50 p-3 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div
                                      className="flex items-center gap-3 flex-1 cursor-pointer"
                                      onClick={() =>
                                        toggleChildGroupExpanded(childKey)
                                      }
                                    >
                                      <button className="p-1 hover:bg-white rounded-md transition-colors">
                                        {isChildExpanded ? (
                                          <ChevronUp className="h-5 w-5 text-gray-700" />
                                        ) : (
                                          <ChevronDown className="h-5 w-5 text-gray-700" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-800">
                                          {studentGroup.studentName}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-0.5 space-x-4">
                                          <span className="inline-flex items-center gap-1">
                                            <span>Division:</span>
                                            <span className="font-medium">
                                              {studentGroup.divisionName}
                                            </span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <span>Subjects:</span>
                                            <span className="font-medium text-amber-600">
                                              {studentGroup.results.length}
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2 border bg-amber-50 text-amber-600 whitespace-nowrap"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePrintGroup({
                                          type: 'student',
                                          studentName: studentGroup.studentName,
                                          examGroupsId: parentGroup.examGroupId,
                                          examGroupName:
                                            parentGroup.examGroupName,
                                          sessionName: parentGroup.sessionName,
                                          divisionName:
                                            studentGroup.divisionName,
                                          className: studentGroup.className,
                                          results: studentGroup.results,
                                        })
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </div>

                                  {/* Results Table */}
                                  {isChildExpanded && (
                                    <div className="bg-white border-t border-gray-200 p-3">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                                            <TableHead className="text-gray-700 font-semibold">
                                              Subject
                                            </TableHead>
                                            <TableHead className="text-gray-700 font-semibold text-right">
                                              Gained Marks
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {studentGroup.results.map(
                                            (result: any) => (
                                              <TableRow
                                                key={result.examResultId}
                                                className="hover:bg-amber-50"
                                              >
                                                <TableCell className="capitalize font-medium text-gray-800">
                                                  {result.examSubjectName ||
                                                    '-'}
                                                </TableCell>
                                                <TableCell className="font-semibold text-gray-800 text-right text-base">
                                                  {result.gainedMarks}/
                                                  {result.totalMarks}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                          )
                        : // Subject groups
                          parentGroup.subjectGroups?.map(
                            (subjectGroup: any) => {
                              const childKey = `${parentKey}-${subjectGroup.examSubjectId}`
                              const isChildExpanded =
                                expandedChildGroups.has(childKey)

                              return (
                                <div
                                  key={childKey}
                                  className="rounded-lg border border-gray-300 overflow-hidden"
                                >
                                  {/* Subject Group Header */}
                                  <div className="bg-slate-50 p-3 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div
                                      className="flex items-center gap-3 flex-1 cursor-pointer"
                                      onClick={() =>
                                        toggleChildGroupExpanded(childKey)
                                      }
                                    >
                                      <button className="p-1 hover:bg-white rounded-md transition-colors">
                                        {isChildExpanded ? (
                                          <ChevronUp className="h-5 w-5 text-gray-700" />
                                        ) : (
                                          <ChevronDown className="h-5 w-5 text-gray-700" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-800">
                                          {subjectGroup.subjectName}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-0.5 space-x-4">
                                          <span className="inline-flex items-center gap-1">
                                            <span>Division:</span>
                                            <span className="font-medium">
                                              {subjectGroup.divisionName}
                                            </span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <span>Students:</span>
                                            <span className="font-medium text-amber-600">
                                              {subjectGroup.results.length}
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2 border bg-amber-50 text-amber-600 whitespace-nowrap"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePrintGroup({
                                          type: 'subject',
                                          subjectName: subjectGroup.subjectName,
                                          examGroupsId: parentGroup.examGroupId,
                                          examGroupName:
                                            parentGroup.examGroupName,
                                          sessionName: parentGroup.sessionName,
                                          divisionName:
                                            subjectGroup.divisionName,
                                          className: subjectGroup.className,
                                          results: subjectGroup.results,
                                        })
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </div>

                                  {/* Results Table */}
                                  {isChildExpanded && (
                                    <div className="bg-white border-t border-gray-200 p-3">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                                            <TableHead className="text-gray-700 font-semibold">
                                              Student Name
                                            </TableHead>
                                            <TableHead className="text-gray-700 font-semibold text-right">
                                              Gained Marks
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {subjectGroup.results.map(
                                            (result: any) => (
                                              <TableRow
                                                key={result.examResultId}
                                                className="hover:bg-amber-50"
                                              >
                                                <TableCell className="capitalize font-medium text-gray-800">
                                                  {result.studentName || '-'}
                                                </TableCell>
                                                <TableCell className="font-semibold text-gray-800 text-right text-base">
                                                  {result.gainedMarks}/
                                                  {result.totalMarks}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                          )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {groupedExamResults.length > 0 && (
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

      {/* Print Reference for Report Card */}
      <div style={{ display: 'none' }}>
        <div ref={contentRef}>
          {selectedGroupForPrint &&
            selectedGroupForPrint.type === 'student' && (
              <ReportCard
                studentName={selectedGroupForPrint.studentName || ''}
                divisionName={selectedGroupForPrint.divisionName}
                className={selectedGroupForPrint.className}
                examGroupName={selectedGroupForPrint.examGroupName}
                results={selectedGroupForPrint.results}
                sessionName={selectedGroupForPrint.sessionName}
              />
            )}
          {selectedGroupForPrint &&
            selectedGroupForPrint.type === 'subject' && (
              <SubjectReportCard
                subjectName={selectedGroupForPrint.subjectName || ''}
                divisionName={selectedGroupForPrint.divisionName}
                className={selectedGroupForPrint.className}
                examGroupName={selectedGroupForPrint.examGroupName}
                results={selectedGroupForPrint.results}
                sessionName={selectedGroupForPrint.sessionName}
              />
            )}
        </div>
      </div>
    </div>
  )
}

export default ResultReport
