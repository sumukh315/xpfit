import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="pixel-card p-8 w-full max-w-md">
        <h2 className="fantasy-font text-sky-400 mb-2 text-center" style={{ fontSize: '22px' }}>
          Forgot Password
        </h2>
        {sent ? (
          <div className="text-center mt-6">
            <p className="text-green-400 mb-4" style={{ fontSize: '13px' }}>
              If that email is registered, a reset link has been sent.
            </p>
            <Link to="/login" className="text-sky-400 hover:text-sky-300" style={{ fontSize: '12px' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
            <div>
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '12px' }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="glass-input w-full" />
            </div>
            {error && <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="pixel-btn bg-sky-700 border-sky-500 text-white py-3 mt-2 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-gray-500" style={{ fontSize: '12px' }}>
              <Link to="/login" className="text-sky-400 hover:text-sky-300">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
