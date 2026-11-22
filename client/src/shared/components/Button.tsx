
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/20 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-900/30 focus-visible:outline-violet-500 active:scale-[0.98] dark:from-violet-600 dark:to-indigo-600 dark:hover:from-violet-500 dark:hover:to-indigo-500',

  secondary:
    'border border-violet-200 bg-violet-50 text-[#2D1932] hover:border-violet-400 hover:bg-violet-100 focus-visible:outline-violet-400 dark:border-indigo-800/60 dark:bg-[#24172F] dark:text-[#FDF4FF] dark:hover:border-violet-500 dark:hover:bg-[#352044] dark:focus-visible:outline-violet-400',

  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md hover:from-red-500 hover:to-rose-500 focus-visible:outline-red-500 active:scale-[0.98]',

  ghost:
    'text-[#78647D] hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-violet-400 dark:text-indigo-200 dark:hover:bg-indigo-950/60 dark:hover:text-violet-300 dark:focus-visible:outline-violet-400',
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
