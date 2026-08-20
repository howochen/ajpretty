import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from './config/supabase'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import Courses from './pages/Courses'
import BeautyDiary from './pages/BeautyDiary'
import TenantSettings from './pages/TenantSettings'
import MerchantBookings from './pages/MerchantBookings'
import AdminLogin from './pages/AdminLogin'
import { TenantProvider } from './context/TenantContext'

function ProtectedMerchantRoute({ isAdmin, children }) {
  const location = useLocation()

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

function App() {
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setAuthUser(session?.user || null)
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
      setAuthLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleLogin = (user) => {
    setAuthUser(user)
  }

  const isAdmin = Boolean(authUser)

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <TenantProvider>
        <div className="min-h-screen">
          <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
          {authLoading ? <div className="min-h-screen bg-secondary flex items-center justify-center">載入中...</div> : <Routes>
          <Route path="/" element={<Home isAdmin={isAdmin} />} />
          <Route path="/booking" element={<Booking isAdmin={isAdmin} />} />
          <Route path="/my-bookings" element={<MyBookings isAdmin={isAdmin} />} />
          <Route path="/courses" element={<Courses isAdmin={isAdmin} />} />
          <Route path="/beauty-diary" element={<BeautyDiary isAdmin={isAdmin} />} />
          <Route path="/settings" element={<ProtectedMerchantRoute isAdmin={isAdmin}><TenantSettings /></ProtectedMerchantRoute>} />
          <Route path="/admin/login" element={isAdmin ? <Navigate to="/merchant" replace /> : <AdminLogin onLogin={handleLogin} />} />
          <Route path="/merchant" element={<ProtectedMerchantRoute isAdmin={isAdmin}><MerchantBookings /></ProtectedMerchantRoute>} />
          </Routes>}
        </div>
      </TenantProvider>
    </Router>
  )
}

export default App
