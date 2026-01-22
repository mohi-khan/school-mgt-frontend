'use client'

import React from 'react'
import type { GetExamResultsType } from '@/utils/type'

const SubjectReportCard = React.forwardRef<
  HTMLDivElement,
  {
    subjectName: string
    className: string
    sectionName: string
    examGroupName: string
    sessionName: string
    results: GetExamResultsType[]
  }
>(
  (
    {
      subjectName,
      className,
      sectionName,
      examGroupName,
      results,
      sessionName,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="w-full max-w-4xl mx-auto bg-white shadow-lg print:shadow-none"
      >
        {/* Header */}
        <div className="border-b-4 border-amber-300 p-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide text-center">
            SUBJECT RESULT REPORT
          </h1>
          <h1 className="text-xl font-bold text-gray-800 tracking-wide text-center">
            {examGroupName}
          </h1>

          {/* Subject Info */}
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Subject:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {subjectName}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Date:</span>
                <p className="font-semibold border-b border-gray-400 min-w-[100px]">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Class:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {className}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Section:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {sectionName}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Session:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {sessionName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-amber-300">
                <th className="border border-gray-300 px-4 py-3 text-left text-black">
                  Student Name
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.examResultId}>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {result.studentName || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                    {result.gainedMarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-8 py-6 text-xs text-gray-500">
          <div className="grid grid-cols-3 gap-8 mt-6">
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Class Teacher
              </p>
            </div>
            <div></div>
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Principal
              </p>
            </div>
          </div>

          <p className="text-center mt-6">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }
)

SubjectReportCard.displayName = 'SubjectReportCard'

export default SubjectReportCard
