import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('xpfit_token')
    if (token) {
      api.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('xpfit_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const { token, user } = await api.login({ email, password })
    localStorage.setItem('xpfit_token', token)
    setUser(user)
    return user
  }

  async function signup(email, password, username, character, fitnessProfile, unlockedClasses) {
    const { token, user } = await api.signup({ email, password, username, character, fitnessProfile, unlockedClasses })
    localStorage.setItem('xpfit_token', token)
    setUser(user)
    return user
  }

  function logout() {
    localStorage.removeItem('xpfit_token')
    setUser(null)
  }

  async function refreshProfile() {
    const u = await api.me()
    setUser(u)
  }

  // Keep 'profile' alias so existing components work unchanged
  return (
    <AuthContext.Provider value={{ user, profile: user, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
