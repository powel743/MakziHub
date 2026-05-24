import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { forgotPassword } from '../../api/auth.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import logoSrc from '../../assets/logo.svg'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await forgotPassword({ email })
      setSent(true)
    } catch {
      toast.error('Could not send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Forgot Password — MakaziHub</title></Helmet>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={logoSrc} alt="MakaziHub" className="h-10 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-gray-900">Reset your password</h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-semibold text-gray-900 mb-2">Check your email</h2>
                <p className="text-sm text-gray-500 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>.
                </p>
                <Link to="/auth/login" className="text-primary text-sm font-medium hover:underline">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="jane@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Send Reset Link
                </Button>
                <Link to="/auth/login" className="block text-center text-sm text-gray-500 hover:text-primary">
                  Back to sign in
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
