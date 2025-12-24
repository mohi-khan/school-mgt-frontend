import { z } from 'zod'

export const SignInRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const RolePermissionSchema = z.object({
  roleId: z.number(),
  permissionId: z.number(),
  permission: PermissionSchema,
})

export const RoleSchema = z.object({
  roleId: z.number(),
  roleName: z.string(),
  rolePermissions: z.array(RolePermissionSchema),
})

export const UserSchema = z.object({
  userId: z.number(),
  username: z.string(),
  password: z.string(),
  active: z.boolean(),
  roleId: z.number(),
  isPasswordResetRequired: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: RoleSchema,
})

export const SignInResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
})
export type SignInRequest = z.infer<typeof SignInRequestSchema>
export type SignInResponse = z.infer<typeof SignInResponseSchema>

export const sectionsSchema = z.object({
  sectionId: z.number().int().optional(),
  sectionName: z.string().min(1),
  sectionCode: z.string().max(20).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
export type GetSectionsType = z.infer<typeof sectionsSchema>

export const bankAccountSchema = z.object({
  bankAccountId: z.number().int().optional(),
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountNumber: z.string().min(1, 'Account number is required').max(50),
  branch: z.string().max(100).optional().nullable(),
  accountName: z.string().min(1, 'Account name is required').max(100),
  balance: z.number().min(0, 'Balance must be at least 0'),
  createdBy: z.number().int(),
  createdAt: z.date().optional(),
  updatedBy: z.number().int().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
})
export type CreateBankAccountsType = z.infer<typeof bankAccountSchema>
export type GetBankAccountsType = z.infer<typeof bankAccountSchema> & {
  bankName: string
}

export const mfsSchema = z.object({
  mfsId: z.number().int().optional(),
  accountName: z.string().min(1).max(100),
  mfsNumber: z.string().max(15),
  mfsType: z.enum(['bkash', 'nagad', 'rocket']),
  balance: z.number(),
  createdBy: z.number().int(),
  createdAt: z.date().optional(),
  updatedBy: z.number().int().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
})
export type CreateMfssType = z.infer<typeof mfsSchema>
export type GetMfssType = z.infer<typeof mfsSchema>

export const classSchema = z.object({
  classData: z.object({
    classId: z.number().optional(),
    className: z.string(),
    classCode: z.string(),
    description: z.string().optional().nullable(),
    isActive: z.boolean(),
  }),
  sectionIds: z
    .array(z.number())
    .min(1, 'At least one section must be selected'),
})
export type CreateClassType = z.infer<typeof classSchema>
export type GetClassType = z.infer<typeof classSchema>

export const feesGroupSchema = z.object({
  feesGroupId: z.number().optional(),
  groupName: z.string().max(100),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
export type GetFeesGroupType = z.infer<typeof feesGroupSchema>
export type CreateFeesGroupType = z.infer<typeof feesGroupSchema>

export const feesTypeSchema = z.object({
  feesTypeId: z.number().optional(),
  typeName: z.string().max(100),
  feesCode: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
export type GetFeesTypeType = z.infer<typeof feesTypeSchema>
export type CreateFeesTypeType = z.infer<typeof feesTypeSchema>

export const feesMasterSchema = z.object({
  feesMasterId: z.number().optional(),
  feesGroupId: z.number().nullable().optional(),
  feesTypeId: z.number().nullable().optional(),
  dueDate: z.string(),
  amount: z.number(),
  fineType: z.enum(['none', 'percentage', 'fixed amount']),
  percentageFineAmount: z.number().optional().nullable(),
  fixedFineAmount: z.number().optional().nullable(),
  perDay: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
export type CreateFeesMasterType = z.infer<typeof feesMasterSchema>
export type GetFeesMasterType = z.infer<typeof feesMasterSchema> & {
  feesGroupName: string
  feesTypeName: string
}

export const sessionsSchema = z.object({
  sessionId: z.number().optional(),
  sessionName: z.string(),
})
export type GetSessionsType = z.infer<typeof sessionsSchema>

export const studentSchema = z.object({
  studentId: z.number().optional(),
  admissionNo: z.number().positive(),
  rollNo: z.number().positive(),
  classId: z.number().nullable().optional(),
  sectionId: z.number().nullable().optional(),
  sessionId: z.number().nullable().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string(),
  religion: z.string().max(50).nullable().optional(),
  bloodGroup: z
    .enum(['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'])
    .nullable()
    .optional(),
  height: z.number().positive().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  address: z.string().nullable().optional(),
  phoneNumber: z.string().min(7).max(15),
  email: z.string().email(),
  admissionDate: z.string(),
  photoUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  fatherName: z.string().max(100).nullable().optional(),
  fatherPhone: z.string().min(7).max(15),
  fatherEmail: z.string().email(),
  fatherOccupation: z.string().max(100).nullable().optional(),
  fatherPhotoUrl: z.string().nullable().optional(),
  motherName: z.string().max(100).nullable().optional(),
  motherPhone: z.string().min(7).max(15),
  motherEmail: z.string().email(),
  motherOccupation: z.string().max(100).nullable().optional(),
  motherPhotoUrl: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const studentFeesSchema = z.object({
  studentFeesId: z.number().optional(), // auto-increment
  studentId: z.number().positive().nullable(),
  feesMasterId: z.number().positive().nullable(),
})

export const studnentWithFeesSchema = z.object({
  studentDetails: studentSchema.extend({
    className: z.string().optional(),
    sectionName: z.string().optional(),
  }),
  studentFees: z.array(studentFeesSchema),
})
export type CreateStudentWithFeesType = z.infer<typeof studnentWithFeesSchema>
export type GetStudentWithFeesType = z.infer<typeof studnentWithFeesSchema>
export type GetStudentFeesType = z.infer<typeof studentFeesSchema> & {
  amount: number
  paidAmount: number
  remainingAmount: number
  status: 'Paid' | 'Unpaid' | 'Partial'
  studentName?: string
  photoUrl?: string
  classId?: number
  className?: string
  sectionName?: string
  sessionName?: string
  phoneNumber?: string
  gender?: string
  admissionNo?: string
  rollNo?: string
  feesMasterId?: number
  bankAccountId?: number
  feesTypeId?: number
  feesTypeName?: string
}

export const promoteStudentsSchema = z.object({
  students: z.array(
    z.object({
      studentId: z.number(),
      classId: z.number(),
      secitionId: z.number(),
      sessionId: z.number(),
      currentResult: z.enum(['Pass', 'Fail']),
      nextSession: z.enum(['Continue', 'Leave']),
    })
  ),
  feesMasterIds: z.array(z.number()),
})
export type StudentPromotionsType = z.infer<typeof promoteStudentsSchema>

export const promotionResponseSchema = z.object({
  promotedStudents: z.array(
    z.object({
      studentId: z.number(),
      studentName: z.string(),
      rollNo: z.number(),
    })
  ),

  notPromotedStudents: z.array(
    z.object({
      studentId: z.number(),
      studentName: z.string(),
      rollNo: z.number(),
      message: z.string(),
    })
  ),
})
export type PromotionResponseType = z.infer<typeof promotionResponseSchema>

export const collectFeesSchema = z.object({
  studentFeesId: z.number(),
  studentId: z.number(),
  method: z.enum(['cash', 'bank', 'bkash', 'nagad', 'rocket']),
  bankAccountId: z.number().nullable().optional(),
  mfsId: z.number().nullable().optional(),
  paidAmount: z.number(),
  paymentDate: z.string(),
  remarks: z.string(),
})
export type CollectFeesType = z.infer<typeof collectFeesSchema>

export const examGroupsSchema = z.object({
  examGroupsId: z.number().optional(), // auto-increment
  examGroupName: z.string().min(1, 'Exam group name is required'),
  description: z.string().nullable().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type GetExamGroupType = z.infer<typeof examGroupsSchema>
export type CreateExamGroupType = z.infer<typeof examGroupsSchema>

export const examSubjectsSchema = z.object({
  examSubjectId: z.number().optional(),
  subjectName: z.string(),
  subjectCode: z.string(),
  examDate: z.string(),
  startTime: z.string(),
  duration: z.number(),
  examMarks: z.number(),
  classId: z.number().nullable(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateExamSubjectsType = z.infer<typeof examSubjectsSchema>
export type GetExamSubjectsType = z.infer<typeof examSubjectsSchema> & {
  className: string
}

export const examsSchema = z.object({
  examId: z.number().optional(),
  examName: z.string(),
  examGroupsId: z.number().nullable(),
  sessionId: z.number().nullable(),
  classId: z.number().nullable(),
  examSubjectId: z.number().nullable(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateExamsType = z.infer<typeof examsSchema>
export type GetExamsType = z.infer<typeof examsSchema> & {
  examGroupName: string
  sessionName: string
  className: string
  subjectName: string
}

export const examResultsSchema = z.object({
  examResultId: z.number().optional(),
  sessionId: z.number().nullable(),
  examId: z.number().nullable(),
  studentId: z.number().nullable(),
  examSubjectId: z.number().nullable(),
  gainedMarks: z.number(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable(),
  updatedAt: z.date().optional(),
})
export type CreateExamResultsType = z.infer<typeof examResultsSchema>
export type GetExamResultsType = z.infer<typeof examResultsSchema> & {
  sessionName: string
  examName: string
  studentName: string
  examSubjectName: string
}

export const incomeHeadSchema = z.object({
  incomeHeadId: z.number().optional(),
  incomeHead: z.string(),
  description: z.string().nullable().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateIncomeHeadsType = z.infer<typeof incomeHeadSchema>
export type GetIncomeHeadsType = z.infer<typeof incomeHeadSchema>

export const incomeSchema = z.object({
  incomeId: z.number().optional(),
  incomeHeadId: z.number(),
  name: z.string(),
  invoiceNumber: z.number(),
  date: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(), // default now
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateIncomesType = z.infer<typeof incomeSchema>
export type GetIncomesType = z.infer<typeof incomeSchema> & {
  incomeHead: string
}

export const expenseHeadSchema = z.object({
  expenseHeadId: z.number().optional(),
  expenseHead: z.string(),
  description: z.string().nullable().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateExpenseHeadsType = z.infer<typeof expenseHeadSchema>
export type GetExpenseHeadsType = z.infer<typeof expenseHeadSchema>

export const expenseSchema = z.object({
  expenseId: z.number().optional(),
  expenseHeadId: z.number(),
  name: z.string(),
  invoiceNumber: z.number(),
  date: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(), // default now
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateExpensesType = z.infer<typeof expenseSchema>
export type GetExpensesType = z.infer<typeof expenseSchema> & {
  expenseHead: string
}

export const bankMfsCashSchema = z.object({
  id: z.number().optional(),
  fromBankAccountId: z.number().optional(),
  toBankAccountId: z.number().optional(),
  fromMfsId: z.number().nullable().optional(),
  toMfsId: z.number().nullable().optional(),
  amount: z.number(),
  date: z.string(),
  description: z.string().nullable().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateBankMfsCashType = z.infer<typeof bankMfsCashSchema>
export type GetBankMfsCashType = z.infer<typeof bankMfsCashSchema> & {
  // ===== From Bank (nullable) =====
  fromBankName: string | null
  fromBankAccountNumber: string | null
  fromBankBranch: string | null
  fromAccountName: string | null

  // ===== To Bank (nullable) =====
  toBankName: string | null
  toBankAccountNumber: string | null
  toBankBranch: string | null
  toAccountName: string | null

  // ===== From MFS (nullable) =====
  fromMfsAccountName: string | null
  fromMfsNumber: string | null
  fromMfsType: 'bkash' | 'nagad' | 'rocket' | null

  // ===== To MFS (nullable) =====
  toMfsAccountName: string | null
  toMfsNumber: string | null
  toMfsType: 'bkash' | 'nagad' | 'rocket' | null
}

export const paymentReportSchema = z.object({
  studentPaymentId: z.number().optional(),
  paymentDate: z.string(),
  studentName: z.string(),
  studentClass: z.string(),
  studentSection: z.string(),
  studentSession: z.string(),
  method: z.string(),
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  mfsName: z.string().nullable().optional(),
  mfsNumber: z.string().nullable().optional(),
  mfsType: z.string().nullable().optional(),
  paidAmount: z.number(),
})
export type GetPaymentReportType = z.infer<typeof paymentReportSchema>

export const bankPaymentReportSchema = z.object({
  studentPaymentId: z.number().optional(),
  paymentDate: z.string(),
  studentName: z.string(),
  studentClass: z.string(),
  studentSection: z.string(),
  studentSession: z.string(),
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  paidAmount: z.number(),
})
export type GetBankPaymentReportType = z.infer<typeof bankPaymentReportSchema>

export const mfsPaymentReportSchema = z.object({
  studentPaymentId: z.number().optional(),
  paymentDate: z.string(),
  studentName: z.string(),
  studentClass: z.string(),
  studentSection: z.string(),
  studentSession: z.string(),
  method: z.string(),
  mfsName: z.string().nullable().optional(),
  mfsNumber: z.string().nullable().optional(),
  mfsType: z.string().nullable().optional(),
  paidAmount: z.number(),
})
export type GetMfsPaymentReportType = z.infer<typeof mfsPaymentReportSchema>

export const cashPaymentReportSchema = z.object({
  studentPaymentId: z.number().optional(),
  paymentDate: z.string(),
  studentName: z.string(),
  studentClass: z.string(),
  studentSection: z.string(),
  studentSession: z.string(),
  method: z.string(),
  paidAmount: z.number(),
})
export type GetCashPaymentReportType = z.infer<typeof cashPaymentReportSchema>

export const transactionReportSchema = z.object({
  id: z.number().optional(),
  date: z.string(),
  particulars: z.string(),
  remarks: z.string(),
  deposit: z.number().optional(),
  withdraw: z.number().optional(),
  reference: z.number().optional(),
})
export type GetTransactionReportType = z.infer<typeof transactionReportSchema>

export const incomeReportSchema = z.object({
  incomeId: z.number().optional(),
  name: z.string().optional(),
  incomeHeadId: z.number().optional(),
  incomeHead: z.string().optional(),
  invoiceNumber: z.number().optional(),
  date: z.string().optional(),
  amount: z.number().optional(),
})
export type GetIncomeReportType = z.infer<typeof incomeReportSchema>

export const expenseReportSchema = z.object({
  expenseId: z.number().optional(),
  name: z.string().optional(),
  expenseHeadId: z.number().optional(),
  expenseHead: z.string().optional(),
  invoiceNumber: z.number().optional(),
  date: z.string().optional(),
  amount: z.number().optional(),
})
export type GetExpenseReportType = z.infer<typeof expenseReportSchema>

export const paymentSummarySchema = z.object({
  totalCash: z.number(),
  totalBank: z.number(),
  totalMfs: z.number(),
})
export type GetPaymentSummaryType = z.infer<typeof paymentSummarySchema>