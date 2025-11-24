import { fetchApi } from '@/utils/http'
import {
  CreateClassType,
  GetClassType,
  GetSectionsType,
  SignInRequest,
  SignInResponse,
  SignInResponseSchema,
} from '@/utils/type'

export async function signIn(credentials: SignInRequest) {
  return fetchApi<SignInResponse>({
    url: 'api/auth/login',
    method: 'POST',
    body: credentials,
    schema: SignInResponseSchema,
  })
}

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

export async function createClass(
  data: CreateClassType,
  token: string
) {
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

export async function editClass(
  id: number,
  data: GetClassType,
  token: string
) {
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
  return fetchApi<{id: number }>({
    url: `api/classes/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}
