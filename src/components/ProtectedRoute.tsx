import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function ProtectedRoute() {
  const location = useLocation()
  const hydrated = useAuthStore((s) => s.hydrated)
  const token = useAuthStore((s) => s.token)

  if (!hydrated) return <div className="min-h-screen bg-zinc-950 text-zinc-100" />
  if (!token) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}

