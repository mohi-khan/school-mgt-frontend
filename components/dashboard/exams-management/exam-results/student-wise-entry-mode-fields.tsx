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
  formData: CreateExamResultsType & {
    classId?: number | null
    sectionId?: number | null
  }
  handleSelectChange: (name: string, value: string) => void
  studentWiseResults: StudentResultEntry[]
  setStudentWiseResults: Dispatch<SetStateAction<StudentResultEntry[]>>
  students: any
  sessions: any
  classes: any
  sections: any
  examGroups: any
  filteredSubjectsByClass: any
  examResults: any // Add this to check existing results
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
  classes = { data: [] },
  sections = { data: [] },
  examGroups = { data: [] },
  filteredSubjectsByClass = [],
  examResults = { data: [] },
}) => {
  // Helper function to check if result already exists in database
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

  // Helper function to get or create marks for a subject
  const getMarksForSubject = (subjectId: number): number => {
    // First check if it exists in database
    const existingResult = getExistingResult(subjectId)
    if (existingResult) {
      return existingResult.gainedMarks
    }

    // Then check in current form data
    const entry = studentWiseResults.find((e) => e.examSubjectId === subjectId)
    return entry ? entry.gainedMarks : 0
  }

  // Helper function to update marks for a subject
  const handleMarksChange = (subjectId: number, marks: number) => {
    setStudentWiseResults((prev) => {
      const existingIndex = prev.findIndex((e) => e.examSubjectId === subjectId)

      if (existingIndex !== -1) {
        // Update existing entry
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          gainedMarks: marks,
        }
        return updated
      } else {
        // Add new entry
        return [...prev, { examSubjectId: subjectId, gainedMarks: marks }]
      }
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="studentId">
            Student <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (students?.data || [])?.map((student: any) => ({
                id: student?.studentDetails?.studentId?.toString() || '0',
                name:
                  `${student?.studentDetails?.firstName || ''} ${student?.studentDetails?.lastName || ''} - ${student?.studentDetails?.className || ''} - ${student?.studentDetails?.sectionName || ''} - ${student?.studentDetails?.rollNo || ''}`.trim() ||
                  'Unnamed student',
              })) || []
            }
            value={
              formData.studentId
                ? {
                    id: formData.studentId.toString(),
                    name: `${
                      (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )?.studentDetails?.firstName || ''
                    } ${
                      (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )?.studentDetails?.lastName || ''
                    } - ${
                      (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )?.studentDetails?.className || ''
                    } - ${
                      (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )?.studentDetails?.sectionName || ''
                    } - ${
                      (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )?.studentDetails?.rollNo || ''
                    }`.trim(),
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
          <Label htmlFor="classId">Class</Label>
          <CustomCombobox
            items={
              (classes?.data || [])?.map((cls: any) => ({
                id: cls?.classData?.classId?.toString() || '0',
                name: cls?.classData?.className || 'Unnamed class',
              })) || []
            }
            value={
              formData.classId
                ? {
                    id: formData.classId.toString(),
                    name:
                      (classes?.data || [])?.find(
                        (c: any) => c?.classData?.classId === formData.classId
                      )?.classData?.className || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('classId', value ? String(value.id) : '')
            }
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectionId">Section</Label>
          <CustomCombobox
            items={
              (sections?.data || [])?.map((section: any) => ({
                id: section?.sectionId?.toString() || '0',
                name: section?.sectionName || 'Unnamed section',
              })) || []
            }
            value={
              formData.sectionId
                ? {
                    id: formData.sectionId.toString(),
                    name:
                      (sections?.data || [])?.find(
                        (s: any) => s?.sectionId === formData.sectionId
                      )?.sectionName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('sectionId', value ? String(value.id) : '')
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
          {filteredSubjectsByClass && filteredSubjectsByClass.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-4 items-center px-3 py-2 bg-gray-50 rounded-md font-medium text-sm">
                <div className="col-span-8">Subject Name</div>
                <div className="col-span-4">Gained Marks</div>
              </div>
              {filteredSubjectsByClass.map((subject: any, index: number) => {
                const subjectId = subject.examSubjectId
                const currentMarks = getMarksForSubject(subjectId)
                const existingResult = getExistingResult(subjectId)
                const isDisabled =
                  !formData.studentId || !formData.classId || !!existingResult

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
              {!formData.studentId || !formData.classId
                ? 'Please select a student first to view subjects'
                : 'No subjects available for this class'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
