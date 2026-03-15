import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import XPBar from './XPBar'
import PixelCharacter from './PixelCharacter'

const navItems = [
  { path: '/dashboard', label: 'Home' },
  { path: '/workout/new', label: 'Workout' },
  { path: '/progress', label: 'Progress' },
  { path: '/import', label: 'Import' },
  { path: '/social', label: 'Friends' },
  { path: '/profile', label: 'Profile' },
]

export default function Navbar() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

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
    <nav className="pixel-card border-b-2 border-sky-900/50 px-4 py-3 sticky top-0 z-50" style={{ background: '#0d0d1f' }}>
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="pixel-font text-sky-400 no-underline" style={{ fontSize: '14px' }}>
          XP<span className="text-pink-400">FIT</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`px-3 py-2 pixel-font transition-colors ${
                location.pathname === item.path ? 'bg-sky-900/60 text-sky-300' : 'hover:bg-purple-900/30 text-gray-400 hover:text-white'
              }`} style={{ fontSize: '8px' }}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Friend requests bell */}
          <div className="relative" ref={popupRef}>
            <button onClick={() => setShowRequests(v => !v)}
              className="relative text-gray-400 hover:text-white transition-colors px-2 py-1 pixel-font"
              style={{ fontSize: '8px' }}>
              Requests
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center" style={{ fontSize: '8px' }}>
                  {requests.length}
                </span>
              )}
            </button>
            {showRequests && (
              <div className="absolute right-0 top-full mt-1 w-64 pixel-card z-50 p-3" style={{ background: '#12121e' }}>
                <p className="pixel-font text-yellow-400 mb-3" style={{ fontSize: '9px' }}>Friend Requests</p>
                {requests.length === 0 ? (
                  <p className="text-gray-500 text-xs">No pending requests</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {requests.map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-black/30 border border-gray-800 p-2">
                        <Link to="/social" onClick={() => setShowRequests(false)}
                          className="text-white text-sm hover:text-sky-300">{u.username}</Link>
                        <button onClick={() => acceptRequest(u.id)}
                          className="pixel-btn bg-green-800 border-green-600 text-white px-2 py-1" style={{ fontSize: '7px' }}>
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* XP bar — hidden on mobile */}
          <div className="hidden lg:flex flex-col items-end gap-1 w-36">
            <XPBar totalXP={profile?.total_xp || 0} />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-yellow-400 pixel-font" style={{ fontSize: '9px' }}>{profile?.points || 0} pts</span>
            <PixelCharacter options={charOptions} scale={0.3} />
          </div>

          <button onClick={handleLogout} className="hidden md:block text-gray-500 hover:text-red-400 transition-colors text-sm px-2 py-1">
            Exit
          </button>

          {/* Hamburger — mobile only */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden text-gray-400 hover:text-white px-2 py-1 text-xl">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 border-t border-gray-800 pt-3 flex flex-col gap-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`px-3 py-3 pixel-font transition-colors ${
                location.pathname === item.path ? 'bg-sky-900/60 text-sky-300' : 'text-gray-400'
              }`} style={{ fontSize: '10px' }}>
              {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <PixelCharacter options={charOptions} scale={0.3} />
              <span className="text-yellow-400 pixel-font" style={{ fontSize: '9px' }}>{profile?.points || 0} pts</span>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors text-sm px-2 py-1">
              Exit
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
