import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { describeError, isApiError } from '../../../shared/api/apiError'
import { Alert } from '../../../shared/components/Alert'
import { TextField } from '../../../shared/components/TextField'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { useAuth } from '../lib/authContext'
import { validateEmail, validateRequiredPassword } from '../lib/validation'

interface LoginErrors {
  email?: string
  password?: string
}

const INVALID_CREDENTIALS = 'Incorrect email or password. Please try again.'

export function LoginPage() {
  const { login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const errors: LoginErrors = {
    email: validateEmail(email),
    password: validateRequiredPassword(password),
  }
  const show = (field: keyof LoginErrors) => (submitted || touched[field] ? errors[field] : undefined)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pendingRef.current) return
    setSubmitted(true)
    setFormError(undefined)

    if (errors.email) return emailRef.current?.focus()
    if (errors.password) return passwordRef.current?.focus()

    pendingRef.current = true
    setPending(true)
    try {
      await login({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // 400: the backend also applies its password-strength rule on login, so a
      // malformed password is reported as a validation error rather than 401.
      if (isApiError(error) && error.kind === 'http' && (error.status === 401 || error.status === 400)) {
        setFormError(INVALID_CREDENTIALS)
      } else {
        setFormError(describeError(error))
      }
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to keep logging your meals."
      footer={
        <>
          New to FoodLog? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {sessionExpired && !formError && (
        <Alert tone="info">Your session has ended. Please sign in again.</Alert>
      )}
      {formError && <Alert>{formError}</Alert>}

      <form className="form" onSubmit={handleSubmit} noValidate aria-busy={pending}>
        <TextField
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={show('email')}
          required
        />
        <PasswordField
          ref={passwordRef}
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={show('password')}
          required
        />
        <button className="button button--primary button--block" type="submit" disabled={pending}>
          {pending && <span className="spinner" aria-hidden="true" />}
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
