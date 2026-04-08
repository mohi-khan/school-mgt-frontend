'use client'

import React, { Dispatch, SetStateAction, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomCombobox } from '@/utils/custom-combobox'
import type { CreateExamResultsType } from '@/utils/type'

interface SubjectWiseStudent {
  studentId: number | null
  gainedMarks: number
}

interface SubjectWiseEntryModeFieldsProps {
  formData: CreateExamResultsType
  handleSelectChange: (name: string, value: string) => void
  subjectWiseStudents: SubjectWiseStudent[]
  setSubjectWiseStudents: Dispatch<SetStateAction<SubjectWiseStudent[]>>
  students: any
  sessions: any
  divisions: any
  examGroups: any
  filteredSubjectsByDivision: any[]
  examResults: any
  classes?: any
}

export const SubjectWiseEntryModeFields: React.FC<
  SubjectWiseEntryModeFieldsProps
> = ({
  formData,
  handleSelectChange,
  subjectWiseStudents,
  setSubjectWiseStudents,
  students = { data: [] },
  sessions = { data: [] },
  divisions = { data: [] },
  examGroups = { data: [] },
  filteredSubjectsByDivision = [],
  examResults = { data: [] },
  classes = { data: [] },
}) => {
  console.log('🚀 ~ SubjectWiseEntryModeFields ~ classes:', classes)
  const filteredStudents = formData.examSubjectId
    ? (students?.data || [])?.filter(
        (student: any) =>
          student?.studentDetails?.divisionId === formData.divisionId
      )
    : []

  const availableClasses = useMemo(() => {
    if (!formData.examGroupsId || !formData.sessionId || !formData.divisionId)
      return []

    // Get unique classIds from subjects filtered by examGroup + session + division
    const classIdsInSubjects = new Set(
      (filteredSubjectsByDivision || []).map((subject: any) => subject.classId)
    )

    // Filter classes prop to only those present in subjects
    return (classes?.data || []).filter((cls: any) =>
      classIdsInSubjects.has(cls?.classData?.classId)
    )
  }, [
    filteredSubjectsByDivision,
    classes?.data,
    formData.examGroupsId,
    formData.sessionId,
    formData.divisionId,
  ])

  const getExistingResult = (studentId: number) => {
    if (
      !formData.examSubjectId ||
      !formData.examGroupsId ||
      !formData.sessionId
    )
      return null
    return (examResults?.data || []).find(
      (result: any) =>
        result.studentId === studentId &&
        result.examGroupsId === formData.examGroupsId &&
        result.examSubjectId === formData.examSubjectId &&
        result.sessionId === formData.sessionId
    )
  }

  const getMarksForStudent = (studentId: number): number => {
    const existingResult = getExistingResult(studentId)
    if (existingResult) return existingResult.gainedMarks
    const entry = subjectWiseStudents.find((e) => e.studentId === studentId)
    return entry ? entry.gainedMarks : 0
  }

  const handleMarksChange = (studentId: number, marks: number) => {
    setSubjectWiseStudents((prev) => {
      const existingIndex = prev.findIndex((e) => e.studentId === studentId)
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          gainedMarks: marks,
        }
        return updated
      }
      return [...prev, { studentId, gainedMarks: marks }]
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Exam Group */}
        <div className="space-y-2">
          <Label htmlFor="examGroupsId">
            Exam Group <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              examGroups?.data?.map((group: any) => ({
                id: group?.examGroupsId?.toString() || '0',
                name: group.examGroupName || 'Unnamed group',
              })) || []
            }
            value={
              formData.examGroupsId
                ? {
                    id: formData.examGroupsId.toString(),
                    name:
                      examGroups?.data?.find(
                        (g: any) => g.examGroupsId === formData.examGroupsId
                      )?.examGroupName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('examGroupsId', value ? String(value.id) : '')
            }
            placeholder="Select exam group"
          />
        </div>

        {/* Session */}
        <div className="space-y-2">
          <Label htmlFor="sessionId">
            Session <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (sessions?.data || [])?.map((session: any) => ({
                id: session?.sessionId?.toString() || '0',
                name: session?.sessionName || 'Unnamed session',
              })) || []
            }
            value={
              formData.sessionId
                ? {
                    id: formData.sessionId.toString(),
                    name:
                      (sessions?.data || [])?.find(
                        (s: any) => s?.sessionId === formData.sessionId
                      )?.sessionName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('sessionId', value ? String(value.id) : '')
            }
            placeholder="Select session"
          />
        </div>

        {/* Division */}
        <div className="space-y-2">
          <Label htmlFor="divisionId">
            Division <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (divisions?.data || [])?.map((division: any) => ({
                id: division?.divisionId?.toString() || '0',
                name: division?.divisionName || 'Unnamed division',
              })) || []
            }
            value={
              formData.divisionId
                ? {
                    id: formData.divisionId.toString(),
                    name:
                      (divisions?.data || [])?.find(
                        (d: any) => d?.divisionId === formData.divisionId
                      )?.divisionName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('divisionId', value ? String(value.id) : '')
            }
            placeholder="Select division"
          />
        </div>

        {/* Class */}
        <div className="space-y-2">
          <Label htmlFor="classId">
            Class
          </Label>
          <CustomCombobox
            items={
              availableClasses?.map((cls: any) => ({
                id: cls?.classData?.classId?.toString() || '0',
                name:
                  cls?.classData?.className ||
                  cls?.classTitle ||
                  'Unnamed class',
              })) || []
            }
            value={
              formData.classId
                ? {
                    id: formData.classId.toString(),
                    name:
                      availableClasses?.find(
                        (c: any) => c?.classData?.classId === formData.classId
                      )?.classData?.className || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('classId', value ? String(value.id) : '')
            }
            placeholder="Select class"
          />
        </div>

        {/* Subject */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="examSubjectId">
            Subject <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (filteredSubjectsByDivision || [])?.map((subject: any) => ({
                id: subject?.examSubjectId?.toString() || '0',
                name: subject?.subjectName || 'Unnamed subject',
              })) || []
            }
            value={
              formData.examSubjectId
                ? {
                    id: formData.examSubjectId.toString(),
                    name:
                      (filteredSubjectsByDivision || [])?.find(
                        (s: any) => s?.examSubjectId === formData.examSubjectId
                      )?.subjectName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('examSubjectId', value ? String(value.id) : '')
            }
            placeholder={
              formData.divisionId ? 'Select subject' : 'Select division first'
            }
            disabled={!formData.divisionId}
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="mb-4">
          <Label className="text-base font-semibold">Student Results</Label>
          {formData.divisionId && filteredStudents.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {filteredStudents.length} student
              {filteredStudents.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredStudents && filteredStudents.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-4 items-center px-3 py-2 bg-gray-50 rounded-md font-medium text-sm">
                <div className="col-span-8">Student Name</div>
                <div className="col-span-4">Gained Marks</div>
              </div>
              {filteredStudents.map((student: any, index: number) => {
                const studentId = student?.studentDetails?.studentId
                const studentName =
                  `${student?.studentDetails?.firstName || ''} ${student?.studentDetails?.lastName || ''}`.trim() ||
                  'Unnamed student'
                const currentMarks = getMarksForStudent(studentId)
                const existingResult = getExistingResult(studentId)
                const isDisabled = !formData.examSubjectId || !!existingResult

                return (
                  <div
                    key={studentId || index}
                    className={`grid grid-cols-12 gap-4 items-center border p-3 rounded-md ${
                      existingResult ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="col-span-8">
                      <Label className="font-normal">
                        {studentName}
                        {existingResult && (
                          <span className="ml-2 text-xs text-green-600 font-semibold">
                            (Already Added)
                          </span>
                        )}
                      </Label>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentMarks || ''}
                        onChange={(e) => {
                          const value =
                            e.target.value === '' ? 0 : Number(e.target.value)
                          handleMarksChange(studentId, value)
                        }}
                        placeholder="0"
                        disabled={isDisabled}
                        className={
                          existingResult ? 'bg-gray-200 cursor-not-allowed' : ''
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm border rounded-md">
              {!formData.divisionId
                ? 'Please select a division to view students'
                : 'No students found in this division'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
