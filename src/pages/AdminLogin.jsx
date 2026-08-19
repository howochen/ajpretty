import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const ADMIN_USERNAME = 'ajwu'
const ADMIN_PASSWORD = 'ajwu123456'

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/merchant'

  const handleSubmit = (event) => {
    event.preventDefault()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onLogin()
      navigate(redirectTo, { replace: true })
      return
    }

    setError('帳號或密碼不正確，請再試一次。')
  }

  return (
    <main className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <section className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <LockKeyhole size={24} />
          </div>
          <h1 className="text-2xl font-bold">管理者登入</h1>
          <p className="text-gray-600 mt-2">登入後即可查看與管理預約資料。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">帳號</label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError('')
              }}
              className="input-field"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              className="input-field"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">登入預約管理</button>
        </form>
      </section>
    </main>
  )
}
