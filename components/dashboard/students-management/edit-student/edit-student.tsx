'use client'

import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign } from 'lucide-react'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useParams, useRouter } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useGetClasses,
  useGetSections,
  useGetFeesMasters,
  useGetSessions,
  useGetDivisions,
  useGetStudentById,
  useUpdateStudentWithFees,
} from '@/hooks/use-api'
import type { CreateStudentWithFeesType, GetFeesMasterType } from '@/utils/type'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatNumber } from '@/utils/conversions'
import { toast } from '@/hooks/use-toast'

const EditStudent = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const { studentId } = useParams()
  const router = useRouter()

  const { data: student, isLoading: studentLoading } = useGetStudentById(
    Number(studentId)
  )
  const { data: classes } = useGetClasses()
  const { data: divisions } = useGetDivisions()
  const { data: sections } = useGetSections()
  const { data: sessions } = useGetSessions()
  const { data: feesMasters } = useGetFeesMasters()

  const [error, setError] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedFeesMasters, setSelectedFeesMasters] = useState<number[]>([])
  const [initialFormData, setInitialFormData] =
    useState<CreateStudentWithFeesType | null>(null)

  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null)
  const [fatherPhotoFile, setFatherPhotoFile] = useState<File | null>(null)
  const [motherPhotoFile, setMotherPhotoFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<CreateStudentWithFeesType>({
    studentDetails: {
      admissionNo: 0,
      rollNo: 0,
      classId: null,
      divisionId: null,
      sectionId: null,
      sessionId: null,
      firstName: '',
      lastName: '',
      gender: 'male',
      dateOfBirth: '',
      religion: '',
      bloodGroup: null,
      height: null,
      weight: null,
      address: '',
      phoneNumber: '',
      email: '',
      admissionDate: new Date().toISOString().split('T')[0],
      photoUrl: null,
      isActive: true,
      fatherName: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherOccupation: '',
      fatherPhotoUrl: null,
      motherName: '',
      motherPhone: '',
      motherEmail: '',
      motherOccupation: '',
      motherPhotoUrl: null,
    },
    studentFees: [],
  })

  // Populate form with student data
  useEffect(() => {
    if (student?.data) {
      const studentData = student.data
      const genderValue =
        studentData.studentDetails.gender?.toLowerCase() || 'male'
      const populatedData = {
        studentDetails: {
          ...studentData.studentDetails,
          divisionId: studentData.studentDetails.divisionId ?? null,
          dateOfBirth: studentData.studentDetails.dateOfBirth
            ? new Date(studentData.studentDetails.dateOfBirth)
                .toISOString()
                .split('T')[0]
            : '',
          admissionDate: studentData.studentDetails.admissionDate
            ? new Date(studentData.studentDetails.admissionDate)
                .toISOString()
                .split('T')[0]
            : new Date().toISOString().split('T')[0],
          gender: (genderValue === 'female' ? 'female' : 'male') as
            | 'male'
            | 'female',
          bloodGroup: studentData.studentDetails.bloodGroup || null,
        },
        studentFees: studentData.studentFees || [],
      }

      setFormData(populatedData)
      setInitialFormData(populatedData)

      const feesMasterIds =
        studentData.studentFees
          ?.map((fee) => fee.feesMasterId)
          .filter((id): id is number => id !== null) || []
      setSelectedFeesMasters(feesMasterIds)
    }
  }, [student])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    const nameParts = name.split('.')

    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        studentDetails: {
          ...prev.studentDetails,
          [nameParts[1]]: value ? Number(value) : null,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        studentDetails: {
          ...prev.studentDetails,
          [nameParts[1]]: value || null,
        },
      }))
    }
  }

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setStudentPhotoFile(file)
  }

  const handleFatherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFatherPhotoFile(file)
  }

  const handleMotherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setMotherPhotoFile(file)
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'gender' || name === 'bloodGroup') {
      setFormData((prev) => ({
        ...prev,
        studentDetails: {
          ...prev.studentDetails,
          [name]: value || null,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        studentDetails: {
          ...prev.studentDetails,
          [name]: value ? Number(value) : null,
        },
      }))
    }
  }

  const toggleFeesMaster = (feesMasterId: number) => {
    setSelectedFeesMasters((prev) =>
      prev.includes(feesMasterId)
        ? prev.filter((id) => id !== feesMasterId)
        : [...prev, feesMasterId]
    )
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const resetForm = () => {
    if (initialFormData) {
      setFormData(initialFormData)
      setStudentPhotoFile(null)
      setFatherPhotoFile(null)
      setMotherPhotoFile(null)
      setError(null)

      const feesMasterIds =
        initialFormData.studentFees
          ?.map((fee) => fee.feesMasterId)
          .filter((id): id is number => id !== null) || []
      setSelectedFeesMasters(feesMasterIds)
    }
  }

  const updateMutation = useUpdateStudentWithFees({
    onClose: closePopup,
    reset: () => router.push('/dashboard/students-management/students'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { studentDetails } = formData

    if (!studentDetails.firstName.trim())
      return setError('Please enter first name')
    if (!studentDetails.lastName.trim())
      return setError('Please enter last name')
    if (!studentDetails.admissionNo || studentDetails.admissionNo <= 0)
      return setError('Please enter valid admission number')
    if (!studentDetails.divisionId) return setError('Please select a division')
    if (!studentDetails.phoneNumber.trim())
      return setError('Please enter phone number')
    if (!studentDetails.fatherPhone.trim())
      return setError('Please enter father phone')

    const studentFees = selectedFeesMasters.map((feesMasterId) => ({
      feesMasterId,
      studentId: Number(studentId),
    }))

    const form = new FormData()

    const studentDetailsPayload = {
      ...studentDetails,
      photoUrl: studentPhotoFile ? null : studentDetails.photoUrl,
      fatherPhotoUrl: fatherPhotoFile ? null : studentDetails.fatherPhotoUrl,
      motherPhotoUrl: motherPhotoFile ? null : studentDetails.motherPhotoUrl,
    }

    form.append('studentDetails', JSON.stringify(studentDetailsPayload))
    form.append('studentFees', JSON.stringify(studentFees))

    if (studentPhotoFile) form.append('photoUrl', studentPhotoFile)
    if (fatherPhotoFile) form.append('fatherPhotoUrl', fatherPhotoFile)
    if (motherPhotoFile) form.append('motherPhotoUrl', motherPhotoFile)

    try {
      await updateMutation.mutateAsync({
        id: Number(studentId),
        data: form,
      })
      toast({
        title: 'Success!',
        description: 'Student updated successfully.',
      })
    } catch (err) {
      setError('Failed to update student')
      console.error('Error updating student:', err)
    }
  }

  useEffect(() => {
    if (updateMutation.error) {
      setError('Error updating student')
      console.error('Mutation error:', updateMutation.error)
    }
  }, [updateMutation.error])

  const grouped = feesMasters?.data?.reduce(
    (acc, fee) => {
      if (!acc[fee.feesGroupName]) acc[fee.feesGroupName] = []
      acc[fee.feesGroupName].push(fee)
      return acc
    },
    {} as Record<string, GetFeesMasterType[]>
  )

  if (studentLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    )
  }

  if (!student?.data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Student not found</p>
          <Button onClick={() => router.push('/students')}>
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Edit Student</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        {/* Student Information Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Student Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.firstName"
                name="studentDetails.firstName"
                type="text"
                value={formData.studentDetails.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.lastName"
                name="studentDetails.lastName"
                type="text"
                value={formData.studentDetails.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Admission Number */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.admissionNo">
                Admission Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.admissionNo"
                name="studentDetails.admissionNo"
                type="number"
                value={formData.studentDetails.admissionNo || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Roll Number */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.rollNo">Roll Number</Label>
              <Input
                id="studentDetails.rollNo"
                name="studentDetails.rollNo"
                type="number"
                value={formData.studentDetails.rollNo || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Class (optional) */}
            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <CustomCombobox
                items={
                  classes?.data?.map((cls) => ({
                    id: cls?.classData?.classId?.toString() || '0',
                    name: cls.classData?.className || 'Unnamed class',
                  })) || []
                }
                value={
                  formData.studentDetails.classId
                    ? {
                        id: formData.studentDetails.classId.toString(),
                        name:
                          classes?.data?.find(
                            (c) =>
                              c.classData?.classId ===
                              formData.studentDetails.classId
                          )?.classData?.className || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('classId', value ? String(value.id) : '0')
                }
                placeholder="Select class (optional)"
              />
            </div>
            {/* Division (required) */}
            <div className="space-y-2">
              <Label htmlFor="divisionId">
                Division <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  (divisions?.data as any[])?.map((div: any) => ({
                    id: div?.divisionId?.toString() || '0',
                    name: div.divisionName || 'Unnamed division',
                  })) || []
                }
                value={
                  formData.studentDetails.divisionId
                    ? {
                        id: formData.studentDetails.divisionId.toString(),
                        name:
                          (divisions?.data as any[])?.find(
                            (d: any) =>
                              d.divisionId ===
                              formData.studentDetails.divisionId
                          )?.divisionName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'divisionId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select division"
              />
            </div>
            {/* Section (independent of class) */}
            <div className="space-y-2">
              <Label htmlFor="sectionId">Section</Label>
              <CustomCombobox
                items={
                  sections?.data?.map((section) => ({
                    id: section?.sectionId?.toString() || '0',
                    name: section.sectionName || 'Unnamed section',
                  })) || []
                }
                value={
                  formData.studentDetails.sectionId
                    ? {
                        id: formData.studentDetails.sectionId.toString(),
                        name:
                          sections?.data?.find(
                            (s) =>
                              s.sectionId === formData.studentDetails.sectionId
                          )?.sectionName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'sectionId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select section"
              />
            </div>
            {/* Session */}
            <div className="space-y-2">
              <Label htmlFor="sessionId">Session</Label>
              <CustomCombobox
                items={
                  sessions?.data?.map((session) => ({
                    id: session?.sessionId?.toString() || '0',
                    name: session.sessionName || 'Unnamed session',
                  })) || []
                }
                value={
                  formData.studentDetails.sessionId
                    ? {
                        id: formData.studentDetails.sessionId.toString(),
                        name:
                          sessions?.data?.find(
                            (s) =>
                              s.sessionId === formData.studentDetails.sessionId
                          )?.sessionName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'sessionId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select session"
              />
            </div>
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                key={`gender-${formData.studentDetails.gender}`}
                value={formData.studentDetails.gender}
                onValueChange={(value) => handleSelectChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.dateOfBirth">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.dateOfBirth"
                name="studentDetails.dateOfBirth"
                type="date"
                value={formData.studentDetails.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Admission Date */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.admissionDate">
                Admission Date
              </Label>
              <Input
                id="studentDetails.admissionDate"
                name="studentDetails.admissionDate"
                type="date"
                value={formData.studentDetails.admissionDate}
                onChange={handleInputChange}
              />
            </div>
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.phoneNumber">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.phoneNumber"
                name="studentDetails.phoneNumber"
                type="tel"
                value={formData.studentDetails.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.email">Email</Label>
              <Input
                id="studentDetails.email"
                name="studentDetails.email"
                type="email"
                value={formData.studentDetails.email}
                onChange={handleInputChange}
              />
            </div>
            {/* Religion */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.religion">Religion</Label>
              <Input
                id="studentDetails.religion"
                name="studentDetails.religion"
                type="text"
                value={formData.studentDetails.religion || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Blood Group */}
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                key={`bloodGroup-${formData.studentDetails.bloodGroup}`}
                value={formData.studentDetails.bloodGroup || ''}
                onValueChange={(value) =>
                  handleSelectChange('bloodGroup', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.height">Height (cm)</Label>
              <Input
                id="studentDetails.height"
                name="studentDetails.height"
                type="number"
                step="0.1"
                value={formData.studentDetails.height || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.weight">Weight (kg)</Label>
              <Input
                id="studentDetails.weight"
                name="studentDetails.weight"
                type="number"
                step="0.1"
                value={formData.studentDetails.weight || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.address">Address</Label>
              <Input
                id="studentDetails.address"
                name="studentDetails.address"
                type="text"
                value={formData.studentDetails.address || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Student Photo */}
            <div className="space-y-2">
              <Label htmlFor="studentPhoto" className="text-sm">
                Student Photo{' '}
                {formData.studentDetails.photoUrl &&
                  '(Current photo will be replaced if new file selected)'}
              </Label>
              <Input
                id="studentPhoto"
                type="file"
                accept="image/*"
                onChange={handleStudentPhotoChange}
                className="text-sm"
              />
              {studentPhotoFile && (
                <p className="text-xs text-green-600">
                  ✓ New photo selected: {studentPhotoFile.name}
                </p>
              )}
              {!studentPhotoFile && formData.studentDetails.photoUrl && (
                <p className="text-xs text-blue-600">
                  ℹ Current photo on file
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Father Information Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Father Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentDetails.fatherName">
                Father Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.fatherName"
                name="studentDetails.fatherName"
                type="text"
                value={formData.studentDetails.fatherName || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.fatherPhone">
                Father Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.fatherPhone"
                name="studentDetails.fatherPhone"
                type="tel"
                value={formData.studentDetails.fatherPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.fatherEmail">Father Email</Label>
              <Input
                id="studentDetails.fatherEmail"
                name="studentDetails.fatherEmail"
                type="email"
                value={formData.studentDetails.fatherEmail}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.fatherOccupation">
                Father Occupation
              </Label>
              <Input
                id="studentDetails.fatherOccupation"
                name="studentDetails.fatherOccupation"
                type="text"
                value={formData.studentDetails.fatherOccupation || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherPhoto" className="text-sm">
                Father Photo{' '}
                {formData.studentDetails.fatherPhotoUrl &&
                  '(Current photo will be replaced if new file selected)'}
              </Label>
              <Input
                id="fatherPhoto"
                type="file"
                accept="image/*"
                onChange={handleFatherPhotoChange}
                className="text-sm"
              />
              {fatherPhotoFile && (
                <p className="text-xs text-green-600">
                  ✓ New photo selected: {fatherPhotoFile.name}
                </p>
              )}
              {!fatherPhotoFile && formData.studentDetails.fatherPhotoUrl && (
                <p className="text-xs text-blue-600">
                  ℹ Current photo on file
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mother Information Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Mother Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherName">
                Mother Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.motherName"
                name="studentDetails.motherName"
                type="text"
                value={formData.studentDetails.motherName || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherPhone">Mother Phone</Label>
              <Input
                id="studentDetails.motherPhone"
                name="studentDetails.motherPhone"
                type="tel"
                value={formData.studentDetails.motherPhone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherEmail">Mother Email</Label>
              <Input
                id="studentDetails.motherEmail"
                name="studentDetails.motherEmail"
                type="email"
                value={formData.studentDetails.motherEmail}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherOccupation">
                Mother Occupation
              </Label>
              <Input
                id="studentDetails.motherOccupation"
                name="studentDetails.motherOccupation"
                type="text"
                value={formData.studentDetails.motherOccupation || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherPhoto" className="text-sm">
                Mother Photo{' '}
                {formData.studentDetails.motherPhotoUrl &&
                  '(Current photo will be replaced if new file selected)'}
              </Label>
              <Input
                id="motherPhoto"
                type="file"
                accept="image/*"
                onChange={handleMotherPhotoChange}
                className="text-sm"
              />
              {motherPhotoFile && (
                <p className="text-xs text-green-600">
                  ✓ New photo selected: {motherPhotoFile.name}
                </p>
              )}
              {!motherPhotoFile && formData.studentDetails.motherPhotoUrl && (
                <p className="text-xs text-blue-600">
                  ℹ Current photo on file
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Student Fees Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Student Fees</h3>
          <Accordion type="multiple" className="w-full">
            {Object.entries(grouped ?? {}).map(([groupName, groupFees]) => {
              const groupFeeIds = groupFees.map((f) => f.feesMasterId || 0)
              const isGroupSelected = groupFeeIds.every((id) =>
                selectedFeesMasters.includes(id)
              )
              return (
                <AccordionItem key={groupName} value={groupName}>
                  <div className="flex items-center gap-2 px-2">
                    <Input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={isGroupSelected}
                      onChange={() => {
                        if (isGroupSelected) {
                          groupFeeIds.forEach((id) => toggleFeesMaster(id))
                        } else {
                          groupFeeIds.forEach((id) => {
                            if (!selectedFeesMasters.includes(id))
                              toggleFeesMaster(id)
                          })
                        }
                      }}
                    />
                    <AccordionTrigger className="flex-1 text-sm font-medium">
                      {groupName}
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="border rounded-md overflow-hidden bg-white">
                      <Table>
                        <TableHeader>
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
                                {formatNumber(fee.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset Fields
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Updating...' : 'Update Student'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditStudent
