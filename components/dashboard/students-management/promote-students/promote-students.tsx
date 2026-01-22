'use client'

import type React from 'react'
import { useState, useMemo } from 'react'
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
import { Users, AlertCircle } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { CustomCombobox } from '@/utils/custom-combobox'
import type { PromotionResponseType, StudentPromotionsType } from '@/utils/type'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { formatDate, formatNumber } from '@/utils/conversions'
import {
  useGetStudentFeesByClassSection,
  usePromoteStudents,
  useGetFeesMasters,
  useGetClasses,
  useGetSections,
  useGetSessions,
  useGetSectionsByClassId,
} from '@/hooks/use-api'

const PromoteStudents = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null
  )
  const [failedPromotions, setFailedPromotions] = useState<
    PromotionResponseType['notPromotedStudents']
  >([])
  console.log('🚀 ~ PromoteStudents ~ failedPromotions:', failedPromotions)
  const [showFailedPopup, setShowFailedPopup] = useState(false)

  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(
    new Set()
  )
  const [selectAll, setSelectAll] = useState(false)

  const [isPromotionPopupOpen, setIsPromotionPopupOpen] = useState(false)
  const [promoteClassId, setPromoteClassId] = useState<number | null>(null)
  const [promoteSectionId, setPromoteSectionId] = useState<number | null>(null)
  const [promoteSessionId, setPromoteSessionId] = useState<number | null>(null)
  const [selectedFeesMasters, setSelectedFeesMasters] = useState<Set<number>>(
    new Set()
  )

  const { data: classesData } = useGetClasses()
  // For students filter
  const { data: sectionsData } = useGetSectionsByClassId(selectedClassId ?? 0)

  // For promotion popup
  const { data: promoteSectionsData } = useGetSectionsByClassId(
    promoteClassId ?? 0
  )

  console.log('🚀 ~ PromoteStudents ~ sectionsData:', sectionsData)

  const { data: sessionsData } = useGetSessions()

  const { data: studentsData } = useGetStudentFeesByClassSection(
    selectedClassId || 0,
    selectedSectionId || 0
  )
  const { data: feesMastersData } = useGetFeesMasters()

  const students = useMemo(() => {
    return (
      studentsData?.data?.map((item: any) => ({
        studentId: item.studentDetails?.studentId,
        admissionNo: item.studentDetails?.admissionNo,
        rollNo: item.studentDetails?.rollNo,
        firstName: item.studentDetails?.firstName,
        lastName: item.studentDetails?.lastName,
        email: item.studentDetails?.email,
        phoneNumber: item.studentDetails?.phoneNumber,
        classId: item.studentDetails?.classId,
        sectionId: item.studentDetails?.sectionId,
        sessionId: item.studentDetails?.sessionId,
        className: item.studentDetails?.className,
        sectionName: item.studentDetails?.sectionName,
      })) || []
    )
  }, [studentsData?.data])

  const groupedFeesMasters = useMemo(() => {
    if (!feesMastersData?.data) return {}
    return feesMastersData.data.reduce((acc: Record<string, any[]>, fee) => {
      const groupName = fee.feesGroupName || 'Ungrouped'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(fee)
      return acc
    }, {})
  }, [feesMastersData?.data])

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedStudents(new Set())
      setSelectAll(false)
    } else {
      setSelectedStudents(new Set(students.map((s) => s.studentId)))
      setSelectAll(true)
    }
  }

  const handleStudentToggle = (studentId: number) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
    setSelectAll(newSelected.size === students.length && students.length > 0)
  }

  const handleGroupFeesMastersToggle = (groupFeeIds: number[]) => {
    const newSelected = new Set(selectedFeesMasters)
    const isGroupSelected = groupFeeIds.every((id) =>
      selectedFeesMasters.has(id)
    )

    if (isGroupSelected) {
      groupFeeIds.forEach((id) => newSelected.delete(id))
    } else {
      groupFeeIds.forEach((id) => newSelected.add(id))
    }
    setSelectedFeesMasters(newSelected)
  }

  const promoteMutation = usePromoteStudents({
    onClose: () => setIsPromotionPopupOpen(false),
    setFailedPromotions: setFailedPromotions,
    setShowFailedPopup: setShowFailedPopup,
    onSuccess: (response) => {
      console.log('🚀 ~ PromoteStudents ~ response:', response)

      if (response.notPromotedStudents?.length > 0) {
        setFailedPromotions(response.notPromotedStudents)
        setShowFailedPopup(true)
      }
    },
    reset: () => {
      setSelectedStudents(new Set())
      setSelectAll(false)
      setSelectedFeesMasters(new Set())
      setPromoteClassId(null)
      setPromoteSectionId(null)
      setPromoteSessionId(null)
    },
  })

  const handleOpenPromotePopup = () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student')
      return
    }
    setIsPromotionPopupOpen(true)
  }

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!promoteClassId || !promoteSectionId || !promoteSessionId) {
      setError('Please select class, section, and session for promotion')
      return
    }

    if (selectedFeesMasters.size === 0) {
      setError('Please select at least one fees master')
      return
    }

    try {
      const promotionData: StudentPromotionsType = {
        students: Array.from(selectedStudents).map((studentId) => {
          const student = students.find((s) => s.studentId === studentId)
          return {
            studentId,
            classId: promoteClassId,
            secitionId: promoteSectionId,
            sessionId: promoteSessionId,
            currentResult: 'Pass',
            nextSession: 'Continue',
          }
        }),
        feesMasterIds: Array.from(selectedFeesMasters),
      }

      promoteMutation.mutate({ data: promotionData })
      setSelectedClassId(null)
      setSelectedSectionId(null)
    } catch (err) {
      setError('Failed to promote students')
      console.error(err)
    }
  }

  const getSelectedStudentsData = () => {
    return students.filter((s) => selectedStudents.has(s.studentId))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Users className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Promote Students</h2>
        </div>
        <Button
          className="bg-amber-400 hover:bg-amber-500 text-black"
          onClick={handleOpenPromotePopup}
          disabled={selectedStudents.size === 0}
        >
          Promote ({selectedStudents.size})
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="classId">Class</Label>
          <CustomCombobox
            items={
              classesData?.data?.map((cls) => ({
                id: cls?.classData?.classId?.toString() || '0',
                name: cls.classData?.className || 'Unnamed class',
              })) || []
            }
            value={
              selectedClassId
                ? {
                    id: selectedClassId.toString(),
                    name:
                      classesData?.data?.find(
                        (c) => c.classData?.classId === selectedClassId
                      )?.classData?.className || '',
                  }
                : null
            }
            onChange={(value) => {
              setSelectedClassId(value ? Number(value.id) : null)
              setSelectedSectionId(null)
              setSelectedStudents(new Set())
              setSelectAll(false)
            }}
            placeholder="Select class"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectionId">Section</Label>
          <CustomCombobox
            items={
              sectionsData?.data?.map((section) => ({
                id: section?.sectionId?.toString() || '0',
                name: section.sectionName || 'Unnamed section',
              })) || []
            }
            value={
              selectedSectionId
                ? {
                    id: selectedSectionId.toString(),
                    name:
                      sectionsData?.data?.find(
                        (s) => s.sectionId === selectedSectionId
                      )?.sectionName || '',
                  }
                : null
            }
            onChange={(value) => {
              setSelectedSectionId(value ? Number(value.id) : null)
              setSelectedStudents(new Set())
              setSelectAll(false)
            }}
            placeholder="Select section"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead className="w-12">
                <Input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllToggle}
                  className="w-4 h-4"
                />
              </TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!studentsData ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No students found. Please select class and section.
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No students found for this class and section
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>
                    <Input
                      type="checkbox"
                      checked={selectedStudents.has(student.studentId)}
                      onChange={() => handleStudentToggle(student.studentId)}
                      className="w-4 h-4"
                    />
                  </TableCell>
                  <TableCell>{student.rollNo}</TableCell>
                  <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell className="text-sm">{student.email}</TableCell>
                  <TableCell>{student.phoneNumber}</TableCell>
                  <TableCell>{student.className}</TableCell>
                  <TableCell>{student.sectionName}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Popup
        isOpen={isPromotionPopupOpen}
        onClose={() => setIsPromotionPopupOpen(false)}
        title="Promote Students"
        size="max-w-6xl"
      >
        <form onSubmit={handlePromote} className="space-y-6 py-4">
          {/* Selected Students Table */}
          <div>
            <h3 className="text-md font-semibold mb-4">Selected Students</h3>
            <div className="rounded-md border overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSelectedStudentsData().map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{student.sectionName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Promotion Configuration */}
          <div className="border p-4 rounded-lg bg-slate-50">
            <h3 className="text-md font-semibold mb-4">Promotion Details</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="promoteClassId">Class</Label>
                <CustomCombobox
                  items={
                    classesData?.data?.map((cls) => ({
                      id: cls?.classData?.classId?.toString() || '0',
                      name: cls.classData?.className || 'Unnamed class',
                    })) || []
                  }
                  value={
                    promoteClassId
                      ? {
                          id: promoteClassId.toString(),
                          name:
                            classesData?.data?.find(
                              (c) => c.classData?.classId === promoteClassId
                            )?.classData?.className || '',
                        }
                      : null
                  }
                  onChange={(value) =>
                    setPromoteClassId(value ? Number(value.id) : null)
                  }
                  placeholder="Select class"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoteSectionId">Section</Label>
                <CustomCombobox
                  items={
                    promoteSectionsData?.data?.map((section) => ({
                      id: section?.sectionId?.toString() || '0',
                      name: section.sectionName || 'Unnamed section',
                    })) || []
                  }
                  value={
                    promoteSectionId
                      ? {
                          id: promoteSectionId.toString(),
                          name:
                            promoteSectionsData?.data?.find(
                              (s) => s.sectionId === promoteSectionId
                            )?.sectionName || '',
                        }
                      : null
                  }
                  onChange={(value) =>
                    setPromoteSectionId(value ? Number(value.id) : null)
                  }
                  placeholder="Select section"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoteSessionId">Session</Label>
                <CustomCombobox
                  items={
                    sessionsData?.data?.map((session) => ({
                      id: session?.sessionId?.toString() || '0',
                      name: session.sessionName || 'Unnamed session',
                    })) || []
                  }
                  value={
                    promoteSessionId
                      ? {
                          id: promoteSessionId.toString(),
                          name:
                            sessionsData?.data?.find(
                              (s) => s.sessionId === promoteSessionId
                            )?.sessionName || '',
                        }
                      : null
                  }
                  onChange={(value) =>
                    setPromoteSessionId(value ? Number(value.id) : null)
                  }
                  placeholder="Select session"
                />
              </div>
            </div>
          </div>

          <div className="border p-4 rounded-lg bg-slate-50">
            <h3 className="text-md font-semibold mb-4">Assign Fees Masters</h3>
            <div className="space-y-6">
              {Object.entries(groupedFeesMasters).map(
                ([groupName, groupFees]) => {
                  const groupFeeIds = groupFees.map((f) => f.feesMasterId || 0)
                  const isGroupSelected = groupFeeIds.every((id) =>
                    selectedFeesMasters.has(id)
                  )

                  return (
                    <div key={groupName} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={isGroupSelected}
                          onChange={() =>
                            handleGroupFeesMastersToggle(groupFeeIds)
                          }
                        />
                        <h4 className="font-medium text-sm">{groupName}</h4>
                      </div>

                      <div className="border rounded-md overflow-hidden bg-white">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="w-1/2">Fees Type</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Amount (BDT)</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {groupFees.map((fee) => (
                              <TableRow key={fee.feesMasterId}>
                                <TableCell className="text-sm">
                                  {fee.feesTypeName}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(new Date(fee.dueDate))}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {formatNumber(fee.amount.toFixed(2))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPromotionPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={promoteMutation.isPending}>
              {promoteMutation.isPending ? 'Promoting...' : 'Confirm Promotion'}
            </Button>
          </div>
        </form>
      </Popup>

      <Popup
        isOpen={showFailedPopup}
        onClose={() => setShowFailedPopup(false)}
        title="Promotion failed for following students"
        size="max-w-4xl"
      >
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-3 bg-red-50 p-4 rounded-md border border-red-200">
            <AlertCircle
              className="text-red-600 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <p className="text-sm text-red-800 font-medium">
                {failedPromotions.length} student(s) could not be promoted due
                to the following reasons:
              </p>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedPromotions.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {student.rollNo}
                    </TableCell>
                    <TableCell>{student.studentName}</TableCell>
                    <TableCell className="text-red-600 text-sm">
                      {student.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowFailedPopup(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              Close
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}

export default PromoteStudents
