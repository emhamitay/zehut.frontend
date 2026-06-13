import type { ComponentProps } from 'react'

type IconProps = ComponentProps<'svg'>

export function UploadIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  )
}

export function SpinnerIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function WarningIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18.2A2.25 2.25 0 0 0 3.76 21h16.48a2.25 2.25 0 0 0 1.94-2.8L13.71 3.86a2.01 2.01 0 0 0-3.42 0Z"
      />
    </svg>
  )
}

export function HomeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d="m3 11 9-8 9 8M5.25 9.75V21h13.5V9.75"
      />
    </svg>
  )
}

export function UsersIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 1c-2.761 0-5 1.79-5 4v1h10v-1c0-2.21-2.239-4-5-4Zm-8 2c-3.314 0-6 2.015-6 4.5V21h7v-1.5C9 17.015 8.607 15.901 8 15Z"
      />
    </svg>
  )
}

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
      />
    </svg>
  )
}

export function ContactSheetIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect x="4" y="3" width="16" height="18" rx="2.5" strokeWidth={1.6} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M8 8h8M8 12h8M8 16h5"
      />
    </svg>
  )
}

export function IdCardIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" strokeWidth={1.6} />
      <circle cx="8" cy="12" r="2" strokeWidth={1.6} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M13 10h5M13 14h5"
      />
    </svg>
  )
}

export function SparkIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Zm7 10 0.8 2.2L22 15l-2.2.8L19 18l-.8-2.2L16 15l2.2-.8L19 12ZM5 14l1 2.7L8.7 18 6 19l-1 2.7L4 19l-2.7-1L4 16.7 5 14Z"
      />
    </svg>
  )
}