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
import { useQueryClient } from '@tanstack/react-query'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useAddStudent,
  useGetClasses,
  useGetSectionsByClassId,
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
import { saveAs } from 'file-saver'
import { getAllSectionsByClassId } from '@/utils/api'

// ── helper ────────────────────────────────────────────────────────────────────
function columnIndexToLetter(col: number): string {
  let letter = ''
  while (col > 0) {
    const remainder = (col - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    col = Math.floor((col - 1) / 26)
  }
  return letter
}

// ── Column definitions with required flag ─────────────────────────────────────
const STATIC_COLUMNS = [
  { header: 'First Name', key: 'firstName', width: 18, required: true }, // A  1
  { header: 'Last Name', key: 'lastName', width: 18, required: true }, // B  2
  { header: 'Admission No', key: 'admissionNo', width: 14, required: true }, // C  3
  { header: 'Roll No', key: 'rollNo', width: 10, required: false }, // D  4
  { header: 'Class', key: 'classId', width: 30, required: true }, // E  5
  { header: 'Section', key: 'sectionId', width: 30, required: true }, // F  6
  { header: 'Session', key: 'sessionId', width: 30, required: true }, // G  7
  { header: 'Gender', key: 'gender', width: 10, required: true }, // H  8
  { header: 'Date of Birth', key: 'dateOfBirth', width: 14, required: true }, // I  9
  { header: 'Admission Date', key: 'admissionDate', width: 14, required: true }, // J  10
  { header: 'Phone Number', key: 'phoneNumber', width: 16, required: true }, // K  11
  { header: 'Email', key: 'email', width: 24, required: false }, // L  12
  { header: 'Religion', key: 'religion', width: 14, required: true }, // M  13
  { header: 'Blood Group', key: 'bloodGroup', width: 12, required: false }, // N  14
  { header: 'Height (cm)', key: 'height', width: 12, required: false }, // O  15
  { header: 'Weight (kg)', key: 'weight', width: 12, required: false }, // P  16
  { header: 'Address', key: 'address', width: 28, required: false }, // Q  17
  { header: 'Father Name', key: 'fatherName', width: 18, required: true }, // R  18
  { header: 'Father Phone', key: 'fatherPhone', width: 16, required: true }, // S  19
  { header: 'Father Email', key: 'fatherEmail', width: 24, required: false }, // T  20
  {
    header: 'Father Occupation',
    key: 'fatherOccupation',
    width: 20,
    required: false,
  }, // U  21
  { header: 'Mother Name', key: 'motherName', width: 18, required: true }, // V  22
  { header: 'Mother Phone', key: 'motherPhone', width: 16, required: false }, // W  23
  { header: 'Mother Email', key: 'motherEmail', width: 24, required: false }, // X  24
  {
    header: 'Mother Occupation',
    key: 'motherOccupation',
    width: 20,
    required: false,
  }, // Y  25
]
// Fees master columns are appended dynamically starting at col 26 (Z)

const CreateStudent = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

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

  const { data: sections } = useGetSectionsByClassId(
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
        studentDetails: { ...prev.studentDetails, [name]: value || null },
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

    if (!studentDetails.firstName.trim())
      return setError('Please enter first name')
    if (!studentDetails.lastName.trim())
      return setError('Please enter last name')
    if (!studentDetails.admissionNo || studentDetails.admissionNo <= 0)
      return setError('Please enter valid admission number')
    if (!studentDetails.phoneNumber.trim())
      return setError('Please enter phone number')
    if (!studentDetails.fatherPhone.trim())
      return setError('Please enter father phone')

    const studentFees = selectedFeesMasters.map((feesMasterId) => ({
      feesMasterId,
      studentId: null,
    }))

    const form = new FormData()
    const studentDetailsPayload = {
      ...studentDetails,
      photoUrl: null,
      fatherPhotoUrl: null,
      motherPhotoUrl: null,
    }
    form.append('studentDetails', JSON.stringify(studentDetailsPayload))
    form.append('studentFees', JSON.stringify(studentFees))

    if (studentPhotoFile) form.append('photoUrl', studentPhotoFile)
    if (fatherPhotoFile) form.append('fatherPhotoUrl', fatherPhotoFile)
    if (motherPhotoFile) form.append('motherPhotoUrl', motherPhotoFile)

    try {
      await addMutation.mutateAsync(form as any)
      toast({
        title: 'Success!',
        description: 'Student is added successfully.',
      })
    } catch (err) {
      setError('Failed to create student')
      console.error('Error creating student:', err)
    }
  }

  // ── Download Template ──────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()

    // ── 1. Build class entries, fetching sections per class ──────────────────
    type ClassEntry = {
      label: string
      safeName: string
      id: number
      secLabels: string[]
    }

    const classEntries: ClassEntry[] = []

    for (const c of classes?.data ?? []) {
      const id = c.classData?.classId ?? 0
      const name = c.classData?.className ?? 'Unnamed'
      const label = `${name} | ${id}`
      const safeName =
        'CLS_' +
        name
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .slice(0, 200) +
        '_' +
        id

      let secLabels: string[] = []

      if (id && token) {
        try {
          const result = await queryClient.fetchQuery({
            queryKey: ['sections', id],
            queryFn: () => getAllSectionsByClassId(token, id),
            staleTime: 5 * 60 * 1000,
          })
          const sectionList: any[] = Array.isArray(result)
            ? result
            : (result?.data ?? [])

          secLabels = sectionList.map(
            (sec: any) => `${sec.sectionName} | ${sec.sectionId} | ${id}`
          )
        } catch (e) {
          console.warn(`Could not fetch sections for class ${id}:`, e)
        }
      }

      classEntries.push({ label, safeName, id, secLabels })
    }

    // ── 2. Session / gender / blood-group lists ──────────────────────────────
    const sessionLabels: string[] = (sessions?.data ?? []).map(
      (s) => `${s.sessionName ?? 'Unnamed'} | ${s.sessionId}`
    )
    const genderLabels = ['male', 'female']
    const bloodGroupLabels = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']

    // ── 3. Fees masters list ─────────────────────────────────────────────────
    // Each fee master becomes its own column in the sheet.
    // Header format: "Fee Type Name | Group | YYYY (feesMasterId)"
    // e.g.  "January Fees | Monthly | 2024 (42)"
    const allFees: GetFeesMasterType[] = feesMasters?.data ?? []

    // ── 4. Hidden Lookup sheet ───────────────────────────────────────────────
    const lookupSheet = workbook.addWorksheet('Lookup')
    lookupSheet.state = 'veryHidden'

    // Col A: class labels → ClassList
    classEntries.forEach(({ label }, idx) => {
      lookupSheet.getCell(`A${idx + 1}`).value = label
    })
    if (classEntries.length > 0) {
      workbook.definedNames.add(
        `Lookup!$A$1:$A$${classEntries.length}`,
        'ClassList'
      )
    }

    // Col B: session labels → SessionList
    sessionLabels.forEach((label, idx) => {
      lookupSheet.getCell(`B${idx + 1}`).value = label
    })
    if (sessionLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$B$1:$B$${sessionLabels.length}`,
        'SessionList'
      )
    }

    // Col C: genders → GenderList
    genderLabels.forEach((g, idx) => {
      lookupSheet.getCell(`C${idx + 1}`).value = g
    })
    workbook.definedNames.add(`Lookup!$C$1:$C$2`, 'GenderList')

    // Col D: blood groups → BloodGroupList
    bloodGroupLabels.forEach((bg, idx) => {
      lookupSheet.getCell(`D${idx + 1}`).value = bg
    })
    workbook.definedNames.add(`Lookup!$D$1:$D$8`, 'BloodGroupList')

    // Col E: class safeNames (VLOOKUP target: A→E = safeName)
    classEntries.forEach(({ safeName }, idx) => {
      lookupSheet.getCell(`E${idx + 1}`).value = safeName
    })

    // Col F+: per-class section named ranges
    let dynCol = 6 // F
    for (const cls of classEntries) {
      if (cls.secLabels.length > 0) {
        const colLetter = columnIndexToLetter(dynCol)
        cls.secLabels.forEach((label, idx) => {
          lookupSheet.getCell(`${colLetter}${idx + 1}`).value = label
        })
        workbook.definedNames.add(
          `Lookup!$${colLetter}$1:$${colLetter}$${cls.secLabels.length}`,
          `${cls.safeName}_SEC`
        )
      }
      dynCol++
    }

    // ── 5. Main "Create Students" sheet ─────────────────────────────────────
    const sheet = workbook.addWorksheet('Create Students')

    // Static columns
    sheet.columns = STATIC_COLUMNS.map(({ header, key, width }) => ({
      header,
      key,
      width,
    }))

    // Dynamic fee-master columns (one per fee)
    // Header: "Fee Type | Group | YYYY (id)"
    allFees.forEach((fee, idx) => {
      const year = fee.dueDate ? new Date(fee.dueDate).getFullYear() : 'N/A'
      const colHeader = `${fee.feesTypeName} | ${fee.feesGroupName} | ${year} (${fee.feesMasterId})`
      const colIdx = STATIC_COLUMNS.length + 1 + idx // 1-based
      sheet.getColumn(colIdx).width = 40
      sheet.getColumn(colIdx).header = colHeader
    })

    // ── 6. Style header row with red * for required columns ──────────────────
    const headerRow = sheet.getRow(1)

    // Style static columns
    STATIC_COLUMNS.forEach(({ header, required }, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = required
        ? {
            richText: [
              {
                text: header,
                font: { bold: true, color: { argb: 'FF000000' } },
              },
              { text: ' *', font: { bold: true, color: { argb: 'FFDC2626' } } },
            ],
          }
        : {
            richText: [
              {
                text: header,
                font: { bold: true, color: { argb: 'FF000000' } },
              },
            ],
          }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFBBF24' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    // Style fee-master columns (not required, but distinct color to stand out)
    allFees.forEach((fee, idx) => {
      const year = fee.dueDate ? new Date(fee.dueDate).getFullYear() : 'N/A'
      const colHeader = `${fee.feesTypeName} | ${fee.feesGroupName} | ${year} (${fee.feesMasterId})`
      const colIdx = STATIC_COLUMNS.length + 1 + idx
      const cell = headerRow.getCell(colIdx)
      cell.value = {
        richText: [
          {
            text: colHeader,
            font: { bold: true, color: { argb: 'FF000000' } },
          },
        ],
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBFDBFE' }, // light blue to distinguish fee columns
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    headerRow.height = 36

    // ── 7. Add a sub-header hint row for fee columns ─────────────────────────
    const hintRow = sheet.getRow(2)
    // Leave static columns empty in hint row
    STATIC_COLUMNS.forEach((_, idx) => {
      const cell = hintRow.getCell(idx + 1)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF9C3' },
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    // Fee columns: show "Yes / leave blank"
    allFees.forEach((_, idx) => {
      const colIdx = STATIC_COLUMNS.length + 1 + idx
      const cell = hintRow.getCell(colIdx)
      cell.value = 'Yes = include  |  blank = skip'
      cell.font = { italic: true, size: 8, color: { argb: 'FF6B7280' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFF6FF' },
      }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }

      // Yes/No dropdown validation on data rows
      for (let row = 3; row <= 201; row++) {
        sheet.getCell(row, colIdx).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Yes,No"'],
          // showDropDown: false,
        }
      }
    })
    hintRow.height = 14

    // ── 8. Hidden _helpers sheet for VLOOKUP formulas ───────────────────────
    // Keeping helpers OFF the main sheet prevents xlsx parser from producing
    // "__EMPTY" ghost columns/rows when users import the filled template.
    const helpersSheet = workbook.addWorksheet('_helpers')
    helpersSheet.state = 'veryHidden'

    // ── 9. Per-row dropdowns and helper formulas (data starts row 3) ─────────
    for (let row = 3; row <= 201; row++) {
      // _helpers col A: VLOOKUP class label (main sheet col E) → safeName
      helpersSheet.getCell(`A${row}`).value = {
        formula: `IFERROR(VLOOKUP('Create Students'!E${row},Lookup!$A:$E,5,0),"")`,
      }

      // E: Class dropdown
      sheet.getCell(`E${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Class',
        error: 'Please select a class from the dropdown.',
        formulae: ['ClassList'],
      }

      // F: Section dropdown — INDIRECT(_helpers col A & "_SEC")
      sheet.getCell(`F${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Select Class First',
        error: 'Please select a Class in column E first.',
        formulae: [`INDIRECT(_helpers!$A$${row}&"_SEC")`],
      }

      // G: Session dropdown
      sheet.getCell(`G${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Session',
        error: 'Please select a session from the dropdown.',
        formulae: ['SessionList'],
      }

      // H: Gender dropdown
      sheet.getCell(`H${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Gender',
        error: 'Please select male or female.',
        formulae: ['GenderList'],
      }

      // N: Blood Group dropdown
      sheet.getCell(`N${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Blood Group',
        error: 'Please select a valid blood group.',
        formulae: ['BloodGroupList'],
      }
    }

    // ── 10. Freeze top 2 rows and col A so headers stay visible ─────────────
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'create-students-template.xlsx')
  }

  // ── Parse & submit Excel data ──────────────────────────────────────────────
  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  const handleExcelSubmit = async (data: any[]) => {
    try {
      const allFeesList: GetFeesMasterType[] = feesMasters?.data ?? []

      // Strip trailing " *" from a key — headers were written as richText with
      // " *" in red, but some xlsx parsers concatenate richText into plain text.
      const normalizeKey = (k: string) => k.trim().replace(/\s*\*$/, '')

      // Filter out: hint row, __EMPTY-only rows, and rows with no Admission No
      const validRows = data.filter((row) => {
        const keys = Object.keys(row).filter((k) => k !== '__EMPTY')
        if (keys.length === 0) return false

        // Skip the hint row (row 2) — all its fee-col values are "Yes = include..."
        const allHint = keys.every((k) =>
          String(row[k] ?? '')
            .trim()
            .startsWith('Yes = include')
        )
        if (allHint) return false

        // Must have a non-empty Admission No
        const admKey = keys.find((k) => normalizeKey(k) === 'Admission No')
        return admKey && String(row[admKey] ?? '').trim() !== ''
      })

      const studentsToCreate = validRows
        .filter((row) => {
          const keys = Object.keys(row).filter((k) => k !== '__EMPTY')
          const firstKey = keys.find((k) => normalizeKey(k) === 'First Name')
          const lastKey = keys.find((k) => normalizeKey(k) === 'Last Name')
          return (
            (firstKey && String(row[firstKey] ?? '').trim()) ||
            (lastKey && String(row[lastKey] ?? '').trim())
          )
        })
        .map((row) => {
          const keys = Object.keys(row).filter((k) => k !== '__EMPTY')

          // get() strips trailing " *" so "First Name *" matches "First Name"
          const get = (colHeader: string) => {
            const key = keys.find((k) => normalizeKey(k) === colHeader.trim())
            return key ? row[key] : undefined
          }

          // ── Parse Class label: "Class Name | classId" ─────────────────────
          const classLabel: string = String(get('Class') ?? '')
          const classParts = classLabel.split(' | ')
          const classId =
            classParts.length >= 2
              ? Number(classParts[classParts.length - 1])
              : null

          // ── Parse Section label: "Section Name | sectionId | classId" ─────
          const sectionLabel: string = String(get('Section') ?? '')
          const sectionParts = sectionLabel.split(' | ')
          const sectionId =
            sectionParts.length >= 3
              ? Number(sectionParts[sectionParts.length - 2])
              : null

          // ── Parse Session label: "Session Name | sessionId" ───────────────
          const sessionLabel: string = String(get('Session') ?? '')
          const sessionParts = sessionLabel.split(' | ')
          const sessionId =
            sessionParts.length >= 2
              ? Number(sessionParts[sessionParts.length - 1])
              : null

          // ── Collect selected fees from per-fee columns ────────────────────
          // Column header format: "Fee Type | Group | YYYY (feesMasterId)"
          const feesMasterIds: number[] = []

          for (const fee of allFeesList) {
            const year = fee.dueDate
              ? new Date(fee.dueDate).getFullYear()
              : 'N/A'
            const colHeader = `${fee.feesTypeName} | ${fee.feesGroupName} | ${year} (${fee.feesMasterId})`

            // normalizeKey strips trailing " *" so richText headers still match
            const matchedKey = keys.find(
              (k) => normalizeKey(k) === colHeader.trim()
            )

            if (matchedKey) {
              const cellValue = String(row[matchedKey] ?? '')
                .trim()
                .toLowerCase()
              if (['yes', 'y', '1', 'true'].includes(cellValue)) {
                feesMasterIds.push(fee.feesMasterId!)
              }
            }
          }

          // ── Normalize dates ───────────────────────────────────────────────
          const normalizeDate = (raw: any): string => {
            if (!raw) return ''
            const s = String(raw)
            if (s.includes('-')) return s
            const d = new Date(s)
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : s
          }

          return {
            studentDetails: {
              admissionNo: Number(get('Admission No')) || 0,
              rollNo: Number(get('Roll No')) || 0,
              classId: classId && !isNaN(classId) ? classId : null,
              sectionId: sectionId && !isNaN(sectionId) ? sectionId : null,
              sessionId: sessionId && !isNaN(sessionId) ? sessionId : null,
              firstName: String(get('First Name') ?? ''),
              lastName: String(get('Last Name') ?? ''),
              gender: String(get('Gender') ?? 'male'),
              dateOfBirth: normalizeDate(get('Date of Birth')),
              religion: String(get('Religion') ?? ''),
              bloodGroup: get('Blood Group')
                ? String(get('Blood Group'))
                : null,
              height: get('Height (cm)') ? Number(get('Height (cm)')) : null,
              weight: get('Weight (kg)') ? Number(get('Weight (kg)')) : null,
              address: String(get('Address') ?? ''),
              phoneNumber: String(get('Phone Number') ?? ''),
              email: String(get('Email') ?? ''),
              admissionDate:
                normalizeDate(get('Admission Date')) ||
                new Date().toISOString().split('T')[0],
              photoUrl: null,
              isActive: true,
              fatherName: String(get('Father Name') ?? ''),
              fatherPhone: String(get('Father Phone') ?? ''),
              fatherEmail: String(get('Father Email') ?? ''),
              fatherOccupation: String(get('Father Occupation') ?? ''),
              fatherPhotoUrl: null,
              motherName: String(get('Mother Name') ?? ''),
              motherPhone: String(get('Mother Phone') ?? ''),
              motherEmail: String(get('Mother Email') ?? ''),
              motherOccupation: String(get('Mother Occupation') ?? ''),
              motherPhotoUrl: null,
            },
            studentFees: feesMasterIds.map((feesMasterId) => ({
              feesMasterId,
              studentId: null,
            })),
          }
        })

      console.log('Students to create from Excel:', studentsToCreate)

      for (const student of studentsToCreate) {
        const form = new FormData()
        form.append('studentDetails', JSON.stringify(student.studentDetails))
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
      console.error('Mutation error:', addMutation.error)
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
              <Label htmlFor="studentDetails.rollNo">Roll Number</Label>
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
              <Label htmlFor="classId">
                Class <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="sectionId">
                Section <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="sessionId">
                Session <span className="text-red-500">*</span>
              </Label>
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
            <div className="space-y-2">
              <Label htmlFor="studentDetails.admissionDate">
                Admission Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentDetails.admissionDate"
                name="studentDetails.admissionDate"
                type="date"
                value={formData.studentDetails.admissionDate}
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
              <Label htmlFor="studentDetails.email">Email</Label>
              <Input
                id="studentDetails.email"
                name="studentDetails.email"
                type="email"
                value={formData.studentDetails.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDetails.religion">
                Religion <span className="text-red-500">*</span>
              </Label>
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

      {/* Bulk Import Popup */}
      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        title="Import Students from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-amber-50 rounded-md text-sm text-gray-700 space-y-1">
            <p className="font-semibold">How to use:</p>
            <p>
              1. Click <strong>Download Template</strong> to get the Excel file
              with dropdowns pre-filled from your data.
            </p>
            <p>
              2. Select <strong>Class</strong> first — the{' '}
              <strong>Section</strong> dropdown will filter automatically.
            </p>
            <p>
              3. For <strong>Fees</strong>, each fee has its own column (shown
              in blue). Type <strong>Yes</strong> (or select from dropdown) in
              any fee column to assign that fee to the student. Leave blank to
              skip.
            </p>
            <p>
              4. Fields marked with a red{' '}
              <span className="text-red-500 font-bold">*</span> in the template
              are required.
            </p>
            <p className="text-xs text-gray-500 pt-1">
              All foreign-key columns (Class, Section, Session) use
              human-readable labels; IDs are extracted automatically on import.
            </p>
          </div>
          <ExcelFileInput
            onDataParsed={handleExcelDataParsed}
            onSubmit={handleExcelSubmit}
            submitButtonText="Import Students"
            dateColumns={['Date of Birth', 'Admission Date']}
          />
        </div>
      </Popup>
    </div>
  )
}

export default CreateStudent
