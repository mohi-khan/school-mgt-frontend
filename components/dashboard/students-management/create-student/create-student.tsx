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
import { DollarSign, Upload, Download } from 'lucide-react'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useAddStudent,
  useGetClasses,
  useGetClassesByClassId,
  useGetFeesMasters,
  useGetSessions,
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
import ExcelFileInput from '@/utils/excel-file-input'
import { Popup } from '@/utils/popup'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const CreateStudent = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)
  const { data: classes } = useGetClasses()
  const { data: sessions } = useGetSessions()
  const { data: feesMasters } = useGetFeesMasters()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false)
  const [selectedFeesMasters, setSelectedFeesMasters] = useState<number[]>([])

  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null)
  const [fatherPhotoFile, setFatherPhotoFile] = useState<File | null>(null)
  const [motherPhotoFile, setMotherPhotoFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<CreateStudentWithFeesType>({
    studentDetails: {
      admissionNo: 0,
      rollNo: 0,
      classId: null,
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

  const { data: sections } = useGetClassesByClassId(
    formData.studentDetails.classId || 0
  )

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
    if (file) {
      setStudentPhotoFile(file)
    }
  }

  const handleFatherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFatherPhotoFile(file)
    }
  }

  const handleMotherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMotherPhotoFile(file)
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
    setSelectedFeesMasters([])
    setStudentPhotoFile(null)
    setFatherPhotoFile(null)
    setMotherPhotoFile(null)
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
    console.log('=== FORM SUBMISSION START ===')
    console.log('📋 Student Details:', studentDetails)
    console.log('💰 Selected Fees Masters:', selectedFeesMasters)

    // Validations
    if (!studentDetails.firstName.trim())
      return setError('Please enter first name')
    if (!studentDetails.lastName.trim())
      return setError('Please enter last name')
    if (!studentDetails.admissionNo || studentDetails.admissionNo <= 0)
      return setError('Please enter valid admission number')
    if (!studentDetails.rollNo || studentDetails.rollNo <= 0)
      return setError('Please enter valid roll number')
    if (!studentDetails.email.trim()) return setError('Please enter email')
    if (!studentDetails.phoneNumber.trim())
      return setError('Please enter phone number')
    if (!studentDetails.fatherPhone.trim())
      return setError('Please enter father phone')
    if (!studentDetails.fatherEmail.trim())
      return setError('Please enter father email')
    if (!studentDetails.motherPhone.trim())
      return setError('Please enter mother phone')
    if (!studentDetails.motherEmail.trim())
      return setError('Please enter mother email')

    // Prepare student fees
    const studentFees = selectedFeesMasters.map((feesMasterId) => ({
      feesMasterId,
      studentId: null,
    }))
    console.log('💵 Prepared Student Fees:', studentFees)

    const form = new FormData()

    // Add student details as JSON (excluding photo URLs)
    const studentDetailsPayload = {
      ...studentDetails,
      photoUrl: null,
      fatherPhotoUrl: null,
      motherPhotoUrl: null,
    }
    console.log(
      '📦 Student Details Payload (without photos):',
      studentDetailsPayload
    )
    form.append('studentDetails', JSON.stringify(studentDetailsPayload))
    form.append('studentFees', JSON.stringify(studentFees))

    // Append photos only if they are selected
    if (studentPhotoFile) {
      form.append('photoUrl', studentPhotoFile)
      console.log(`✅ Appended photoUrl to FormData`)
    }
    if (fatherPhotoFile) {
      form.append('fatherPhotoUrl', fatherPhotoFile)
      console.log(`✅ Appended fatherPhotoUrl to FormData`)
    }
    if (motherPhotoFile) {
      form.append('motherPhotoUrl', motherPhotoFile)
      console.log(`✅ Appended motherPhotoUrl to FormData`)
    }

    console.log('📤 FormData contents:')
    for (const pair of form.entries()) {
      if (pair[1] instanceof File) {
        console.log(
          `  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`
        )
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`)
      }
    }
    console.log('=== FORM SUBMISSION END ===')

    try {
      await addMutation.mutateAsync(form as any)
      console.log('✅ Student created successfully!')
      toast({
        title: 'Success!',
        description: 'Student is added successfully.',
      })
    } catch (err) {
      setError('Failed to create student')
      console.error('❌ Error creating student:', err)
    }
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        AdmissionNo: '',
        RollNo: '',
        ClassId: '',
        SectionId: '',
        SessionId: '',
        FirstName: '',
        LastName: '',
        Gender: 'male',
        DateOfBirth: '',
        PhoneNumber: '',
        Email: '',
        AdmissionDate: '',
        Religion: '',
        BloodGroup: '',
        Height: '',
        Weight: '',
        Address: '',
        FatherName: '',
        FatherPhone: '',
        FatherEmail: '',
        FatherOccupation: '',
        MotherName: '',
        MotherPhone: '',
        MotherEmail: '',
        MotherOccupation: '',
        FeesMasterIds: '',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Template')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, 'create-students-template.xlsx')
  }

  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  const handleExcelSubmit = async (data: any[]) => {
    try {
      // Process each row and create student records
      const studentsToCreate = data.map((row) => {
        // Parse FeesMasterIds from comma-separated string
        const feesMasterIds = row['FeesMasterIds']
          ? String(row['FeesMasterIds'])
              .split(',')
              .map((id: string) => Number(id.trim()))
              .filter((id: number) => !isNaN(id))
          : []

        return {
          studentDetails: {
            admissionNo: Number(row['AdmissionNo']) || 0,
            rollNo: Number(row['RollNo']) || 0,
            classId: row['ClassId'] ? Number(row['ClassId']) : null,
            sectionId: row['SectionId'] ? Number(row['SectionId']) : null,
            sessionId: row['SessionId'] ? Number(row['SessionId']) : null,
            firstName: row['FirstName'] || '',
            lastName: row['LastName'] || '',
            gender: row['Gender'] || 'male',
            dateOfBirth: row['DateOfBirth'] || '',
            religion: row['Religion'] || '',
            bloodGroup: row['BloodGroup'] || null,
            height: row['Height'] ? Number(row['Height']) : null,
            weight: row['Weight'] ? Number(row['Weight']) : null,
            address: row['Address'] || '',
            phoneNumber: row['PhoneNumber'] || '',
            email: row['Email'] || '',
            admissionDate:
              row['AdmissionDate'] || new Date().toISOString().split('T')[0],
            photoUrl: null,
            isActive: true,
            fatherName: row['FatherName'] || '',
            fatherPhone: row['FatherPhone'] || '',
            fatherEmail: row['FatherEmail'] || '',
            fatherOccupation: row['FatherOccupation'] || '',
            fatherPhotoUrl: null,
            motherName: row['MotherName'] || '',
            motherPhone: row['MotherPhone'] || '',
            motherEmail: row['MotherEmail'] || '',
            motherOccupation: row['MotherOccupation'] || '',
            motherPhotoUrl: null,
          },
          studentFees: feesMasterIds.map((feesMasterId: number) => ({
            feesMasterId,
            studentId: null,
          })),
        }
      })

      console.log('Students to create:', studentsToCreate)

      // Submit all students
      for (const student of studentsToCreate) {
        const form = new FormData()
        const studentDetailsPayload = {
          ...student.studentDetails,
          photoUrl: null,
          fatherPhotoUrl: null,
          motherPhotoUrl: null,
        }
        form.append('studentDetails', JSON.stringify(studentDetailsPayload))
        form.append('studentFees', JSON.stringify(student.studentFees))

        await addMutation.mutateAsync(form as any)
      }

      setIsImportPopupOpen(false)
      toast({
        title: 'Success!',
        description: `${studentsToCreate.length} students added successfully.`,
      })
      resetForm()
    } catch (error) {
      console.error('Error importing students:', error)
      toast({
        title: 'Error',
        description:
          'Failed to import students. Please check the data and try again.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (addMutation.error) {
      setError('Error creating student')
      console.error('❌ Mutation error:', addMutation.error)
    }
  }, [addMutation.error])

  const grouped = feesMasters?.data?.reduce(
    (acc, fee) => {
      if (!acc[fee.feesGroupName]) acc[fee.feesGroupName] = []
      acc[fee.feesGroupName].push(fee)
      return acc
    },
    {} as Record<string, GetFeesMasterType[]>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Create Student</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={handleDownloadTemplate}
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setIsImportPopupOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        {/* Student Information Section */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Student Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="studentDetails.rollNo">
                Roll Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.rollNo"
                name="studentDetails.rollNo"
                type="number"
                value={formData.studentDetails.rollNo || ''}
                onChange={handleInputChange}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="studentPhoto" className="text-sm">
                Student Photo
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
                  ✓ Photo selected: {studentPhotoFile.name}
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
              <Label htmlFor="studentDetails.fatherName">Father Name</Label>
              <Input
                id="studentDetails.fatherName"
                name="studentDetails.fatherName"
                type="text"
                value={formData.studentDetails.fatherName || ''}
                onChange={handleInputChange}
              />
            </div>
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
                Father Photo
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
                  ✓ Photo selected: {fatherPhotoFile.name}
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
              <Label htmlFor="studentDetails.motherName">Mother Name</Label>
              <Input
                id="studentDetails.motherName"
                name="studentDetails.motherName"
                type="text"
                value={formData.studentDetails.motherName || ''}
                onChange={handleInputChange}
              />
            </div>
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
                Mother Photo
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
                  ✓ Photo selected: {motherPhotoFile.name}
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
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Creating...' : 'Create Student'}
          </Button>
        </div>
      </form>

      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        title="Import Students from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-amber-50 rounded-md">
            <h3 className="font-semibold mb-2">Excel Format Requirements:</h3>
            <p className="text-sm text-gray-700 mb-2">
              Your Excel file should have the following columns:
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>
                <strong>AdmissionNo</strong> - Numeric admission number
                (required)
              </li>
              <li>
                <strong>RollNo</strong> - Numeric roll number (required)
              </li>
              <li>
                <strong>FirstName</strong> - Student first name (required)
              </li>
              <li>
                <strong>LastName</strong> - Student last name (required)
              </li>
              <li>
                <strong>Gender</strong> - male or female (required)
              </li>
              <li>
                <strong>DateOfBirth</strong> - Date in YYYY-MM-DD format
              </li>
              <li>
                <strong>Email</strong> - Email address (required)
              </li>
              <li>
                <strong>PhoneNumber</strong> - Phone number (required)
              </li>
              <li>
                <strong>ClassId</strong> - Class ID (optional)
              </li>
              <li>
                <strong>SectionId</strong> - Section ID (optional)
              </li>
              <li>
                <strong>SessionId</strong> - Session ID (optional)
              </li>
              <li>
                <strong>Religion</strong> - Religion (optional)
              </li>
              <li>
                <strong>BloodGroup</strong> - Blood group (optional)
              </li>
              <li>
                <strong>Height</strong> - Height in cm (optional)
              </li>
              <li>
                <strong>Weight</strong> - Weight in kg (optional)
              </li>
              <li>
                <strong>Address</strong> - Address (optional)
              </li>
              <li>
                <strong>FatherName</strong> - Father&apos;s name (optional)
              </li>
              <li>
                <strong>FatherPhone</strong> - Father&apos;s phone (required)
              </li>
              <li>
                <strong>FatherEmail</strong> - Father&apos;s email (required)
              </li>
              <li>
                <strong>FatherOccupation</strong> - Father&apos;s occupation
                (optional)
              </li>
              <li>
                <strong>MotherName</strong> - Mother&apos;s name (optional)
              </li>
              <li>
                <strong>MotherPhone</strong> - Mother&apos;s phone (required)
              </li>
              <li>
                <strong>MotherEmail</strong> - Mother&apos;s email (required)
              </li>
              <li>
                <strong>MotherOccupation</strong> - Mother&apos;s occupation
                (optional)
              </li>
              <li>
                <strong>FeesMasterIds</strong> - Comma-separated fee IDs (e.g.,
                &quot;1,2,3&quot;)
              </li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              <strong>Tip:</strong> Download the template first to see the
              correct format!
            </p>
          </div>
          <ExcelFileInput
            onDataParsed={handleExcelDataParsed}
            onSubmit={handleExcelSubmit}
            submitButtonText="Import Students"
            dateColumns={['DateOfBirth', 'AdmissionDate']}
          />
        </div>
      </Popup>
    </div>
  )
}

export default CreateStudent
