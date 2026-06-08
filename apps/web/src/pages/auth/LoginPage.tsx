import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import logoSrc from '../../assets/logo.svg'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || null

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      const role = user?.role
      const dest = from || (role === 'admin' ? '/admin/dashboard' : role === 'tenant' ? '/tenant/dashboard' : '/lister/dashboard')
      navigate(dest, { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Invalid email or password')
    }
  }

  return (
    <>
      <Helmet><title>Sign In — MakaziHub</title></Helmet>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoSrc} alt="MakaziHub" className="h-10 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your MakaziHub account</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="jane@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Your password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end">
                <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" fullWidth loading={isLoading} size="lg">
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-primary font-medium hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
