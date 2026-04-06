'use client'

import React, { Dispatch, SetStateAction } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomCombobox } from '@/utils/custom-combobox'
import type { CreateExamResultsType } from '@/utils/type'

interface StudentResultEntry {
  examSubjectId: number | null
  gainedMarks: number
}

interface StudentWiseEntryModeFieldsProps {
  formData: CreateExamResultsType
  handleSelectChange: (name: string, value: string) => void
  studentWiseResults: StudentResultEntry[]
  setStudentWiseResults: Dispatch<SetStateAction<StudentResultEntry[]>>
  students: any
  sessions: any
  divisions: any
  examGroups: any
  filteredSubjectsByDivision: any[]
  examResults: any
}

export const StudentWiseEntryModeFields: React.FC<
  StudentWiseEntryModeFieldsProps
> = ({
  formData,
  handleSelectChange,
  studentWiseResults,
  setStudentWiseResults,
  students = { data: [] },
  sessions = { data: [] },
  divisions = { data: [] },
  examGroups = { data: [] },
  filteredSubjectsByDivision = [],
  examResults = { data: [] },
}) => {
  const getExistingResult = (subjectId: number) => {
    if (!formData.studentId || !formData.examGroupsId || !formData.sessionId)
      return null
    return (examResults?.data || []).find(
      (result: any) =>
        result.studentId === formData.studentId &&
        result.examGroupsId === formData.examGroupsId &&
        result.examSubjectId === subjectId &&
        result.sessionId === formData.sessionId
    )
  }

  const getMarksForSubject = (subjectId: number): number => {
    const existingResult = getExistingResult(subjectId)
    if (existingResult) return existingResult.gainedMarks
    const entry = studentWiseResults.find((e) => e.examSubjectId === subjectId)
    return entry ? entry.gainedMarks : 0
  }

  const handleMarksChange = (subjectId: number, marks: number) => {
    setStudentWiseResults((prev) => {
      const existingIndex = prev.findIndex((e) => e.examSubjectId === subjectId)
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          gainedMarks: marks,
        }
        return updated
      }
      return [...prev, { examSubjectId: subjectId, gainedMarks: marks }]
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
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
        <div className="space-y-2">
          <Label htmlFor="studentId">
            Student <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (students?.data || [])?.map((student: any) => ({
                id: student?.studentDetails?.studentId?.toString() || '0',
                name:
                  `${student?.studentDetails?.firstName || ''} ${student?.studentDetails?.lastName || ''} - ${student?.studentDetails?.divisionName || ''} - ${student?.studentDetails?.rollNo || ''}`.trim() ||
                  'Unnamed student',
              })) || []
            }
            value={
              formData.studentId
                ? {
                    id: formData.studentId.toString(),
                    name: (() => {
                      const found = (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )
                      return found
                        ? `${found?.studentDetails?.firstName || ''} ${found?.studentDetails?.lastName || ''} - ${found?.studentDetails?.divisionName || ''} - ${found?.studentDetails?.rollNo || ''}`.trim()
                        : ''
                    })(),
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('studentId', value ? String(value.id) : '')
            }
            placeholder="Select student"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessionId">Session</Label>
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
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="divisionId">Division</Label>
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
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="mb-4">
          <Label className="text-base font-semibold">Subject Results</Label>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredSubjectsByDivision &&
          filteredSubjectsByDivision.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-4 items-center px-3 py-2 bg-gray-50 rounded-md font-medium text-sm">
                <div className="col-span-8">Subject Name</div>
                <div className="col-span-4">Gained Marks</div>
              </div>
              {filteredSubjectsByDivision.map((subject: any, index: number) => {
                const subjectId = subject.examSubjectId
                const currentMarks = getMarksForSubject(subjectId)
                const existingResult = getExistingResult(subjectId)
                const isDisabled =
                  !formData.studentId ||
                  !formData.divisionId ||
                  !!existingResult

                return (
                  <div
                    key={subjectId || index}
                    className={`grid grid-cols-12 gap-4 items-center border p-3 rounded-md ${
                      existingResult ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="col-span-8">
                      <Label className="font-normal">
                        {subject?.subjectName || 'Unnamed subject'}
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
                          handleMarksChange(subjectId, value)
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
              {!formData.studentId || !formData.divisionId
                ? 'Please select a student first to view subjects'
                : 'No subjects available for this division'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
