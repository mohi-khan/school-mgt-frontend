import { tokenAtom, useInitializeUser } from '@/utils/user'
import { useAtom } from 'jotai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from './use-toast'
import {
  createClass,
  createFeesGroup,
  createFeesMaster,
  createFeesType,
  createStudentWithFees,
  deleteClass,
  deleteFeesGroup,
  deleteFeesMaster,
  deleteFeesType,
  deleteStudent,
  editClass,
  editFeesGroup,
  editFeesMaster,
  editFeesType,
  editStudentWithFees,
  getAllClasses,
  getAllFeesGroups,
  getAllFeesMasters,
  getAllFeesTypes,
  getAllSections,
  getAllStudents,
  getStudentById,
} from '@/utils/api'
import {
  CreateClassType,
  CreateFeesGroupType,
  CreateFeesMasterType,
  CreateFeesTypeType,
  CreateStudentWithFeesType,
  GetClassType,
  GetFeesGroupType,
  GetFeesMasterType,
  GetFeesTypeType,
} from '@/utils/type'

//section
export const useGetSections = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['sections'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllSections(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

//class
export const useGetClasses = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['classes'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllClasses(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddClass = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateClassType) => {
      return createClass(data, token)
    },
    onSuccess: (data) => {
      console.log('classes added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['classes'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding classes:', error)
    },
  })

  return mutation
}

export const useUpdateClass = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetClassType }) => {
      return editClass(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'classes information edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['classes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing classes:', error)
    },
  })

  return mutation
}

export const useDeleteClass = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteClass(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'class is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['classes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//fees group
export const useGetFeesGroups = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['fees-groups'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllFeesGroups(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddFeesGroup = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateFeesGroupType) => {
      return createFeesGroup(data, token)
    },
    onSuccess: (data) => {
      console.log('fees groups added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['fees-groups'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding classes:', error)
    },
  })

  return mutation
}

export const useUpdateFeesGroup = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetFeesGroupType }) => {
      return editFeesGroup(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'fees group edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['fees-groups'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing fees group:', error)
    },
  })

  return mutation
}

export const useDeleteFeesGroup = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteFeesGroup(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'fees group is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['fees-groups'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//fees type
export const useGetFeesTypes = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['fees-types'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllFeesTypes(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddFeesType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateFeesTypeType) => {
      return createFeesType(data, token)
    },
    onSuccess: (data) => {
      console.log('fees types added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['fees-types'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding classes:', error)
    },
  })

  return mutation
}

export const useUpdateFeesType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetFeesTypeType }) => {
      return editFeesType(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'fees group edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['fees-types'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing fees group:', error)
    },
  })

  return mutation
}

export const useDeleteFeesType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteFeesType(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'fees group is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['fees-types'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//fees master
export const useGetFeesMasters = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['fees-masters'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllFeesMasters(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddFeesMaster = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateFeesMasterType) => {
      return createFeesMaster(data, token)
    },
    onSuccess: (data) => {
      console.log('fees masters added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['fees-masters'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding fees master:', error)
    },
  })

  return mutation
}

export const useUpdateFeesMaster = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateFeesMasterType }) => {
      return editFeesMaster(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'fees master edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['fees-masters'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing fees master:', error)
    },
  })

  return mutation
}

export const useDeleteFeesMaster = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteFeesMaster(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'fees master is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['fees-masters'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//students
export const useAddStudent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return createStudentWithFees(token, formData)
    },
    onSuccess: (data) => {
      console.log('students added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['students'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error adding students:', error)
    },
  })

  return mutation
}

export const useGetAllStudents = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['students'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllStudents(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useGetStudentById= (id: number) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['students', id],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getStudentById(token, id)
    },
    enabled: !!token && id > 0,
    select: (data) => data,
  })
}

export const useUpdateStudentWithFees = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateFeesMasterType }) => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as any)
        }
      })
      return editStudentWithFees(id, formData, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'student edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['students'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing student:', error)
    },
  })

  return mutation
}

export const useDeleteStudent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteStudent(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'student is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['students'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}