/**
 * Client-side validation for the auth forms. It mirrors (and never loosens) the backend rules:
 * `@NotBlank @Email` for email, `@StrongPassword @Length(min = 8, max = 32)` for password,
 * where StrongPassword is `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])\S{8,32}$`.
 * The backend remains the final authority.
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 32

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH && p.length <= PASSWORD_MAX_LENGTH,
  },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'One digit', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'One special character', test: (p) => /[\W_]/.test(p) },
  { id: 'spaces', label: 'No spaces', test: (p) => !/\s/.test(p) },
]

export function validateEmail(email: string): string | undefined {
  const value = email.trim()
  if (!value) return 'Enter your email address.'
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address, like name@example.com.'
  return undefined
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Enter a password.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`
  }
  if (/\s/.test(password)) return 'Password must not contain spaces.'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.'
  if (!/\d/.test(password)) return 'Password must include at least one digit.'
  if (!/[\W_]/.test(password)) return 'Password must include at least one special character.'
  return undefined
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return 'Confirm your password.'
  if (password !== confirmation) return 'Passwords do not match.'
  return undefined
}

export function validateRequiredPassword(password: string): string | undefined {
  return password ? undefined : 'Enter your password.'
}
