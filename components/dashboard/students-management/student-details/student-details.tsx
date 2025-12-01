'use client'

import { useParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Image from 'next/image'
import { useGetStudentById } from '@/hooks/use-api'
import React, { useState } from 'react'
import { formatDate, formatNumber } from '@/utils/conversions'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const StudentDetailsPage = () => {
  const { studentId } = useParams()
  const { data: student } = useGetStudentById(Number(studentId))
  console.log('🚀 ~ StudentDetailsPage ~ student:', student)

  if (!student) return <div className="p-10">Loading...</div>

  const studentDetails = (student?.data as any)?.studentDetails
  const studentFees = (student?.data as any)?.studentFees

  // Group fees by some property, e.g., feesGroupName
  const grouped = studentFees?.reduce((acc: any, fee: any) => {
    const groupName = fee.feesGroupName || 'Other'
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(fee)
    return acc
  }, {})

  return (
    <div className="flex gap-6 p-6">
      {/* LEFT SIDEBAR */}
      <div className="w-[450px] space-y-4">
        <Card>
          <CardContent className="p-6 flex gap-4">
            <div className="w-20 h-20 rounded-md bg-gray-200 overflow-hidden">
              <Image
                src={studentDetails.photoUrl || '/user-placeholder.png'}
                alt="Profile"
                width={128}
                height={128}
                className="object-cover border"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold pb-2">
                {studentDetails.firstName} {studentDetails.lastName}
              </h2>

              <p className="text-sm text-gray-600">
                Admission No: {studentDetails.admissionNo}
              </p>
              <p className="text-sm text-gray-600">
                Roll No: {studentDetails.rollNo}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <p>
              <strong>Class:</strong> {studentDetails.className}
            </p>
            <p>
              <strong>Section:</strong> {studentDetails.sectionName}
            </p>
            <p>
              <strong>Gender:</strong> {studentDetails.gender}
            </p>
            <p>
              <strong>DOB:</strong> {formatDate(studentDetails.dateOfBirth)}
            </p>
            <p>
              <strong>Blood Group:</strong> {studentDetails.bloodGroup ?? 'N/A'}
            </p>
            <p>
              <strong>Phone:</strong> {studentDetails.phoneNumber}
            </p>
            <p>
              <strong>Email:</strong> {studentDetails.email}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>

          {/* ---------------- PROFILE TAB ---------------- */}
          <TabsContent value="profile" className="space-y-6 mt-4">
            <Card>
              <CardHeader className="bg-slate-100 mb-4">
                <CardTitle className="text-xl font-semibold">
                  Student Details
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <p>
                  <strong>Admission Date:</strong>{' '}
                  {formatDate(studentDetails.admissionDate)}
                </p>
                <p>
                  <strong>Religion:</strong> {studentDetails.religion ?? 'N/A'}
                </p>
                <p>
                  <strong>Height:</strong> {studentDetails.height ?? 'N/A'}
                </p>
                <p>
                  <strong>Weight:</strong> {studentDetails.weight ?? 'N/A'}
                </p>
                <p className="col-span-2">
                  <strong>Address:</strong> {studentDetails.address}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-100 mb-4">
                <CardTitle className="text-xl font-semibold">
                  Parents Information
                </CardTitle>
              </CardHeader>

              <CardContent className="text-sm">
                <div className="flex justify-between items-start">
                  <table className="table-auto border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Father Name:'}
                        </td>
                        <td className="py-1">{studentDetails.fatherName}</td>
                      </tr>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Father Phone:'}
                        </td>
                        <td className="py-1">{studentDetails.fatherPhone}</td>
                      </tr>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Father Email:'}
                        </td>
                        <td className="py-1">{studentDetails.fatherEmail}</td>
                      </tr>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Father Occupation:'}
                        </td>
                        <td className="py-1">
                          {studentDetails.fatherOccupation}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="w-20 h-20 rounded-md bg-gray-200 overflow-hidden">
                    <Image
                      src={
                        studentDetails.fatherPhotoUrl || '/user-placeholder.png'
                      }
                      alt="Profile"
                      width={128}
                      height={128}
                      className="object-cover border"
                    />
                  </div>
                </div>

                <div className="border border-slate-100 my-5"></div>

                <div className="flex justify-between items-start">
                  <table className="table-auto border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Mother Name:'}
                        </td>
                        <td className="py-1">{studentDetails.motherName}</td>
                      </tr>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Mother Phone:'}
                        </td>
                        <td className="py-1">{studentDetails.motherPhone}</td>
                      </tr>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Mother Email:'}
                        </td>
                        <td className="py-1">{studentDetails.motherEmail}</td>
                      </tr>
                      <tr>
                        <td className="w-36 font-semibold py-1">
                          {'Mother Occupation:'}
                        </td>
                        <td className="py-1">
                          {studentDetails.motherOccupation}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="w-20 h-20 rounded-md bg-gray-200 overflow-hidden">
                    <Image
                      src={
                        studentDetails.motherPhotoUrl || '/user-placeholder.png'
                      }
                      alt="Profile"
                      width={128}
                      height={128}
                      className="object-cover border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- FEES TAB ---------------- */}
          <TabsContent value="fees" className="mt-4">
            <Card>
              <CardHeader className="bg-slate-100 mb-4">
                <CardTitle className="text-xl font-semibold">
                  Student Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentFees.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No fees assigned yet.
                  </p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(grouped ?? {}).map(
                      ([groupName, groupFees]) => {
                        ;(groupFees as any).map((f: any) => f.feesMasterId || 0)
                        return (
                          <AccordionItem key={groupName} value={groupName}>
                            <div className="flex items-center gap-2 px-2">
                              <AccordionTrigger className="flex-1 text-sm font-medium">
                                {groupName}
                              </AccordionTrigger>
                            </div>

                            <AccordionContent>
                              <div className="border rounded-md overflow-hidden bg-white">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-1/2">
                                        Fees Type
                                      </TableHead>
                                      <TableHead>Due Date</TableHead>
                                      <TableHead>Amount (BDT)</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>

                                  <TableBody>
                                    {(groupFees as any)?.map((fee: any) => (
                                      <TableRow key={fee.feesMasterId}>
                                        <TableCell className="text-sm">
                                          {fee.feesTypeName}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {formatDate(fee.dueDate)}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                          {formatNumber(fee.amount)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {fee.studentId ? 'Assigned' : 'N/A'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      }
                    )}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default StudentDetailsPage
