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
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useAddStudent,
  useGetClasses,
  useGetFeesMasters,
  useGetSections,
} from '@/hooks/use-api'
import type { CreateStudentWithFeesType } from '@/utils/type'

const CreateStudent = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)
  const { data: classes } = useGetClasses()
  const { data: sections } = useGetSections()
  const { data: feesMasters } = useGetFeesMasters()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedFeesMasters, setSelectedFeesMasters] = useState<number[]>([])
  const [formData, setFormData] = useState<CreateStudentWithFeesType>({
    studentDetails: {
      admissionNo: 0,
      rollNo: 0,
      classId: null,
      sectionId: null,
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement
    const nameParts = name.split('.')

    if (type === 'file' && files && files.length > 0) {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          studentDetails: {
            ...prev.studentDetails,
            [nameParts[1]]: file,
          },
        }))
      }
      reader.readAsDataURL(file)
    } else if (type === 'number') {
      setFormData((prev) => {
        if (nameParts.length === 2) {
          return {
            ...prev,
            [nameParts[0]]: {
              ...prev[nameParts[0] as keyof CreateStudentWithFeesType],
              [nameParts[1]]: value ? Number(value) : 0,
            },
          }
        }
        return prev
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        studentDetails: {
          ...prev.studentDetails,
          [nameParts[1]]: value,
        },
      }))
    }
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
    setSelectedFeesMasters((prev) => {
      if (prev.includes(feesMasterId)) {
        return prev.filter((id) => id !== feesMasterId)
      } else {
        return [...prev, feesMasterId]
      }
    })
  }

  const resetForm = () => {
    setFormData({
      studentDetails: {
        admissionNo: 0,
        rollNo: 0,
        classId: null,
        sectionId: null,
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
    setSelectedFeesMasters([])
    setIsPopupOpen(false)
    setError(null)
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const addMutation = useAddStudent({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { studentDetails } = formData
    if (!studentDetails.firstName.trim())
      return setError('Please enter first name')
    if (!studentDetails.lastName.trim())
      return setError('Please enter last name')
    // ...other validations

    const studentFees = selectedFeesMasters.map((feesMasterId) => ({
      feesMasterId,
    }))

    // Create FormData
    const payload = new FormData()
    payload.append(
        'studentDetails',
        JSON.stringify({
            ...studentDetails,
        // remove file objects from studentDetails for JSON part
        photoUrl: undefined,
        fatherPhotoUrl: undefined,
        motherPhotoUrl: undefined,
    })
)
payload.append('studentFees', JSON.stringify(studentFees))
console.log("🚀 ~ handleSubmit ~ payload:", payload)

    // Append files separately
    if (studentDetails.photoUrl)
      payload.append('photo', studentDetails.photoUrl)
    if (studentDetails.fatherPhotoUrl)
      payload.append('fatherPhoto', studentDetails.fatherPhotoUrl)
    if (studentDetails.motherPhotoUrl)
      payload.append('motherPhoto', studentDetails.motherPhotoUrl)

    try {
      await addMutation.mutateAsync({
        studentDetails: {
          ...studentDetails,
          photoUrl: studentDetails.photoUrl ? studentDetails.photoUrl : undefined,
          fatherPhotoUrl: studentDetails.fatherPhotoUrl ? studentDetails.fatherPhotoUrl : undefined,
          motherPhotoUrl: studentDetails.motherPhotoUrl ? studentDetails.motherPhotoUrl : undefined,
        },
        studentFees,
      }) // your backend endpoint should handle multipart/form-data
    } catch (err) {
      setError('Failed to create student')
      console.error(err)
    }
  }

  useEffect(() => {
    if (addMutation.error) {
      setError('Error creating student')
    }
  }, [addMutation.error])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <DollarSign className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Create Student</h2>
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
                value={formData.studentDetails.admissionNo}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Roll Number */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.rollNo">
                Roll Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.rollNo"
                name="studentDetails.rollNo"
                type="number"
                value={formData.studentDetails.rollNo}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Class */}
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
                placeholder="Select class"
              />
            </div>
            {/* Section */}
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
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
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
              <Label htmlFor="studentDetails.dateOfBirth">Date of Birth</Label>
              <Input
                id="studentDetails.dateOfBirth"
                name="studentDetails.dateOfBirth"
                type="date"
                value={formData.studentDetails.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.email"
                name="studentDetails.email"
                type="email"
                value={formData.studentDetails.email}
                onChange={handleInputChange}
                required
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
            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="studentDetails.address">Address</Label>
              <Input
                id="studentDetails.address"
                name="studentDetails.address"
                type="text"
                value={formData.studentDetails.address || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.photoUrl" className="text-sm">
                Student Photo
              </Label>
              <Input
                id="studentDetails.photoUrl"
                name="studentDetails.photoUrl"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Father Information Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Father Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Father Name */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.fatherName">Father Name</Label>
              <Input
                id="studentDetails.fatherName"
                name="studentDetails.fatherName"
                type="text"
                value={formData.studentDetails.fatherName || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Father Email */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.fatherEmail">
                Father Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.fatherEmail"
                name="studentDetails.fatherEmail"
                type="email"
                value={formData.studentDetails.fatherEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Father Phone */}
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
            {/* Father Occupation */}
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
              <Label
                htmlFor="studentDetails.fatherPhotoUrl"
                className="text-sm"
              >
                Father Photo
              </Label>
              <Input
                id="studentDetails.fatherPhotoUrl"
                name="studentDetails.fatherPhotoUrl"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Mother Information Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Mother Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mother Name */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherName">Mother Name</Label>
              <Input
                id="studentDetails.motherName"
                name="studentDetails.motherName"
                type="text"
                value={formData.studentDetails.motherName || ''}
                onChange={handleInputChange}
              />
            </div>
            {/* Mother Email */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherEmail">
                Mother Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.motherEmail"
                name="studentDetails.motherEmail"
                type="email"
                value={formData.studentDetails.motherEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Mother Phone */}
            <div className="space-y-2">
              <Label htmlFor="studentDetails.motherPhone">
                Mother Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.motherPhone"
                name="studentDetails.motherPhone"
                type="tel"
                value={formData.studentDetails.motherPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Mother Occupation */}
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
              <Label
                htmlFor="studentDetails.motherPhotoUrl"
                className="text-sm"
              >
                Mother Photo
              </Label>
              <Input
                id="studentDetails.motherPhotoUrl"
                name="studentDetails.motherPhotoUrl"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Student Fees Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Student Fees</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
            {!feesMasters || feesMasters.data?.length === 0 ? (
              <p className="text-sm text-gray-500">No fees masters available</p>
            ) : (
              feesMasters.data?.map((fee) => (
                <div key={fee.feesMasterId} className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    id={`fee-${fee.feesMasterId}`}
                    checked={selectedFeesMasters.includes(
                      fee.feesMasterId || 0
                    )}
                    onChange={() => toggleFeesMaster(fee.feesMasterId || 0)}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor={`fee-${fee.feesMasterId}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {fee.feesGroupName} - {fee.feesTypeName} (₹{fee.amount})
                  </label>
                </div>
              ))
            )}
          </div>
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
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Creating...' : 'Create Student'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateStudent
