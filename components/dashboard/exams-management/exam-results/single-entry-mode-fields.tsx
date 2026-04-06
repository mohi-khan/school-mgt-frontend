'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomCombobox } from '@/utils/custom-combobox'
import type { CreateExamResultsType } from '@/utils/type'

interface SingleEntryModeFieldsProps {
  formData: CreateExamResultsType
  handleSelectChange: (name: string, value: string) => void
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  students: any
  sessions: any
  divisions: any
  examGroups: any
  subjects: any
}

export const SingleEntryModeFields: React.FC<SingleEntryModeFieldsProps> = ({
  formData,
  handleSelectChange,
  handleInputChange,
  students = { data: [] },
  sessions = { data: [] },
  divisions = { data: [] },
  examGroups = { data: [] },
  subjects = { data: [] },
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Student */}
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
            onChange={(value) => {
              if (!formData.studentId) {
                handleSelectChange('sessionId', value ? String(value.id) : '')
              }
            }}
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
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
            onChange={(value) => {
              if (!formData.studentId) {
                handleSelectChange('divisionId', value ? String(value.id) : '')
              }
            }}
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
          />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="examSubjectId">
            Subject <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              (subjects?.data || [])?.map((subject: any) => ({
                id: subject?.examSubjectId?.toString() || '0',
                name: subject?.subjectName || 'Unnamed subject',
              })) || []
            }
            value={
              formData.examSubjectId
                ? {
                    id: formData.examSubjectId.toString(),
                    name:
                      (subjects?.data || [])?.find(
                        (s: any) => s?.examSubjectId === formData.examSubjectId
                      )?.subjectName || '',
                  }
                : null
            }
            onChange={(value) =>
              handleSelectChange('examSubjectId', value ? String(value.id) : '')
            }
            placeholder="Select subject"
          />
        </div>

        {/* Gained Marks */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="gainedMarks">
            Gained Marks <span className="text-red-500">*</span>
          </Label>
          <Input
            id="gainedMarks"
            name="gainedMarks"
            type="number"
            min="0"
            step="0.01"
            value={formData.gainedMarks}
            onChange={handleInputChange}
            placeholder="Enter gained marks"
          />
        </div>
      </div>
    </>
  )
}
