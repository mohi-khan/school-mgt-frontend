'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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
  addStudentEntry: () => void
  removeStudentEntry: (index: number) => void
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
  addStudentEntry,
  removeStudentEntry,
  updateStudentEntry,
  students = { data: [] },
  sessions = { data: [] },
  classes = { data: [] },
  sections = { data: [] },
  examGroups = { data: [] },
  sectionsByClass = { data: [] },
  filteredSubjectsByClass = [],
}) => {
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
        <div className="flex justify-between items-center mb-4">
          <Label className="text-base font-semibold">Student Results</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStudentEntry}
            disabled={!formData.classId || !formData.sectionId}
          >
            Add Student
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {subjectWiseStudents.map((entry, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-end border p-3 rounded-md"
            >
              <div className="col-span-7 space-y-2">
                <Label>Student</Label>
                <CustomCombobox
                  items={
                    (students?.data || [])
                      ?.filter((student: any) => {
                        // Filter by class and section
                        return (
                          student?.studentDetails?.classId ===
                            formData.classId &&
                          student?.studentDetails?.sectionId ===
                            formData.sectionId
                        )
                      })
                      .map((student: any) => ({
                        id:
                          student?.studentDetails?.studentId?.toString() ||
                          '0',
                        name:
                          `${student?.studentDetails?.firstName || ''} ${student?.studentDetails?.lastName || ''}`.trim() ||
                          'Unnamed student',
                      })) || []
                  }
                  value={
                    entry.studentId
                      ? {
                          id: entry.studentId.toString(),
                          name: `${
                            (students?.data || [])?.find(
                              (s: any) =>
                                s?.studentDetails?.studentId === entry.studentId
                            )?.studentDetails?.firstName || ''
                          } ${
                            (students?.data || [])?.find(
                              (s: any) =>
                                s?.studentDetails?.studentId === entry.studentId
                            )?.studentDetails?.lastName || ''
                          }`.trim(),
                        }
                      : null
                  }
                  onChange={(value) =>
                    updateStudentEntry(
                      index,
                      'studentId',
                      value ? Number(value.id) : null
                    )
                  }
                  placeholder="Select student"
                />
              </div>
              <div className="col-span-4 space-y-2">
                <Label>Gained Marks</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entry.gainedMarks}
                  onChange={(e) =>
                    updateStudentEntry(
                      index,
                      'gainedMarks',
                      Number(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => removeStudentEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {subjectWiseStudents.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              {!formData.classId || !formData.sectionId
                ? 'Please select class and section first'
                : 'No students added yet. Click "Add Student" to begin.'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
