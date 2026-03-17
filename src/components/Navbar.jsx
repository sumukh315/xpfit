import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import XPBar from './XPBar'
import PixelCharacter from './PixelCharacter'

const navItems = [
  { path: '/dashboard',   label: 'Home',    icon: '⌂' },
  { path: '/workout/new', label: 'Workout', icon: '+' },
  { path: '/progress',    label: 'Stats',   icon: '▲' },
  { path: '/logs',        label: 'Logs',    icon: '≡' },
  { path: '/shop',        label: 'Shop',    icon: '✦' },
  { path: '/social',      label: 'Friends', icon: '⊙' },
  { path: '/profile',     label: 'Profile', icon: '◉' },
]

export default function Navbar() {
  const { profile } = useAuth()
  const location = useLocation()

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
          <div className="hidden md:flex items-center gap-3">
            {/* XP bar */}
            <div className="hidden lg:flex flex-col items-end gap-1 w-36">
              <XPBar totalXP={profile?.total_xp || 0} />
            </div>
            <span className="text-yellow-400 font-semibold text-sm">{profile?.points || 0} pts</span>
            {/* Circular avatar */}
            <Link to="/profile" className="no-underline" style={{ display: 'flex' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                overflow: 'hidden', border: '2px solid rgba(103,232,249,0.3)',
                background: 'rgba(5,10,30,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PixelCharacter options={charOptions} scale={0.22} />
              </div>
            </Link>
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
