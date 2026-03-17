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
