'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  DollarSign,
  FileChartColumn,
  Goal,
  Home,
  NotebookText,
  Settings,
  SquarePlus,
  User2,
  UserCog,
  BadgePlus,
  BadgeMinus,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'

export function DashboardSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Dashboard Overview',
      icon: Home,
      href: '/dashboard/dashboard-overview',
    },
    {
      title: 'Classes',
      icon: BookOpen,
      href: '/dashboard/classes',
    },
    {
      title: 'Setup',
      icon: Settings,
      href: '/dashboard/setup',
      subItems: [
        {
          title: 'Bank Accounts',
          href: '/dashboard/setup/bank-accounts',
        },
      ],
    },
    {
      title: 'Fees Management',
      icon: DollarSign,
      href: '/dashboard/fees-management',
      subItems: [
        {
          title: 'Fees Groups',
          href: '/dashboard/fees-management/fees-groups',
        },
        {
          title: 'Fees Types',
          href: '/dashboard/fees-management/fees-types',
        },
        {
          title: 'Fees Master',
          href: '/dashboard/fees-management/fees-master',
        },
      ],
    },
    {
      title: 'Students Management',
      icon: User2,
      href: '/dashboard/students-management',
      subItems: [
        {
          title: 'Create Student',
          href: '/dashboard/students-management/create-student',
        },
        {
          title: 'Students',
          href: '/dashboard/students-management/students',
        },
        {
          title: 'Promote Student',
          href: '/dashboard/students-management/promote-students',
        },
      ],
    },
    {
      title: 'Exam Management',
      icon: Goal,
      href: '/dashboard/exams-management',
      subItems: [
        {
          title: 'Exam Groups',
          href: '/dashboard/exams-management/exam-groups',
        },
        {
          title: 'Exam Subjects',
          href: '/dashboard/exams-management/exam-subjects',
        },
        {
          title: 'Exams',
          href: '/dashboard/exams-management/exams',
        },
        {
          title: 'Exam Results',
          href: '/dashboard/exams-management/exam-results',
        },
      ],
    },
    {
      title: 'Income Management',
      icon: BadgePlus,
      href: '/dashboard/income-management',
      subItems: [
        {
          title: 'Income Heads',
          href: '/dashboard/income-management/income-heads',
        },
        {
          title: 'Incomes',
          href: '/dashboard/income-management/incomes',
        },
      ],
    },
    {
      title: 'Expense Management',
      icon: BadgeMinus,
      href: '/dashboard/expense-management',
      subItems: [
        {
          title: 'Expense Heads',
          href: '/dashboard/expense-management/expense-heads',
        },
        {
          title: 'Expenses',
          href: '/dashboard/expense-management/expenses',
        },
      ],
    },
    {
      title: 'Reports',
      icon: FileChartColumn,
      href: '/dashboard/reports',
      subItems: [
        {
          title: 'Payment Report',
          href: '/dashboard/reports/payment-report',
        },
      ],
    },
  ]

  // Check if the current path is in the submenu items
  const isSubItemActive = (item: any) => {
    if (!item.subItems) return false
    return item.subItems.some((subItem: any) => pathname === subItem.href)
  }

  // Check if the current path matches the main item or its sub-items
  const isItemActive = (item: any) => {
    return pathname.startsWith(item.href) || isSubItemActive(item)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b mt-16">
        <div className="p-2">
          <h1 className="text-xl font-bold">My Dashboard</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {!item.subItems ? (
                    // Regular menu item without submenu
                    <SidebarMenuButton
                      asChild
                      className={`${isItemActive(item) ? 'bg-yellow-400 text-black hover:bg-yellow-400' : ''}  `}
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    // Menu item with submenu as accordion
                    <Collapsible
                      defaultOpen={isItemActive(item)}
                      className="w-full"
                    >
                      <CollapsibleTrigger className="w-full" asChild>
                        <SidebarMenuButton
                          className={`${isItemActive(item) ? 'bg-yellow-400 text-black hover:bg-yellow-400' : ''}  `}
                        >
                          <item.icon className="mr-2 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`${pathname === subItem.href ? 'bg-gray-100 text-black' : ''}`}
                              >
                                <Link
                                  className="h-auto mt-2"
                                  href={subItem.href}
                                >
                                  {subItem.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
