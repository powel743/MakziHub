import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { register as apiRegister } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { User, Mail, Phone, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import logoSrc from '../../assets/logo.svg'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^(07|01)\d{8}$/, 'Enter a valid Kenyan number e.g. 0712345678'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await apiRegister({
        full_name: data.full_name,
        email: data.email,
        phone: `+254${data.phone.slice(1)}`,
        password: data.password,
        role: 'tenant',
      })
      toast.success('Account created! Check your email for the verification code.')
      navigate('/auth/verify', { state: { phone: data.phone, email: data.email } })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed. Please try again.')
    }
  }

  return (
    <>
      <Helmet><title>Create Account — MakaziHub</title></Helmet>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoSrc} alt="MakaziHub" className="h-10 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-gray-900">Create your account</h1>
            <p className="text-gray-500 mt-1 text-sm">Join thousands finding homes in Nairobi</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Jane Muthoni"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.full_name?.message}
                {...register('full_name')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="jane@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-medium">+254</span>
                  <input
                    type="tel"
                    placeholder="712345678"
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirm?.message}
                {...register('confirm')}
              />
              <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-2">
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  )
}
