import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: ReactNode
  /** Rendered inside the input wrapper, after the input (e.g. a visibility toggle). */
  trailing?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, trailing, className, ...inputProps },
  ref,
) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={['field', error ? 'field--invalid' : '', className ?? ''].join(' ').trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        <input
          ref={ref}
          id={id}
          className="field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {trailing}
      </div>
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
      {hint && (
        <div className="field__hint" id={hintId}>
          {hint}
        </div>
      )}
    </div>
  )
})
