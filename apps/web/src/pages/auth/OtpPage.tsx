import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { verifyOtp } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../../components/ui/Button'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import logoSrc from '../../assets/logo.svg'
import { maskEmail } from '../../utils/format'

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Phone is still the backend's OTP key; email is what the code is delivered to.
  const phone = (location.state as any)?.phone || ''
  const email = (location.state as any)?.email || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const { setTokens, setUser } = useAuthStore()

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleSubmit = async () => {
    const code = otp.join('')
    if (code.length !== 6) return
    setLoading(true)
    try {
      const data = await verifyOtp({ phone: `+254${phone.slice(1)}`, otp: code })
      setTokens(data.access_token, data.refresh_token)
      setUser(data.user)
      toast.success('Email verified!')
      navigate('/auth/role')
    } catch {
      toast.error('Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Verify OTP — MakaziHub</title></Helmet>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-sm text-center">
          <img src={logoSrc} alt="MakaziHub" className="h-10 w-auto mx-auto mb-6" />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>

            <h1 className="text-xl font-bold font-display text-gray-900 mb-1">Verify your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter the 6-digit code sent to <strong>{email ? maskEmail(email) : 'your email'}</strong>
            </p>

            {/* OTP inputs */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el }}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
              disabled={otp.join('').length !== 6}
            >
              Verify OTP
            </Button>

            <div className="mt-4 text-sm text-gray-500">
              {cooldown > 0 ? (
                <span>Resend OTP in {cooldown}s</span>
              ) : (
                <button
                  onClick={() => { setCooldown(60); toast.success('OTP resent') }}
                  className="text-primary hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
