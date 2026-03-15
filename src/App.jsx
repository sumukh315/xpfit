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
import WorkoutImport from './pages/WorkoutImport'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="pixel-font text-purple-400 animate-pulse" style={{ fontSize: '12px' }}>Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AuthLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
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
      <Route path="/profile" element={
        <ProtectedRoute><AuthLayout><Profile /></AuthLayout></ProtectedRoute>
      } />
      <Route path="/import" element={
        <ProtectedRoute><AuthLayout><WorkoutImport /></AuthLayout></ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
