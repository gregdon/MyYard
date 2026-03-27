import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { GlobalDialogs } from '@/components/layout/GlobalDialogs'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/components/auth/LoginPage'
import { RegisterPage } from '@/components/auth/RegisterPage'
import { VerifyEmailPage } from '@/components/auth/VerifyEmailPage'
import { EditorPage } from '@/components/pages/EditorPage'
import { useAuthStore } from '@/store/authStore'
import { useTemplateStore } from '@/store/templateStore'

function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  // Load templates when user authenticates
  useEffect(() => {
    loadTemplates(user?.id)
  }, [user?.id, loadTemplates])

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
        <GlobalDialogs />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/editor" replace />} />
            <Route path="/editor/:id?" element={<EditorPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
