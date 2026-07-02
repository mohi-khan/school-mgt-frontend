'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  EyeIcon,
  EyeOffIcon,
  Lock,
  LockIcon,
  User,
  UserIcon,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { signIn } from '@/utils/api'
import { useAddTenant } from '@/hooks/use-api'

type Tab = 'signin' | 'register'

export default function SignIn() {
  const [activeTab, setActiveTab] = useState<Tab>('signin')
  const router = useRouter()

  // --- Sign In state ---
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signinError, setSigninError] = useState('')
  const [signinLoading, setSigninLoading] = useState(false)

  // --- Register state ---
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regTenantName, setRegTenantName] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const reset = useCallback(() => {
    setRegUsername('')
    setRegPassword('')
    setRegConfirmPassword('')
    setRegTenantName('')
  }, [])

  const onClose = useCallback(() => {
    setActiveTab('signin')
  }, [])

  const addTenantMutation = useAddTenant({ onClose, reset })

  // ── Sign In ──────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigninError('')
    setSigninLoading(true)

    if (!username || !password) {
      setSigninError('Please fill in all fields.')
      setSigninLoading(false)
      return
    }

    try {
      const response = await signIn({ username, password })
      if (response.error || !response.data) {
        toast({
          title: 'Error',
          description: response.error?.message || 'Failed to sign in',
        })
      } else {
        const { userId, roleId, username } = response.data.user
        const token = response.data.token

        localStorage.setItem('authToken', token)
        localStorage.setItem('currentUser', JSON.stringify({ userId, roleId, username }))

        if (roleId == 1) {
          router.push('/dashboard/dashboard-overview')
        } else if (roleId == 2) {
          router.push('/dashboard/reports/student-report')
        }

        toast({ title: 'Success', description: 'You are signed in' })
      }
    } catch (err) {
      console.error('Login error:', err)
      setSigninError('An unexpected error occurred. Please try again later.')
    } finally {
      setSigninLoading(false)
    }
  }

  // ── Register (Create Tenant) ─────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')

    if (
      !regUsername ||
      !regPassword ||
      !regConfirmPassword ||
      !regTenantName
    ) {
      setRegisterError('Please fill in all fields.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setRegisterError('Passwords do not match.')
      return
    }

    if (regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters long.')
      return
    }

    addTenantMutation.mutate({
      tenantData: {
        tenantName: regTenantName,
        status: true,
        createdBy: 0,
      },
      userData: {
        username: regUsername,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        roleId: 0,
        tenantId: 0,
        isPasswordResetRequired: false,
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-4xl font-bold mb-6">School Management</h2>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'signin'
                ? 'text-gray-900 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'register'
                ? 'text-gray-900 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Create School
          </button>
        </div>

        <div className="p-8">
          {/* ── Sign In Panel ── */}
          {activeTab === 'signin' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sign in to your school to continue.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      className="border border-gray-300 pl-10"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="password"
                      className="border border-gray-300 pl-10 pr-10"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {signinError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signinError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black mt-2"
                  disabled={signinLoading}
                >
                  <LockIcon className="mr-2 h-4 w-4" />
                  {signinLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </>
          )}

          {/* ── Create Account Panel ── */}
          {activeTab === 'register' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Create an account
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set up your school and admin account.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regTenantName">
                    School Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="regTenantName"
                    type="text"
                    placeholder="Enter your School name"
                    className="border border-gray-300"
                    value={regTenantName}
                    onChange={(e) => setRegTenantName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regUsername">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="regUsername"
                      type="text"
                      placeholder="Enter username"
                      className="border border-gray-300 pl-10"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regPassword">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="regPassword"
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      className="border border-gray-300 pr-10"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                    >
                      {showRegPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regConfirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="regConfirmPassword"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="border border-gray-300 pr-10"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowRegConfirmPassword(!showRegConfirmPassword)
                      }
                    >
                      {showRegConfirmPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {registerError && (
                  <Alert variant="destructive">
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black mt-2"
                  disabled={addTenantMutation.isPending}
                >
                  <LockIcon className="mr-2 h-4 w-4" />
                  {addTenantMutation.isPending
                    ? 'Creating Account...'
                    : 'Create Account'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
