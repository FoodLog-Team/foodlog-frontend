import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/lib/authContext'
import { Logo } from '../../../shared/components/Logo'

const UPCOMING_SECTIONS = [
  { name: 'Dashboard', description: 'Your daily calorie and macro balance.' },
  { name: 'Log a meal', description: 'Snap a photo and let AI estimate what is on the plate.' },
  { name: 'History', description: 'Browse and edit everything you have logged.' },
  { name: 'Profile', description: 'Your details and daily nutrition targets.' },
]

export function HomePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <header className="shell__header">
        <Logo />
        <nav className="shell__nav" aria-label="Main">
          <ul>
            {UPCOMING_SECTIONS.map((section) => (
              <li key={section.name}>
                <span className="nav-placeholder" aria-disabled="true">
                  {section.name}
                  <span className="badge">Soon</span>
                </span>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="button button--ghost"
          onClick={handleLogout}
          disabled={signingOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      <main className="shell__main">
        <section className="welcome" aria-labelledby="welcome-title">
          <p className="status-pill" role="status">
            <span className="status-pill__dot" aria-hidden="true" />
            You&apos;re signed in
          </p>
          <h1 id="welcome-title" className="welcome__title">
            Welcome to FoodLog
          </h1>
          <p className="welcome__lead">
            Your account is ready. Meal logging and nutrition tracking are on the way — here is
            what&apos;s coming next.
          </p>
        </section>

        <section aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="section-title">
            Coming soon
          </h2>
          <ul className="upcoming">
            {UPCOMING_SECTIONS.map((section) => (
              <li key={section.name} className="upcoming__item">
                <h3 className="upcoming__name">{section.name}</h3>
                <p className="upcoming__description">{section.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
