import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="pixel-card p-8 w-full max-w-md">
        <h2 className="fantasy-font text-sky-400 mb-8 text-center" style={{ fontSize: '22px' }}>
          Continue Quest
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>USERNAME OR EMAIL</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
          <div>
            <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>

          {error && <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>}

          <div className="text-right">
            <Link to="/forgot-password" className="text-gray-500 hover:text-sky-400" style={{ fontSize: '11px' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pixel-btn bg-sky-700 border-sky-500 text-white py-3 mt-2 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6" style={{ fontSize: '12px' }}>
          New player?{' '}
          <Link to="/signup" className="text-sky-400 hover:text-sky-300">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
