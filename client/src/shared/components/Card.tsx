
import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function Card({
  title,
  description,
  action,
  children,
  className = '',
}: CardProps) {
  return (
    <section
      className={`
        rounded-2xl
        border border-fuchsia-200/80
        bg-white
        p-5 sm:p-6
        text-[#2D1932]
        shadow-sm
        transition-all duration-300

        dark:border-violet-800/50
        dark:bg-[#171329]
        dark:text-[#FDF4FF]
        dark:shadow-lg
        dark:shadow-black/20

        ${className}
      `}
    >
      {(title || description || action) && (
        <header className="mb-5 flex items-start justify-between gap-4">

          <div className="min-w-0">
            {title && (
              <h2 className="text-lg font-bold tracking-tight text-[#2D1932] dark:text-[#FDF4FF]">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1.5 text-sm leading-relaxed text-[#78647D] dark:text-violet-200/80">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}

        </header>
      )}

      {children}
    </section>
  )
}
