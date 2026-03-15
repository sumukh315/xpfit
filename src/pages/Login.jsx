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
        <h2 className="fantasy-font text-purple-400 mb-8 text-center" style={{ fontSize: '22px' }}>
          Continue Quest
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-purple-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-purple-500 outline-none"
              required
            />
          </div>

          {error && <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pixel-btn bg-purple-700 border-purple-500 text-white py-3 mt-2 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6" style={{ fontSize: '12px' }}>
          New player?{' '}
          <Link to="/signup" className="text-purple-400 hover:text-purple-300">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
