'use client'

import React from 'react'
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
  updateSubjectEntry: (
    index: number,
    field: keyof StudentResultEntry,
    value: number | null
  ) => void
  students: any
  sessions: any
  classes: any
  sections: any
  examGroups: any
  filteredSubjectsByClass: any
}

export const StudentWiseEntryModeFields: React.FC<
  StudentWiseEntryModeFieldsProps
> = ({
  formData,
  handleSelectChange,
  studentWiseResults,
  updateSubjectEntry,
  students = { data: [] },
  sessions = { data: [] },
  classes = { data: [] },
  sections = { data: [] },
  examGroups = { data: [] },
  filteredSubjectsByClass = [],
}) => {
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
                const resultEntry = studentWiseResults.find(
                  (entry) => entry.examSubjectId === subject.examSubjectId
                )
                const resultIndex = studentWiseResults.findIndex(
                  (entry) => entry.examSubjectId === subject.examSubjectId
                )

                return (
                  <div
                    key={subject.examSubjectId || index}
                    className="grid grid-cols-12 gap-4 items-center border p-3 rounded-md hover:bg-gray-50"
                  >
                    <div className="col-span-8">
                      <Label className="font-normal">
                        {subject?.subjectName || 'Unnamed subject'}
                      </Label>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={resultEntry?.gainedMarks || ''}
                        onChange={(e) => {
                          const value =
                            e.target.value === '' ? 0 : Number(e.target.value)
                          if (resultIndex !== -1) {
                            updateSubjectEntry(
                              resultIndex,
                              'gainedMarks',
                              value
                            )
                          }
                        }}
                        placeholder="0"
                        disabled={!formData.studentId || !formData.classId}
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
