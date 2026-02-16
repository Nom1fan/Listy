import { useState, useRef, useEffect, useCallback } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * OTP input with individual digit boxes.
 * Uses a hidden <input autoComplete="one-time-code"> overlaying the visual boxes
 * so mobile browsers can autofill SMS codes directly.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  disabled = false,
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, length);
      onChange(digits);
      if (digits.length === length) {
        onComplete?.(digits);
      }
    },
    [length, onChange, onComplete],
  );

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        position: 'relative',
        display: 'inline-flex',
        gap: 10,
        direction: 'ltr',
        cursor: disabled ? 'default' : 'text',
      }}
    >
      {/* Hidden input captures autofill, paste, and keyboard events */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        disabled={disabled}
        aria-label="קוד אימות"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          zIndex: 1,
          fontSize: 16, // prevents iOS zoom
        }}
      />

      {/* Visual digit boxes */}
      {Array.from({ length }, (_, i) => {
        const isCurrent = focused && value.length === i;
        const isFilled = i < value.length;
        return (
          <div
            key={i}
            style={{
              width: 46,
              height: 54,
              borderRadius: 12,
              border: `2px solid ${
                isCurrent
                  ? 'var(--color-primary)'
                  : isFilled
                    ? 'var(--color-primary-dark)'
                    : '#ddd'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 600,
              background: '#fff',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: isCurrent ? '0 0 0 3px rgba(124, 179, 66, 0.25)' : 'none',
              color: '#1a1a1a',
            }}
          >
            {value[i] || ''}
          </div>
        );
      })}
    </div>
  );
}
