import { forwardRef, useState } from 'react'
import { TextField, type TextFieldProps } from '../../../shared/components/TextField'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)

    return (
      <TextField
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        spellCheck={false}
        autoCapitalize="none"
        trailing={
          <button
            type="button"
            className="field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? `Hide ${props.label.toLowerCase()}` : `Show ${props.label.toLowerCase()}`}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        }
      />
    )
  },
)
