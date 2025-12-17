import { tokenAtom, useInitializeUser } from '@/utils/user'
import { useAtom } from 'jotai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from './use-toast'
import {
  collectFees,
  createBankAccount,
  createClass,
  createExam,
  createExamGroup,
  createExamResult,
  createExamSubject,
  createExpense,
  createExpenseHead,
  createFeesGroup,
  createFeesMaster,
  createFeesType,
  createIncome,
  createIncomeHead,
  createStudentWithFees,
  deleteBankAccount,
  deleteClass,
  deleteExam,
  deleteExamGroup,
  deleteExamResult,
  deleteExamSubject,
  deleteExpense,
  deleteExpenseHead,
  deleteFeesGroup,
  deleteFeesMaster,
  deleteFeesType,
  deleteIncome,
  deleteIncomeHead,
  deleteStudent,
  editBankAccount,
  editClass,
  editExam,
  editExamGroup,
  editExamResult,
  editExamSubject,
  editExpense,
  editExpenseHead,
  editFeesGroup,
  editFeesMaster,
  editFeesType,
  editIncome,
  editIncomeHead,
  editStudentWithFees,
  getAllBankAccounts,
  getAllClasses,
  getAllExamGroups,
  getAllExamResults,
  getAllExams,
  getAllExamSubjects,
  getAllExpenseHeads,
  getAllExpenses,
  getAllFeesGroups,
  getAllFeesMasters,
  getAllFeesTypes,
  getAllIncomeHeads,
  getAllIncomes,
  getAllSections,
  getAllSectionsByClassId,
  getAllSessions,
  getAllStudents,
  getAllStudentsByClassSection,
  getStudentById,
  getStudentFeesById,
  promoteStudents,
} from '@/utils/api'
import {
  CollectFeesType,
  CreateBankAccountsType,
  CreateClassType,
  CreateExamGroupType,
  CreateExamResultsType,
  CreateExamsType,
  CreateExamSubjectsType,
  CreateExpenseHeadsType,
  CreateExpensesType,
  CreateFeesGroupType,
  CreateFeesMasterType,
  CreateFeesTypeType,
  CreateIncomeHeadsType,
  CreateIncomesType,
  CreateStudentWithFeesType,
  GetClassType,
  GetExamGroupType,
  GetExamsType,
  GetExamSubjectsType,
  GetExpenseHeadsType,
  GetFeesGroupType,
  GetFeesMasterType,
  GetFeesTypeType,
  GetIncomeHeadsType,
  GetIncomesType,
  GetStudentFeesType,
  PromotionResponseType,
  StudentPromotionsType,
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

export const useGetClassesByClassId = (id: number) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['sections', id],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getAllSectionsByClassId(token, id)
    },
    enabled: !!token && id > 0,
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

//session
export const useGetSessions = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllSessions(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useGetBankAccounts = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllBankAccounts(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddBankAccount = ({
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
    mutationFn: (data: CreateBankAccountsType) => {
      return createBankAccount(data, token)
    },
    onSuccess: (data) => {
      console.log('bank account added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding bank account:', error)
    },
  })

  return mutation
}

export const useUpdateBankAccount = ({
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
    mutationFn: ({ id, data }: { id: number; data: CreateBankAccountsType }) => {
      return editBankAccount(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'bank account edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing bank account:', error)
    },
  })

  return mutation
}

export const useDeleteBankAccount = ({
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
      return deleteBankAccount(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'bank account is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })

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

export const useGetStudentById = (id: number) => {
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

export const useGetStudentFeesByClassSection = (
  classId: number,
  sectionId: number
) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['studentFees', classId, sectionId],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getAllStudentsByClassSection(token, classId, sectionId)
    },
    enabled: !!token && classId > 0 && sectionId > 0,
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

export const usePromoteStudents = ({
  onClose,
  reset,
  setFailedPromotions,
  setShowFailedPopup,
  onSuccess,
}: {
  onClose: () => void
  reset: () => void
  setFailedPromotions: (
    data: PromotionResponseType['notPromotedStudents']
  ) => void
  setShowFailedPopup: (value: boolean) => void
  onSuccess: (response: PromotionResponseType) => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ data }: { data: StudentPromotionsType }) => {
      const response = await promoteStudents(data, token)
      return response.data! // <-- add ! to assert non-null
    },
    onSuccess: (response: PromotionResponseType) => {
      console.log('🚀 ~ usePromoteStudents ~ response:', response)

      if (response.notPromotedStudents?.length > 0) {
        setFailedPromotions(response.notPromotedStudents)
        setShowFailedPopup(true)
      } else {
        toast({
          title: 'Success!',
          description: 'All students promoted successfully.',
        })
      }

      onSuccess(response)

      queryClient.invalidateQueries({ queryKey: ['students'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error promoting students:', error)
    },
  })

  return mutation
}

//student fees
export const useGetStudentFeesById = (id: number) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['studentFees', id],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getStudentFeesById(token, id)
    },
    enabled: !!token && id > 0,
    select: (data) => data,
  })
}

export const useCollectFees = ({
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
    mutationFn: (data: CollectFeesType) => {
      return collectFees(data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Student fees collected successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['studentFees'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error collecting student fees:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Something went wrong.',
      })
    },
  })

  return mutation
}

//exams group
export const useGetExamGroups = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['exam-groups'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllExamGroups(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddExamGroup = ({
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
    mutationFn: (data: CreateExamGroupType) => {
      return createExamGroup(data, token)
    },
    onSuccess: (data) => {
      console.log('exam groups added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['exam-groups'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding exam group:', error)
    },
  })

  return mutation
}

export const useUpdateExamGroup = ({
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
    mutationFn: ({ id, data }: { id: number; data: GetExamGroupType }) => {
      return editExamGroup(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam group edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing exam group:', error)
    },
  })

  return mutation
}

export const useDeleteExamGroup = ({
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
      return deleteExamGroup(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam group is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//exam subjects
export const useGetExamSubjects = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['exam-subjects'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllExamSubjects(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddExamSubject = ({
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
    mutationFn: (data: CreateExamSubjectsType) => {
      return createExamSubject(data, token)
    },
    onSuccess: (data) => {
      console.log('exam subjects added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['exam-subjects'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding exam subject:', error)
    },
  })

  return mutation
}

export const useUpdateExamSubject = ({
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
    mutationFn: ({ id, data }: { id: number; data: GetExamSubjectsType }) => {
      return editExamSubject(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam subject edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['exam-subjects'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing exam subject:', error)
    },
  })

  return mutation
}

export const useDeleteExamSubject = ({
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
      return deleteExamSubject(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam subject is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['exam-subjects'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//exam
export const useGetExams = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['exams'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllExams(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddExam = ({
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
    mutationFn: (data: CreateExamsType) => {
      return createExam(data, token)
    },
    onSuccess: (data) => {
      console.log('exam is added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['exams'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding exam:', error)
    },
  })

  return mutation
}

export const useUpdateExam = ({
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
    mutationFn: ({ id, data }: { id: number; data: CreateExamsType }) => {
      return editExam(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam is edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['exams'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing exam:', error)
    },
  })

  return mutation
}

export const useDeleteExam = ({
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
      return deleteExam(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['exams'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//exam result
export const useGetExamResults = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['examResults'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllExamResults(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddExamResult = ({
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
    mutationFn: (data: CreateExamResultsType) => {
      return createExamResult(data, token)
    },
    onSuccess: (data) => {
      console.log('exam result is added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['examResults'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding exam result:', error)
    },
  })

  return mutation
}

export const useUpdateExamResult = ({
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
    mutationFn: ({ id, data }: { id: number; data: CreateExamResultsType }) => {
      return editExamResult(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam result is edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['examResults'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing exam result:', error)
    },
  })

  return mutation
}

export const useDeleteExamResult = ({
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
      return deleteExamResult(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'exam result is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['examResults'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//income head
export const useGetIncomeHeads = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['income-heads'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllIncomeHeads(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddIncomeHead = ({
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
    mutationFn: (data: CreateIncomeHeadsType) => {
      return createIncomeHead(data, token)
    },
    onSuccess: (data) => {
      console.log('income head added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['income-heads'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding income head:', error)
    },
  })

  return mutation
}

export const useUpdateIncomeHead = ({
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
    mutationFn: ({ id, data }: { id: number; data: GetIncomeHeadsType }) => {
      return editIncomeHead(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'income head edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['income-heads'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing income head:', error)
    },
  })

  return mutation
}

export const useDeleteIncomeHead = ({
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
      return deleteIncomeHead(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'income head is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['income-heads'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//income
export const useGetIncomes = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['incomes'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllIncomes(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddIncome = ({
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
    mutationFn: (data: CreateIncomesType) => {
      return createIncome(data, token)
    },
    onSuccess: (data) => {
      console.log('income added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['incomes'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding income:', error)
    },
  })

  return mutation
}

export const useUpdateIncome = ({
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
    mutationFn: ({ id, data }: { id: number; data: CreateIncomesType }) => {
      return editIncome(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'income edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['incomes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing income:', error)
    },
  })

  return mutation
}

export const useDeleteIncome = ({
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
      return deleteIncome(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'income is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['incomes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//expense heads
export const useGetExpenseHeads = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['expense-heads'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllExpenseHeads(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddExpenseHead = ({
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
    mutationFn: (data: CreateExpenseHeadsType) => {
      return createExpenseHead(data, token)
    },
    onSuccess: (data) => {
      console.log('expense head added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['expense-heads'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding expense head:', error)
    },
  })

  return mutation
}

export const useUpdateExpenseHead = ({
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
    mutationFn: ({ id, data }: { id: number; data: GetExpenseHeadsType }) => {
      return editExpenseHead(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'expense head edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['expense-heads'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing expense head:', error)
    },
  })

  return mutation
}

export const useDeleteExpenseHead = ({
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
      return deleteExpenseHead(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'expense head is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['expense-heads'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//expense
export const useGetExpenses = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllExpenses(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddExpense = ({
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
    mutationFn: (data: CreateExpensesType) => {
      return createExpense(data, token)
    },
    onSuccess: (data) => {
      console.log('income added successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['expenses'] })

      // Reset form fields after success
      reset()

      // Close the form modal
      onClose()
    },
    onError: (error) => {
      // Handle error
      console.error('Error adding income:', error)
    },
  })

  return mutation
}

export const useUpdateExpense = ({
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
    mutationFn: ({ id, data }: { id: number; data: CreateExpensesType }) => {
      return editExpense(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'income edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing income:', error)
    },
  })

  return mutation
}

export const useDeleteExpense = ({
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
      return deleteExpense(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'income is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}