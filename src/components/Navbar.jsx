import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import XPBar from './XPBar'
import PixelCharacter from './PixelCharacter'

const navItems = [
  { path: '/dashboard', label: '🏠', title: 'Home' },
  { path: '/workout/new', label: '💪', title: 'Workout' },
  { path: '/progress', label: '📈', title: 'Progress' },
  { path: '/import', label: '📥', title: 'Import History' },
  { path: '/shop', label: '🛒', title: 'Shop' },
  { path: '/social', label: '👥', title: 'Friends' },
  { path: '/profile', label: '👤', title: 'Profile' },
]

export default function Navbar() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const charOptions = profile?.character || { gender: 'male', charClass: 'warrior' }

  return (
    <nav className="pixel-card border-b-2 border-purple-900/50 px-4 py-3 flex items-center justify-between sticky top-0 z-50" style={{ background: '#0d0d1f' }}>
      <Link to="/dashboard" className="pixel-font text-purple-400 no-underline" style={{ fontSize: '14px' }}>
        XP<span className="text-pink-400">FIT</span>
      </Link>

      <div className="flex gap-1">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} title={item.title}
            className={`px-3 py-2 rounded text-lg transition-colors ${
              location.pathname === item.path ? 'bg-purple-900/60 text-purple-300' : 'hover:bg-purple-900/30 text-gray-400 hover:text-white'
            }`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end gap-1 w-40">
          <XPBar totalXP={profile?.total_xp || 0} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 pixel-font" style={{ fontSize: '9px' }}>🪙{profile?.points || 0}</span>
          <PixelCharacter options={charOptions} scale={0.3} />
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors text-sm px-2 py-1">
          Exit
        </button>
      </div>
    </nav>
  )
}
