'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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
  addSubjectEntry: () => void
  removeSubjectEntry: (index: number) => void
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
  addSubjectEntry,
  removeSubjectEntry,
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
                  `${student?.studentDetails?.firstName || ''} ${student?.studentDetails?.lastName || ''}`.trim() ||
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

        {/* Exam Group */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="examGroupsId">
            Exam Group <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (examGroups?.data || [])?.map((group: any) => ({
                id: group?.examGroupId?.toString() || '0',
                name: group?.examGroupName || 'Unnamed group',
              })) || []
            }
            value={
              formData.examGroupsId
                ? {
                    id: formData.examGroupsId.toString(),
                    name:
                      (examGroups?.data || [])?.find(
                        (g: any) => g?.examGroupId === formData.examGroupsId
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
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-base font-semibold">Subject Results</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubjectEntry}
            disabled={!formData.studentId || !formData.classId}
          >
            Add Subject
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {studentWiseResults.map((entry, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-end border p-3 rounded-md"
            >
              <div className="col-span-7 space-y-2">
                <Label>Subject</Label>
                <CustomCombobox
                  items={
                    (filteredSubjectsByClass || [])?.map((subject: any) => ({
                      id: subject?.examSubjectId?.toString() || '0',
                      name: subject?.subjectName || 'Unnamed subject',
                    })) || []
                  }
                  value={
                    entry.examSubjectId
                      ? {
                          id: entry.examSubjectId.toString(),
                          name:
                            (filteredSubjectsByClass || [])?.find(
                              (s: any) =>
                                s?.examSubjectId === entry.examSubjectId
                            )?.subjectName || '',
                        }
                      : null
                  }
                  onChange={(value) =>
                    updateSubjectEntry(
                      index,
                      'examSubjectId',
                      value ? Number(value.id) : null
                    )
                  }
                  placeholder={
                    formData.classId
                      ? 'Select subject'
                      : 'Select student first'
                  }
                  disabled={!formData.classId}
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
                    updateSubjectEntry(
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
                  onClick={() => removeSubjectEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {studentWiseResults.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              {!formData.studentId || !formData.classId
                ? 'Please select a student first to add subjects'
                : 'No subjects added yet. Click "Add Subject" to begin.'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
