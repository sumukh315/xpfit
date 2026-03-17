import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import XPBar from './XPBar'
import PixelCharacter from './PixelCharacter'

const navItems = [
  { path: '/dashboard',   label: 'Home',    icon: '⌂' },
  { path: '/workout/new', label: 'Workout', icon: '+' },
  { path: '/logs',        label: 'Logs',    icon: '≡' },
  { path: '/shop',        label: 'Shop',    icon: '✦' },
  { path: '/social',      label: 'Friends', icon: '♦' },
  { path: '/profile',     label: 'Profile', icon: '◉' },
]

export default function Navbar() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const popupRef = useRef(null)

  useEffect(() => {
    if (profile) fetchRequests()
  }, [profile])

  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setShowRequests(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchRequests() {
    try { setRequests(await api.getFriendRequests()) } catch (_) {}
  }

  async function acceptRequest(id) {
    try { await api.acceptFriendRequest(id); fetchRequests() } catch (_) {}
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const charOptions = profile?.character || { gender: 'male', charClass: 'warrior' }

  return (
    <>
      {/* ── Desktop / tablet top nav ── */}
      <nav className="pixel-card border-b border-sky-900/30 px-4 py-3 sticky top-0 z-50 rounded-none"
        style={{ background: 'rgba(5,10,20,0.75)', backdropFilter: 'blur(20px)', borderRadius: 0 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <Link to="/dashboard" className="fantasy-title no-underline" style={{ fontSize: '20px' }}>
            <span style={{ color: '#6ab04c' }}>XP</span><span style={{ color: '#e63946' }}>FIT</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm no-underline ${
                  location.pathname === item.path
                    ? 'bg-sky-900/50 text-sky-300 border border-sky-700/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Friend requests */}
            <div className="relative" ref={popupRef}>
              <button onClick={() => setShowRequests(v => !v)}
                className="relative text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 text-sm font-medium">
                Requests
                {requests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    {requests.length}
                  </span>
                )}
              </button>
              {showRequests && (
                <div className="absolute right-0 top-full mt-2 w-64 pixel-card z-50 p-3" style={{ background: 'rgba(5,10,20,0.95)' }}>
                  <p className="font-semibold text-yellow-400 mb-3 text-sm">Friend Requests</p>
                  {requests.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {requests.map(u => (
                        <div key={u.id} className="flex items-center justify-between glass-row p-2">
                          <Link to="/social" onClick={() => setShowRequests(false)}
                            className="text-white text-sm hover:text-sky-300 no-underline">{u.username}</Link>
                          <button onClick={() => acceptRequest(u.id)}
                            className="pixel-btn bg-green-800 border-green-600 text-white px-3 py-1 text-xs">
                            Accept
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* XP bar — desktop only */}
            <div className="hidden lg:flex flex-col items-end gap-1 w-36">
              <XPBar totalXP={profile?.total_xp || 0} />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-yellow-400 font-semibold text-sm">{profile?.points || 0} pts</span>
              <PixelCharacter options={charOptions} scale={0.3} />
            </div>

            <button onClick={handleLogout}
              className="hidden md:block text-gray-500 hover:text-red-400 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5">
              Exit
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'rgba(3,8,18,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(103,232,249,0.12)' }}>
        <div className="flex">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-3 no-underline transition-all relative"
                style={{ minHeight: '56px' }}>
                <span style={{ fontSize: '16px', lineHeight: 1, color: active ? '#67e8f9' : '#4b5563' }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '12px', marginTop: '3px', color: active ? '#67e8f9' : '#4b5563', fontFamily: 'Outfit', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
                {active && (
                  <div style={{ position: 'absolute', bottom: 0, width: '24px', height: '2px', background: '#67e8f9', borderRadius: '999px' }} />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
