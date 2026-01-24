'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomCombobox } from '@/utils/custom-combobox'
import type { CreateExamResultsType } from '@/utils/type'

interface SubjectWiseStudent {
  studentId: number | null
  gainedMarks: number
}

interface SubjectWiseEntryModeFieldsProps {
  formData: CreateExamResultsType & {
    classId?: number | null
    sectionId?: number | null
  }
  handleSelectChange: (name: string, value: string) => void
  subjectWiseStudents: SubjectWiseStudent[]
  updateStudentEntry: (
    index: number,
    field: keyof SubjectWiseStudent,
    value: number | null
  ) => void
  students: any
  sessions: any
  classes: any
  sections: any
  examGroups: any
  sectionsByClass: any
  filteredSubjectsByClass: any
}

export const SubjectWiseEntryModeFields: React.FC<
  SubjectWiseEntryModeFieldsProps
> = ({
  formData,
  handleSelectChange,
  subjectWiseStudents,
  updateStudentEntry,
  students = { data: [] },
  sessions = { data: [] },
  classes = { data: [] },
  sections = { data: [] },
  examGroups = { data: [] },
  sectionsByClass = { data: [] },
  filteredSubjectsByClass = [],
}) => {
  // Filter students by selected class and section
  const filteredStudents = (students?.data || [])?.filter((student: any) => {
    return (
      student?.studentDetails?.classId === formData.classId &&
      student?.studentDetails?.sectionId === formData.sectionId
    )
  })

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
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

        <div className="space-y-2">
          <Label htmlFor="classId">
            Class <span className="text-red-500">*</span>
          </Label>
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
            placeholder="Select class"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectionId">
            Section <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (sectionsByClass?.data || [])?.map((section: any) => ({
                id: section?.sectionId?.toString() || '0',
                name: section?.sectionName || 'Unnamed section',
              })) || []
            }
            value={
              formData.sectionId
                ? {
                    id: formData.sectionId.toString(),
                    name:
                      (sectionsByClass?.data || [])?.find(
                        (s: any) => s?.sectionId === formData.sectionId
                      )?.sectionName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('sectionId', value ? String(value.id) : '')
            }
            placeholder="Select section"
            disabled={!formData.classId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="examSubjectId">
            Subject <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (filteredSubjectsByClass || [])?.map((subject: any) => ({
                id: subject?.examSubjectId?.toString() || '0',
                name: subject?.subjectName || 'Unnamed subject',
              })) || []
            }
            value={
              formData.examSubjectId
                ? {
                    id: formData.examSubjectId.toString(),
                    name:
                      (filteredSubjectsByClass || [])?.find(
                        (s: any) => s?.examSubjectId === formData.examSubjectId
                      )?.subjectName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('examSubjectId', value ? String(value.id) : '')
            }
            placeholder={
              formData.classId ? 'Select subject' : 'Select class first'
            }
            disabled={!formData.classId}
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="mb-4">
          <Label className="text-base font-semibold">Student Results</Label>
          {formData.classId &&
            formData.sectionId &&
            filteredStudents.length > 0 && (
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

                const resultEntry = subjectWiseStudents.find(
                  (entry) => entry.studentId === studentId
                )
                const resultIndex = subjectWiseStudents.findIndex(
                  (entry) => entry.studentId === studentId
                )

                return (
                  <div
                    key={studentId || index}
                    className="grid grid-cols-12 gap-4 items-center border p-3 rounded-md hover:bg-gray-50"
                  >
                    <div className="col-span-8">
                      <Label className="font-normal">{studentName}</Label>
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
                            updateStudentEntry(
                              resultIndex,
                              'gainedMarks',
                              value
                            )
                          }
                        }}
                        placeholder="0"
                        disabled={!formData.examSubjectId}
                      />
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm border rounded-md">
              {!formData.classId || !formData.sectionId
                ? 'Please select class and section to view students'
                : 'No students found in this class and section'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
