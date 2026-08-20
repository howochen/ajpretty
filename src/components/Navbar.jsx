import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'

export default function Navbar({ isAdmin, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [socialLinks, setSocialLinks] = useState({ instagram: 'https://instagram.com', line: 'https://line.me' })
  const { tenant } = useTenant()
  const content = tenant.site_content
  const navigate = useNavigate()

  useEffect(() => {
    const instagram = tenant.instagram_id?.trim()
    const line = tenant.line_id?.trim()
    setSocialLinks({
      instagram: instagram ? (/^https?:\/\//i.test(instagram) ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`) : 'https://instagram.com',
      line: line ? (/^https?:\/\//i.test(line) ? line : `https://line.me/ti/p/~${line.replace(/^@/, '')}`) : 'https://line.me'
    })
  }, [tenant.instagram_id, tenant.line_id])

  const handleLogout = () => {
    onLogout()
    setIsOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            {tenant.logo_url && <img src={tenant.logo_url} alt="" className="w-9 h-9 rounded-full object-cover" />}
            {tenant.name}
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              {content.nav_home}
            </Link>
            <Link to="/booking" className="text-gray-700 hover:text-primary transition-colors">
              {content.nav_booking}
            </Link>
            <Link to="/my-bookings" className="text-gray-700 hover:text-primary transition-colors">
              {content.nav_my_bookings}
            </Link>
            <Link to="/courses" className="text-gray-700 hover:text-primary transition-colors">
              {content.nav_courses}
            </Link>
            <Link to="/beauty-diary" className="text-gray-700 hover:text-primary transition-colors">
              {content.nav_diary}
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
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <a
              href={socialLinks.line}
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
              {content.nav_home}
            </Link>
            <Link to="/booking" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              {content.nav_booking}
            </Link>
            <Link to="/my-bookings" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              {content.nav_my_bookings}
            </Link>
            <Link to="/courses" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              {content.nav_courses}
            </Link>
            <Link to="/beauty-diary" className="block text-gray-700 hover:text-primary" onClick={() => setIsOpen(false)}>
              {content.nav_diary}
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
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="block text-gray-700 hover:text-primary">
                Instagram
              </a>
              <a href={socialLinks.line} target="_blank" rel="noopener noreferrer" className="block text-gray-700 hover:text-primary">
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
