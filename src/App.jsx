import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import Progress from './pages/Progress'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Social from './pages/Social'
import Profile from './pages/Profile'
import StylePreview from './pages/StylePreview'
import ColorPreview from './pages/ColorPreview'
import FontPreview from './pages/FontPreview'
import WorkoutLogs from './pages/WorkoutLogs'
import Shop from './pages/Shop'
import BgPreview from './pages/BgPreview'

function PlexusBg() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const N = 26
    const SPEED = 0.3
    const MAXD = 240
    const MAXD2 = MAXD * MAXD
    const COLORS = [
      '#67e8f9','#38bdf8','#67e8f9','#38bdf8','#a78bfa','#67e8f9',
      '#38bdf8','#e2e8f0','#67e8f9','#38bdf8','#e63946','#67e8f9',
      '#c084fc','#38bdf8','#67e8f9','#38bdf8','#f472b6','#38bdf8',
      '#67e8f9','#a78bfa','#38bdf8','#67e8f9','#38bdf8','#67e8f9',
      '#38bdf8','#c084fc',
    ]
    const SIZES = COLORS.map((_, i) => i % 9 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5)
    let W, H, pts, raf

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED * 2,
        vy: (Math.random() - 0.5) * SPEED * 2,
      }))
    }

    function frame() {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < -20) p.vx = Math.abs(p.vx)
        if (p.x > W + 20) p.vx = -Math.abs(p.vx)
        if (p.y < -20) p.vy = Math.abs(p.vy)
        if (p.y > H + 20) p.vy = -Math.abs(p.vy)
      }
      // triangles (behind lines)
      for (let i = 0; i < N - 2; i++) {
        for (let j = i + 1; j < N - 1; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          if (dx * dx + dy * dy > MAXD2) continue
          for (let k = j + 1; k < N; k++) {
            const dx2 = pts[i].x - pts[k].x, dy2 = pts[i].y - pts[k].y
            if (dx2 * dx2 + dy2 * dy2 > MAXD2) continue
            const dx3 = pts[j].x - pts[k].x, dy3 = pts[j].y - pts[k].y
            if (dx3 * dx3 + dy3 * dy3 > MAXD2) continue
            const d1 = Math.sqrt(dx * dx + dy * dy)
            const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
            const d3 = Math.sqrt(dx3 * dx3 + dy3 * dy3)
            const a = (1 - Math.max(d1, d2, d3) / MAXD) * 0.07
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.lineTo(pts[k].x, pts[k].y)
            ctx.closePath()
            ctx.fillStyle = `rgba(56,189,248,${a})`
            ctx.fill()
          }
        }
      }
      // edges
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d2 = dx * dx + dy * dy
          if (d2 > MAXD2) continue
          const d = Math.sqrt(d2)
          const a = (1 - d / MAXD) * 0.6
          ctx.beginPath()
          ctx.moveTo(pts[i].x, pts[i].y)
          ctx.lineTo(pts[j].x, pts[j].y)
          ctx.strokeStyle = `rgba(103,232,249,${a})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        }
      }
      // nodes
      for (let i = 0; i < N; i++) {
        const p = pts[i], r = SIZES[i], col = COLORS[i]
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6)
        g.addColorStop(0, col + '55')
        g.addColorStop(1, col + '00')
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = col; ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }

    resize(); frame()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="pixel-font text-sky-400 animate-pulse" style={{ fontSize: '12px' }}>Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AuthLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 main-content">{children}</main>
    </>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><AuthLayout><Dashboard /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/workout/new" element={
        <ProtectedRoute><AuthLayout><WorkoutLogger /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/workout" element={
        <ProtectedRoute><AuthLayout><WorkoutLogger /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute><AuthLayout><Progress /></AuthLayout></ProtectedRoute>
      } />
<Route path="/social" element={
        <ProtectedRoute><AuthLayout><Social /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/style-preview" element={<StylePreview />} />
      <Route path="/bg-preview" element={<BgPreview />} />
      <Route path="/font-preview" element={<FontPreview />} />
      <Route path="/color-preview" element={<ColorPreview />} />
      <Route path="/profile" element={
        <ProtectedRoute><AuthLayout><Profile /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/logs" element={
        <ProtectedRoute><AuthLayout><WorkoutLogs /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/shop" element={
        <ProtectedRoute><AuthLayout><Shop /></AuthLayout></ProtectedRoute>
      } />
    </Routes>
  )
}

function Footer() {
  return (
    <footer className="text-center py-4 text-gray-700 border-t border-gray-900" style={{ fontSize: '11px' }}>
      Created by 🥝🍒
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Background sits outside the main stacking context so z-index works correctly */}
        <div className="bg-decor" aria-hidden="true">
          <PlexusBg />
        </div>
        <div className="flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex-1">
            <AppRoutes />
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
