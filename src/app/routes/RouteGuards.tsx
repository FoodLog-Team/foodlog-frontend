import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/lib/authContext'
import { Logo } from '../../shared/components/Logo'

/** Only for signed-in users; everyone else is sent to /login (and back afterwards). */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'restoring') return <SessionCheck />
  if (status === 'unavailable') return <SessionUnavailable />
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

/** Login/registration pages; signed-in users go straight to the app. */
export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'restoring') return <SessionCheck />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}

function SessionCheck() {
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <Logo />
      <span className="spinner spinner--large" aria-hidden="true" />
      <span className="visually-hidden">Checking your session…</span>
    </div>
  )
}

function SessionUnavailable() {
  const { retryRestore } = useAuth()
  return (
    <div className="center-screen">
      <Logo />
      <div className="alert alert--error" role="alert">
        We couldn&apos;t reach FoodLog to check your session. Please try again.
      </div>
      <button type="button" className="button button--primary" onClick={retryRestore}>
        Try again
      </button>
    </div>
  )
}
