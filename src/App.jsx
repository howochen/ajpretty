import { useState } from 'react'
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import Courses from './pages/Courses'
import BeautyDiary from './pages/BeautyDiary'
import TenantSettings from './pages/TenantSettings'
import MerchantBookings from './pages/MerchantBookings'
import AdminLogin from './pages/AdminLogin'

function ProtectedMerchantRoute({ isAdmin, children }) {
  const location = useLocation()

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

function App() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('isAdmin') === 'true')

  const handleLogin = () => {
    sessionStorage.setItem('isAdmin', 'true')
    setIsAdmin(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin')
    setIsAdmin(false)
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/beauty-diary" element={<BeautyDiary />} />
          <Route path="/settings" element={<TenantSettings />} />
          <Route path="/admin/login" element={isAdmin ? <Navigate to="/merchant" replace /> : <AdminLogin onLogin={handleLogin} />} />
          <Route path="/merchant" element={<ProtectedMerchantRoute isAdmin={isAdmin}><MerchantBookings /></ProtectedMerchantRoute>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
