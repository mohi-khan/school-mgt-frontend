import { fetchApi, fetchApiWithFile } from '@/utils/http'
import {
  CollectFeesType,
  CreateClassType,
  CreateExamsGroupType,
  CreateFeesGroupType,
  CreateFeesMasterType,
  CreateFeesTypeType,
  CreateStudentWithFeesType,
  GetClassType,
  GetExamsGroupType,
  GetFeesGroupType,
  GetFeesMasterType,
  GetFeesTypeType,
  GetSectionsType,
  GetSessionsType,
  GetStudentFeesType,
  GetStudentWithFeesType,
  PromotionResponseType,
  SignInRequest,
  SignInResponse,
  SignInResponseSchema,
  StudentPromotionsType,
} from '@/utils/type'

export async function signIn(credentials: SignInRequest) {
  return fetchApi<SignInResponse>({
    url: 'api/auth/login',
    method: 'POST',
    body: credentials,
    schema: SignInResponseSchema,
  })
}

//sections APIs
export async function getAllSections(token: string) {
  return fetchApi<GetSectionsType[]>({
    url: 'api/sections/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//classes APIs
export async function getAllClasses(token: string) {
  return fetchApi<GetClassType[]>({
    url: 'api/classes/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createClass(data: CreateClassType, token: string) {
  return fetchApi<CreateClassType>({
    url: 'api/classes/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editClass(id: number, data: GetClassType, token: string) {
  return fetchApi<GetClassType>({
    url: `api/classes/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteClass(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/classes/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//fees group APIs
export async function getAllFeesGroups(token: string) {
  return fetchApi<GetFeesGroupType[]>({
    url: 'api/fees-groups/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createFeesGroup(
  data: CreateFeesGroupType,
  token: string
) {
  return fetchApi<CreateFeesGroupType>({
    url: 'api/fees-groups/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editFeesGroup(
  id: number,
  data: GetFeesGroupType,
  token: string
) {
  return fetchApi<GetFeesGroupType>({
    url: `api/fees-groups/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteFeesGroup(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/fees-groups/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//fees types APIs
export async function getAllFeesTypes(token: string) {
  return fetchApi<GetFeesTypeType[]>({
    url: 'api/fees-types/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createFeesType(data: CreateFeesTypeType, token: string) {
  return fetchApi<CreateFeesTypeType>({
    url: 'api/fees-types/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editFeesType(
  id: number,
  data: GetFeesTypeType,
  token: string
) {
  return fetchApi<GetFeesTypeType>({
    url: `api/fees-types/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteFeesType(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/fees-types/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//fees master APIs
export async function getAllFeesMasters(token: string) {
  return fetchApi<GetFeesMasterType[]>({
    url: 'api/fees-master/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createFeesMaster(
  data: CreateFeesMasterType,
  token: string
) {
  return fetchApi<CreateFeesMasterType>({
    url: 'api/fees-master/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editFeesMaster(
  id: number,
  data: CreateFeesMasterType,
  token: string
) {
  return fetchApi<CreateFeesMasterType>({
    url: `api/fees-master/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteFeesMaster(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/fees-master/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//sessions APIs
export async function getAllSessions(token: string) {
  return fetchApi<GetSessionsType[]>({
    url: 'api/sessions/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//students APIs
export async function getAllStudents(token: string) {
  return fetchApi<GetStudentWithFeesType[]>({
    url: 'api/students/getall?classId=&sectionId=',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getStudentById(token: string, id: number) {
  return fetchApi<GetStudentWithFeesType[]>({
    url: `api/students/getById/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAllStudentsByClassSection(
  token: string,
  classId: number,
  sectionId: number
) {
  return fetchApi<GetStudentWithFeesType[]>({
    url: `api/students/getall?classId=${classId}&sectionId=${sectionId}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createStudentWithFees(token: string, formData: FormData) {
  return fetchApiWithFile<CreateStudentWithFeesType>({
    url: 'api/students/create',
    method: 'POST',
    headers: {
      Authorization: `${token}`,
    },
    body: formData,
  })
}

export async function editStudentWithFees(
  id: number,
  formData: FormData,
  token: string
) {
  return fetchApiWithFile<CreateStudentWithFeesType>({
    url: `api/students/edit/${id}`,
    method: 'PATCH',
    headers: {
      Authorization: `${token}`,
    },
    body: formData,
  })
}

export async function deleteStudent(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/students/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//student fees APIs
export async function getStudentFeesById(token: string, id: number) {
  return fetchApi<GetStudentFeesType[]>({
    url: `api/student-fees/get-fees/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function collectFees(data: CollectFeesType, token: string) {
  return fetchApi<CollectFeesType>({
    url: 'api/student-fees/collect-fees',
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//promote student APIs
export async function promoteStudents(
  data: StudentPromotionsType,
  token: string
) {
  return fetchApi<PromotionResponseType>({
    url: 'api/student-promotions/promote',
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAllExamsGroups(token: string) {
  return fetchApi<GetExamsGroupType[]>({
    url: 'api/exams-groups/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExamsGroup(
  data: CreateExamsGroupType,
  token: string
) {
  return fetchApi<CreateExamsGroupType>({
    url: 'api/exams-groups/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExamsGroup(
  id: number,
  data: GetExamsGroupType,
  token: string
) {
  return fetchApi<GetExamsGroupType>({
    url: `api/exams-groups/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExamsGroup(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/exams-groups/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}