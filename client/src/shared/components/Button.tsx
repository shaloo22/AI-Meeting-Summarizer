
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md shadow-fuchsia-900/20 hover:from-fuchsia-500 hover:to-violet-500 hover:shadow-lg hover:shadow-fuchsia-900/30 focus-visible:outline-fuchsia-500 active:scale-[0.98] dark:from-fuchsia-600 dark:to-violet-600 dark:hover:from-fuchsia-500 dark:hover:to-violet-500',

  secondary:
    'border border-fuchsia-200 bg-fuchsia-50 text-[#2D1932] hover:border-fuchsia-400 hover:bg-fuchsia-100 focus-visible:outline-fuchsia-400 dark:border-violet-800/60 dark:bg-[#24172F] dark:text-[#FDF4FF] dark:hover:border-fuchsia-500 dark:hover:bg-[#352044] dark:focus-visible:outline-fuchsia-400',

  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md hover:from-red-500 hover:to-rose-500 focus-visible:outline-red-500 active:scale-[0.98]',

  ghost:
    'text-[#78647D] hover:bg-fuchsia-50 hover:text-fuchsia-700 focus-visible:outline-fuchsia-400 dark:text-violet-200 dark:hover:bg-violet-950/60 dark:hover:text-fuchsia-300 dark:focus-visible:outline-fuchsia-400',
}

export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
