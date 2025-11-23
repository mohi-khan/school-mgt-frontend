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

export const createClassSchema = z.object({
  classData: z.object({
    className: z.string(),
    classCode: z.string(),
    description: z.string().optional().nullable(),
    isActive: z.boolean(),
  }),
  sectionIds: z
    .array(z.number())
    .min(1, 'At least one section must be selected'),
})
export type CreateClassType = z.infer<typeof createClassSchema>
export type GetClassType = z.infer<typeof createClassSchema>
