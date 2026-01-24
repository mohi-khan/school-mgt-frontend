'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomCombobox } from '@/utils/custom-combobox'
import type { CreateExamResultsType } from '@/utils/type'

interface SingleEntryModeFieldsProps {
  formData: CreateExamResultsType & {
    classId?: number | null
    sectionId?: number | null
  }
  handleSelectChange: (name: string, value: string) => void
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  students: any
  sessions: any
  classes: any
  sections: any
  examGroups: any
  subjects: any
}

export const SingleEntryModeFields: React.FC<SingleEntryModeFieldsProps> = ({
  formData,
  handleSelectChange,
  handleInputChange,
  students = { data: [] },
  sessions = { data: [] },
  classes = { data: [] },
  sections = { data: [] },
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
                  `${student?.studentDetails?.firstName || ''} ${student?.studentDetails?.lastName || ''} - ${student?.studentDetails?.className || ''} - ${student?.studentDetails?.sectionName || ''} - ${student?.studentDetails?.rollNo || ''}`.trim() ||
                  'Unnamed student',
              })) || []
            }
            value={
              formData.studentId
                ? {
                    id: formData.studentId.toString(),
                    name: (() => {
                      const foundStudent = (students?.data || [])?.find(
                        (s: any) =>
                          s?.studentDetails?.studentId === formData.studentId
                      )
                      return foundStudent
                        ? `${foundStudent?.studentDetails?.firstName || ''} ${foundStudent?.studentDetails?.lastName || ''} - ${foundStudent?.studentDetails?.className || ''} - ${foundStudent?.studentDetails?.sectionName || ''} - ${foundStudent?.studentDetails?.rollNo || ''}`.trim()
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
              // Don't allow manual changes when auto-selected
              if (!formData.studentId) {
                handleSelectChange('sessionId', value ? String(value.id) : '')
              }
            }}
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
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
            onChange={(value) => {
              // Don't allow manual changes when auto-selected
              if (!formData.studentId) {
                handleSelectChange('classId', value ? String(value.id) : '')
              }
            }}
            placeholder="Auto-selected from student"
            disabled={!!formData.studentId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectionId">
            Section <span className="text-red-500">*</span>
          </Label>
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
            onChange={(value) => {
              // Don't allow manual changes when auto-selected
              if (!formData.studentId) {
                handleSelectChange('sectionId', value ? String(value.id) : '')
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
