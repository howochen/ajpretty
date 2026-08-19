import { useState } from 'react'
import { LockKeyhole, UserPlus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/merchant'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegistering) {
        if (password !== passwordConfirmation) {
          setError('兩次輸入的密碼不一致。')
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: 'admin', tenant_subdomain: 'default' }
          }
        })

        if (signUpError) throw signUpError

        if (data.session && data.user) {
          onLogin(data.user)
          navigate(redirectTo, { replace: true })
        } else {
          setError('註冊成功，請先至信箱完成驗證，再回來登入。')
          setIsRegistering(false)
        }
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      onLogin(data.user)
      navigate(redirectTo, { replace: true })
    } catch (authError) {
      setError(authError.message || '登入或註冊失敗，請稍後再試。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <section className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            {isRegistering ? <UserPlus size={24} /> : <LockKeyhole size={24} />}
          </div>
          <h1 className="text-2xl font-bold">{isRegistering ? '註冊管理者會員' : '管理者登入'}</h1>
          <p className="text-gray-600 mt-2">{isRegistering ? '註冊後即可登入管理預約資料。' : '登入後即可查看與管理預約資料。'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              className="input-field"
              autoComplete="email"
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
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </div>
          {isRegistering && (
            <div>
              <label htmlFor="admin-password-confirmation" className="block text-sm font-medium text-gray-700 mb-2">確認密碼</label>
              <input
                id="admin-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => {
                  setPasswordConfirmation(event.target.value)
                  setError('')
                }}
                className="input-field"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '處理中...' : isRegistering ? '註冊管理者會員' : '登入預約管理'}
          </button>
        </form>

        <button
          type="button"
          className="w-full mt-4 text-primary hover:text-accent"
          onClick={() => {
            setIsRegistering(!isRegistering)
            setError('')
          }}
        >
          {isRegistering ? '已有帳號？返回登入' : '建立新的管理者會員'}
        </button>
      </section>
    </main>
  )
}
