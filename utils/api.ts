import { fetchApi, fetchApiWithFile } from '@/utils/http'
import {
  CollectFeesType,
  CreateBankAccountsType,
  CreateBankMfsCashType,
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
  CreateMfssType,
  CreateStudentWithFeesType,
  GetBankAccountsType,
  GetBankPaymentReportType,
  GetBankMfsCashType,
  GetCashPaymentReportType,
  GetClassType,
  GetExamGroupType,
  GetExamResultsType,
  GetExamsType,
  GetExamSubjectsType,
  GetExpenseHeadsType,
  GetExpenseReportType,
  GetExpensesType,
  GetFeesGroupType,
  GetFeesMasterType,
  GetFeesTypeType,
  GetIncomeHeadsType,
  GetIncomeReportType,
  GetIncomesType,
  GetMfsPaymentReportType,
  GetMfssType,
  GetPaymentReportType,
  GetSectionsType,
  GetSessionsType,
  GetStudentFeesType,
  GetStudentWithFeesType,
  PromotionResponseType,
  SignInRequest,
  SignInResponse,
  SignInResponseSchema,
  StudentPromotionsType,
  GetTransactionReportType,
  GetPaymentSummaryType,
  GetIncomeSummaryType,
  GetExpenseSummaryType,
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

export async function getAllSectionsByClassId(token: string, classId: number) {
  return fetchApi<GetSectionsType[]>({
    url: `api/sections/getall?classId=${classId}`,
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

//bank accounts APIs
export async function getAllBankAccounts(token: string) {
  return fetchApi<GetBankAccountsType[]>({
    url: 'api/bank-accounts/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createBankAccount(
  data: CreateBankAccountsType,
  token: string
) {
  return fetchApi<CreateBankAccountsType>({
    url: 'api/bank-accounts/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editBankAccount(
  id: number,
  data: CreateBankAccountsType,
  token: string
) {
  return fetchApi<CreateBankAccountsType>({
    url: `api/bank-accounts/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteBankAccount(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/bank-accounts/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//mfs APIs
export async function getAllMfss(token: string) {
  return fetchApi<GetMfssType[]>({
    url: 'api/mfs/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createMfs(data: CreateMfssType, token: string) {
  return fetchApi<CreateMfssType>({
    url: 'api/mfs/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editMfs(id: number, data: CreateMfssType, token: string) {
  return fetchApi<CreateMfssType>({
    url: `api/mfs/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteMfs(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/mfs/delete/${id}`,
    method: 'DELETE',
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
  return fetchApi<GetStudentWithFeesType>({
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

//exam group APIs
export async function getAllExamGroups(token: string) {
  return fetchApi<GetExamGroupType[]>({
    url: 'api/exam-groups/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExamGroup(
  data: CreateExamGroupType,
  token: string
) {
  return fetchApi<CreateExamGroupType>({
    url: 'api/exam-groups/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExamGroup(
  id: number,
  data: GetExamGroupType,
  token: string
) {
  return fetchApi<GetExamGroupType>({
    url: `api/exam-groups/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExamGroup(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/exam-groups/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//exam subject APIs
export async function getAllExamSubjects(token: string) {
  return fetchApi<GetExamSubjectsType[]>({
    url: 'api/exam-subjects/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExamSubject(
  data: CreateExamSubjectsType,
  token: string
) {
  return fetchApi<CreateExamSubjectsType>({
    url: 'api/exam-subjects/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExamSubject(
  id: number,
  data: GetExamSubjectsType,
  token: string
) {
  return fetchApi<GetExamSubjectsType>({
    url: `api/exam-subjects/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExamSubject(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/exam-subjects/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//exams APIs
export async function getAllExams(token: string) {
  return fetchApi<GetExamsType[]>({
    url: 'api/exams/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExam(data: CreateExamsType, token: string) {
  return fetchApi<CreateExamsType>({
    url: 'api/exams/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExam(
  id: number,
  data: CreateExamsType,
  token: string
) {
  return fetchApi<CreateExamsType>({
    url: `api/exams/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExam(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/exams/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//exam result APIs
export async function getAllExamResults(token: string) {
  return fetchApi<GetExamResultsType[]>({
    url: 'api/exam-results/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExamResult(
  data: CreateExamResultsType,
  token: string
) {
  return fetchApi<CreateExamResultsType>({
    url: 'api/exam-results/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExamResult(
  id: number,
  data: CreateExamResultsType,
  token: string
) {
  return fetchApi<CreateExamResultsType>({
    url: `api/exam-results/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExamResult(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/exam-results/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//income head APIs
export async function getAllIncomeHeads(token: string) {
  return fetchApi<GetIncomeHeadsType[]>({
    url: 'api/income-heads/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createIncomeHead(
  data: CreateIncomeHeadsType,
  token: string
) {
  return fetchApi<CreateIncomeHeadsType>({
    url: 'api/income-heads/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editIncomeHead(
  id: number,
  data: CreateIncomeHeadsType,
  token: string
) {
  return fetchApi<CreateIncomeHeadsType>({
    url: `api/income-heads/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteIncomeHead(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/income-heads/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//income APIs
export async function getAllIncomes(token: string) {
  return fetchApi<GetIncomesType[]>({
    url: 'api/incomes/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createIncome(data: CreateIncomesType, token: string) {
  return fetchApi<CreateIncomesType>({
    url: 'api/incomes/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editIncome(
  id: number,
  data: CreateIncomesType,
  token: string
) {
  return fetchApi<CreateIncomesType>({
    url: `api/incomes/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteIncome(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/incomes/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//expense heads APIs
export async function getAllExpenseHeads(token: string) {
  return fetchApi<GetExpenseHeadsType[]>({
    url: 'api/expense-heads/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExpenseHead(
  data: CreateExpenseHeadsType,
  token: string
) {
  return fetchApi<CreateExpenseHeadsType>({
    url: 'api/expense-heads/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExpenseHead(
  id: number,
  data: CreateExpenseHeadsType,
  token: string
) {
  return fetchApi<CreateExpenseHeadsType>({
    url: `api/expense-heads/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExpenseHead(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/expense-heads/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//expsnse APIs
export async function getAllExpenses(token: string) {
  return fetchApi<GetExpensesType[]>({
    url: 'api/expenses/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createExpense(data: CreateExpensesType, token: string) {
  return fetchApi<CreateExpensesType>({
    url: 'api/expenses/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editExpense(
  id: number,
  data: CreateExpensesType,
  token: string
) {
  return fetchApi<CreateExpensesType>({
    url: `api/expenses/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteExpense(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/expenses/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//bank to bank conversion APIs
export async function getAllBankMfsCash(token: string) {
  return fetchApi<GetBankMfsCashType[]>({
    url: 'api/bank-mfs-cash/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createBankMfsCash(
  data: CreateBankMfsCashType,
  token: string
) {
  return fetchApi<CreateBankMfsCashType>({
    url: 'api/bank-mfs-cash/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editBankMfsCash(
  id: number,
  data: CreateBankMfsCashType,
  token: string
) {
  return fetchApi<CreateBankMfsCashType>({
    url: `api/bank-mfs-cash/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteBankMfsCash(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/bank-mfs-cash/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//reports APIs
export async function getPaymentReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetPaymentReportType[]>({
    url: `api/reports/payment-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getBankPaymentReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetBankPaymentReportType[]>({
    url: `api/reports/bank-payment-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getMfsPaymentReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetMfsPaymentReportType[]>({
    url: `api/reports/mfs-payment-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getCashPaymentReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetCashPaymentReportType[]>({
    url: `api/reports/cash-payment-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getTransactionReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetTransactionReportType[]>({
    url: `api/reports/transaction-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getIncomeReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetIncomeReportType[]>({
    url: `api/reports/income-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getExpenseReport(
  token: string,
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetExpenseReportType[]>({
    url: `api/reports/expense-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//dashbaord APIs
export async function getPaymentSummary(token: string) {
  return fetchApi<GetPaymentSummaryType>({
    url: 'api/dashboard/payment-summary',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getIncomeSummary(token: string) {
  return fetchApi<GetIncomeSummaryType>({
    url: 'api/dashboard/income-summary',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getExpenseSummary(token: string) {
  return fetchApi<GetExpenseSummaryType>({
    url: 'api/dashboard/expense-summary',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}