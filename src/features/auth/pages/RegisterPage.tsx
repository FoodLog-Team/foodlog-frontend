import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { describeError, isApiError } from '../../../shared/api/apiError'
import { Alert } from '../../../shared/components/Alert'
import { TextField } from '../../../shared/components/TextField'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { useAuth } from '../lib/authContext'
import {
  PASSWORD_RULES,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../lib/validation'

type Field = 'email' | 'password' | 'confirmPassword'
type FieldErrors = Partial<Record<Field, string>>

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState<Record<Field, string>>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>()
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  function focusField(field: Field) {
    const refs = { email: emailRef, password: passwordRef, confirmPassword: confirmPasswordRef }
    refs[field].current?.focus()
  }

  const clientErrors: FieldErrors = {
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validatePasswordConfirmation(values.password, values.confirmPassword),
  }
  const show = (field: Field) =>
    serverErrors[field] ?? (submitted || touched[field] ? clientErrors[field] : undefined)

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (serverErrors[field]) setServerErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pendingRef.current) return
    setSubmitted(true)
    setFormError(undefined)
    setServerErrors({})

    const firstInvalid = (['email', 'password', 'confirmPassword'] as const).find(
      (field) => clientErrors[field],
    )
    if (firstInvalid) return focusField(firstInvalid)

    pendingRef.current = true
    setPending(true)
    try {
      await register({ email: values.email.trim(), password: values.password })
      navigate('/', { replace: true })
    } catch (error) {
      handleError(error)
      pendingRef.current = false
      setPending(false)
    }
  }

  function handleError(error: unknown) {
    if (isApiError(error) && error.kind === 'http') {
      if (error.status === 409) {
        setServerErrors({ email: 'An account with this email already exists. Try signing in instead.' })
        focusField('email')
        return
      }
      if (error.status === 400) {
        const next: FieldErrors = {
          email: error.fieldErrors.email?.[0],
          password: error.fieldErrors.password?.[0],
        }
        if (next.email || next.password) {
          setServerErrors(next)
          focusField(next.email ? 'email' : 'password')
        } else {
          setFormError('Please check your details and try again.')
        }
        return
      }
    }
    setFormError(describeError(error))
  }


  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking what you eat in a few seconds."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
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
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={show('email')}
          required
        />
        <PasswordField
          ref={passwordRef}
          label="Password"
          name="new-password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => update('password', e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={show('password')}
          required
          hint={
            <ul className="rules" aria-label="Password requirements">
              {PASSWORD_RULES.map((rule) => {
                const met = values.password.length > 0 && rule.test(values.password)
                return (
                  <li key={rule.id} className={met ? 'rules__item rules__item--met' : 'rules__item'}>
                    <span className="rules__icon" aria-hidden="true">
                      {met ? '✓' : '•'}
                    </span>
                    {rule.label}
                    <span className="visually-hidden">{met ? ' (met)' : ' (not met)'}</span>
                  </li>
                )
              })}
            </ul>
          }
        />
        <PasswordField
          ref={confirmPasswordRef}
          label="Confirm password"
          name="confirm-password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          error={show('confirmPassword')}
          required
        />
        <button className="button button--primary button--block" type="submit" disabled={pending}>
          {pending && <span className="spinner" aria-hidden="true" />}
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
