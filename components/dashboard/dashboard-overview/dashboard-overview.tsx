'use client'

import {
  Settings,
  BarChart3,
  Wallet,
  ShoppingCart,
  CreditCard,
  Smartphone,
  DollarSign,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Popup } from '@/utils/popup'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGetAllStudents, useGetPaymentSummary } from '@/hooks/use-api'

const DashboardOverview = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'inventory' | 'customer-payment' | 'purchases' | null
    title: string
  }>({
    isOpen: false,
    type: null,
    title: '',
  })

  const { data: paymentSummary } = useGetPaymentSummary()
  console.log('🚀 ~ DashboardOverview ~ paymentSummary:', paymentSummary)

  const { data: students } = useGetAllStudents()
  const { data: profitSummary } = [] as any
  const { data: bankBalanceSummary } = [] as any

  // Static inventory data for modal
  const InventoryItems = {
    data: [
      { item_name: 'Product A', totQty: 100, price: 500 },
      { item_name: 'Product B', totQty: 75, price: 800 },
      { item_name: 'Product C', totQty: 50, price: 1200 },
    ],
  }

  const totalAmount = InventoryItems?.data?.reduce((sum: number, item: any) => {
    const qty = Math.max(item.totQty, 0)
    return sum + qty * item.price
  }, 0)

  useEffect(() => {
    const checkUserData = () => {
      const storedUserData = localStorage.getItem('currentUser')
      const storedToken = localStorage.getItem('authToken')

      if (!storedUserData || !storedToken) {
        console.log('No user data or token found in localStorage')
        router.push('/')
        return
      }
      setIsLoading(false)
    }

    checkUserData()
  }, [userData, token, router])

  const openModal = (type: 'inventory' | 'customer-payment' | 'purchases') => {
    const titles = {
      inventory: 'Total Inventory Items',
      'customer-payment': 'Customer Payment Details',
      purchases: 'Purchase Summary',
    }
    setModalState({
      isOpen: true,
      type,
      title: titles[type],
    })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, title: '' })
  }

  const metrics = [
    {
      title: 'Total Cash',
      value: paymentSummary?.data?.totalCash || 0,
      icon: DollarSign,
      color: 'bg-green-500',
      onClick: undefined,
    },
    {
      title: 'Total Bank',
      value: paymentSummary?.data?.totalBank || 0,
      icon: CreditCard,
      color: 'bg-blue-500',
      onClick: undefined,
    },
    {
      title: 'Total MFS',
      value: paymentSummary?.data?.totalMfs || 0,
      icon: Smartphone,
      color: 'bg-purple-500',
      onClick: undefined,
    },
    {
      title: 'Total Students',
      value: students?.data?.length || 0,
      icon: User,
      color: 'bg-amber-500',
      onClick: undefined,
    },
  ]

  const renderModalContent = () => {
    switch (modalState.type) {
      case 'inventory':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {InventoryItems?.data && InventoryItems.data.length > 0 ? (
                    InventoryItems.data.map((item: any, index: number) => {
                      const itemTotal = Math.max(item.totQty, 0) * item.price
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.item_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.totQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {itemTotal.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {InventoryItems?.data && InventoryItems.data.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-end pr-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        Total Inventory Value:
                      </span>
                      <span className="text-2xl font-bold text-yellow-600">
                        {totalAmount?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const displayValue = metric?.value
          const valueColor = 'text-gray-900'

          return (
            <Card
              key={index}
              className={`hover:shadow-lg transition-shadow duration-200 ${
                metric?.onClick ? 'cursor-pointer' : ''
              }`}
              onClick={metric?.onClick}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {metric?.title}
                    </p>
                    <p className={`text-2xl font-bold mb-1 ${valueColor}`}>
                      {typeof displayValue === 'number'
                        ? displayValue.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                        : displayValue}
                    </p>
                  </div>
                  <div className={`${metric?.color} p-3 rounded-xl shadow-sm`}>
                    {metric?.icon && (
                      <metric.icon className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* profit summary and bank balance summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Profit Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              {profitSummary?.data && profitSummary.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={profitSummary.data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke="#e5e7eb"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />

                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(value: number) =>
                        value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      }
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />

                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />

                    <Line
                      type="monotone"
                      dataKey="total_expense"
                      stroke="#dc2626"
                      name="Total Expense"
                      strokeWidth={2.5}
                      dot={{ fill: '#dc2626', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="gross_profit"
                      stroke="#d97706"
                      name="Gross Profit"
                      strokeWidth={2.5}
                      dot={{ fill: '#d97706', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="net_profit"
                      stroke="#059669"
                      name="Net Profit"
                      strokeWidth={2.5}
                      dot={{ fill: '#059669', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No profit data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Bank Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              {bankBalanceSummary?.data &&
              bankBalanceSummary.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={bankBalanceSummary.data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="bank_name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      }
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="current_balance"
                      stroke="#059669"
                      name="Current Balance"
                      strokeWidth={2.5}
                      dot={{ fill: '#059669', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No bank account data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Popup
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        size="sm:max-w-4xl"
      >
        <div className="py-4">{renderModalContent()}</div>
      </Popup>
    </div>
  )
}

export default DashboardOverview
