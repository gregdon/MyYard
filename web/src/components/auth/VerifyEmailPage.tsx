import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { TreePine, MailCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function VerifyEmailPage() {
  const user = useAuthStore((s) => s.user)
  const resendVerification = useAuthStore((s) => s.resendVerification)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    await resendVerification()
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  const handleRefresh = () => {
    // Reload the page to re-check emailVerified from Supabase
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-lg text-center">
        <div className="flex flex-col items-center gap-2">
          <TreePine className="h-10 w-10 text-primary" />
          <MailCheck className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification email to <strong>{user?.email}</strong>.
            Click the link in the email to verify your account.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRefresh} className="w-full">
            I've verified my email
          </Button>
          <Button variant="outline" onClick={handleResend} className="w-full" disabled={resent}>
            {resent ? 'Email sent!' : 'Resend verification email'}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
