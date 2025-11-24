import { tokenAtom, useInitializeUser } from '@/utils/user'
import { useAtom } from 'jotai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from './use-toast'
import { unique } from 'next/dist/build/utils'
import { createClass, deleteClass, editClass, getAllClasses, getAllSections } from '@/utils/api'
import { CreateClassType, GetClassType } from '@/utils/type'

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