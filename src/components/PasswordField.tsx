import { useState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PasswordFieldProps = Omit<ComponentProps<'input'>, 'type'>

export default function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('w-full pe-14', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-1 inset-e-1 my-auto h-7 px-2 text-xs"
      >
        {visible ? 'הסתר' : 'הצג'}
      </Button>
    </div>
  )
}
