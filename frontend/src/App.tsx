import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/auth'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import IdentityPage from '@/pages/IdentityPage'
import AttributesPage from '@/pages/AttributesPage'
import VerificationsPage from '@/pages/VerificationsPage'
import DisclosurePage from '@/pages/DisclosurePage'
import SettingsPage from '@/pages/SettingsPage'

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/identity" element={<Layout><IdentityPage /></Layout>} />
        <Route path="/attributes" element={<Layout><AttributesPage /></Layout>} />
        <Route path="/verifications" element={<Layout><VerificationsPage /></Layout>} />
        <Route path="/disclosure" element={<Layout><DisclosurePage /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
