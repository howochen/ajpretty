import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar({ isAdmin, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    setIsOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary">
            AJ創美學苑
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/ajpretty" className="text-gray-700 hover:text-primary transition-colors">
              首頁
            </Link>
            <Link to="/booking" className="text-gray-700 hover:text-primary transition-colors">
              線上預約
            </Link>
            <Link to="/my-bookings" className="text-gray-700 hover:text-primary transition-colors">
              我的預約
            </Link>
            <Link to="/courses" className="text-gray-700 hover:text-primary transition-colors">
              課程報名
            </Link>
            <Link to="/beauty-diary" className="text-gray-700 hover:text-primary transition-colors">
              變美日誌
            </Link>
            {isAdmin ? (
              <Link to="/merchant" className="text-gray-700 hover:text-primary transition-colors">預約管理</Link>
            ) : (
              <Link to="/admin/login" className="text-gray-700 hover:text-primary transition-colors">管理者登入</Link>
            )}
            <Link to="/settings" className="text-gray-700 hover:text-primary transition-colors">
              設定
            </Link>
          </div>

          <div className="hidden md:flex space-x-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              LINE
            </a>
            {isAdmin && (
              <button onClick={handleLogout} className="text-gray-700 hover:text-primary transition-colors">
                登出管理者
              </button>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            <Link to="/" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              首頁
            </Link>
            <Link to="/booking" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              線上預約
            </Link>
            <Link to="/my-bookings" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              我的預約
            </Link>
            <Link to="/courses" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              課程報名
            </Link>
            <Link to="/beauty-diary" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              變美日誌
            </Link>
            {isAdmin ? (
              <Link to="/merchant" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>預約管理</Link>
            ) : (
              <Link to="/admin/login" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>管理者登入</Link>
            )}
            <Link to="/settings" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              設定
            </Link>
            <div className="pt-3 border-t space-y-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="block text-gray-700 hover:text-primary">
                Instagram
              </a>
              <a href="https://line.me" target="_blank" rel="noopener noreferrer" className="block text-gray-700 hover:text-primary">
                LINE
              </a>
              {isAdmin && (
                <button onClick={handleLogout} className="block text-gray-700 hover:text-primary">登出管理者</button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
