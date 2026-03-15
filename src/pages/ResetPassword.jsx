import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    setError('')
    try {
      await api.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="pixel-card p-8 w-full max-w-md text-center">
        <p className="text-red-400 mb-4">Invalid reset link.</p>
        <Link to="/login" className="text-sky-400 hover:text-sky-300" style={{ fontSize: '12px' }}>Back to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="pixel-card p-8 w-full max-w-md">
        <h2 className="fantasy-font text-sky-400 mb-2 text-center" style={{ fontSize: '22px' }}>
          Reset Password
        </h2>
        {done ? (
          <p className="text-green-400 text-center mt-6" style={{ fontSize: '13px' }}>
            Password updated! Redirecting to login...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
            <div>
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>NEW PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none" />
            </div>
            <div>
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>CONFIRM PASSWORD</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none" />
            </div>
            {error && <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="pixel-btn bg-sky-700 border-sky-500 text-white py-3 mt-2 disabled:opacity-50">
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
