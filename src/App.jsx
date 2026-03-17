import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
          <div className="bg-orb bg-orb-4" />
          <div className="bg-orb bg-orb-5" />
          {/* Constellation overlay */}
          <svg className="constellation-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* Lines */}
            {[
              [2,8],[8,14],[14,19],[19,25],[3,9],[9,15],[15,21],[0,5],[5,11],[11,17],[17,23],
              [1,6],[6,13],[13,20],[20,26],[4,10],[10,16],[16,22],[22,27],[7,12],[12,18],[18,24],
              [8,9],[14,15],[19,21],[5,6],[11,13],[17,20],[23,26],[2,3],[25,27],[0,1],[16,17],
            ].map(([a,b],i) => {
              const pts = [
                [8,12],[22,5],[38,18],[55,8],[72,15],[88,22],[15,30],[30,38],[48,32],[62,25],
                [78,35],[92,42],[5,50],[20,55],[35,62],[52,48],[68,58],[82,45],[95,62],[10,70],
                [28,75],[45,68],[60,78],[75,65],[90,72],[18,85],[40,88],[58,80],[72,90],[88,82],
              ]
              const [x1,y1] = pts[a] || [0,0]
              const [x2,y2] = pts[b] || [0,0]
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(103,232,249,1)" strokeWidth="0.15"
                  className={`constellation-line constellation-line-${(i%5)+1}`} />
              )
            })}
            {/* Stars */}
            {[
              [8,12,1.2,'star-a'],[22,5,0.8,'star-b'],[38,18,1.5,'star-c'],[55,8,0.9,'star-d'],
              [72,15,1.1,'star-e'],[88,22,0.7,'star-f'],[15,30,1.3,'star-a'],[30,38,0.8,'star-b'],
              [48,32,1.0,'star-c'],[62,25,1.4,'star-d'],[78,35,0.7,'star-e'],[92,42,1.2,'star-f'],
              [5,50,0.9,'star-a'],[20,55,1.1,'star-b'],[35,62,1.6,'star-c'],[52,48,0.8,'star-d'],
              [68,58,1.0,'star-e'],[82,45,1.3,'star-f'],[95,62,0.7,'star-a'],[10,70,1.1,'star-b'],
              [28,75,0.9,'star-c'],[45,68,1.4,'star-d'],[60,78,0.8,'star-e'],[75,65,1.2,'star-f'],
              [90,72,1.0,'star-a'],[18,85,0.7,'star-b'],[40,88,1.3,'star-c'],[58,80,0.9,'star-d'],
              [72,90,1.1,'star-e'],[88,82,0.8,'star-f'],
            ].map(([x,y,r,cls],i) => (
              <circle key={i} cx={x} cy={y} r={r}
                fill={i%7===0 ? '#a78bfa' : i%5===0 ? '#6ab04c' : i%3===0 ? '#e63946' : '#e2e8f0'}
                className={`constellation-star ${cls}`} />
            ))}
          </svg>
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
