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

export const studentSchema = z.object({
  studentId: z.number().optional(), // auto-increment
  admissionNo: z.number().positive(),
  rollNo: z.number().positive(),
  classId: z.number().nullable().optional(),
  sectionId: z.number().nullable().optional(),
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
  phoneNumber?: string
  gender?: string
  admissionNo?: string
  rollNo?: string
  feesMasterId?: number
  feesTypeId?: number
  feesTypeName?: string
}
