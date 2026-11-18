
import { lazy, Suspense, useEffect, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { History, Mic, Moon, Sun } from 'lucide-react'

import RecorderPanel from '@/features/meeting/components/RecorderPanel'
import ErrorBoundary from '@/shared/components/ErrorBoundary'

const MeetingsPage = lazy(
  () => import('@/features/meeting/pages/MeetingsPage')
)

const MeetingDetailPage = lazy(
  () => import('@/features/meeting/pages/MeetingDetailPage')
)

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
    isActive
      ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-900/20'
      : 'text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:text-slate-300 dark:hover:bg-violet-950/60 dark:hover:text-fuchsia-300'
  }`

function AppRoutes() {
  const location = useLocation()

  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense
        fallback={
          <p className="text-sm text-slate-500 dark:text-violet-300">
            Loading page...
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<RecorderPanel />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('sarthi-theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'

    localStorage.setItem(
      'sarthi-theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#08091A] dark:text-[#FDF4FF]">

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-violet-900/40 dark:bg-[#10172B]/95">

          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">

            {/* Brand */}
            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/20">
                <Mic size={23} strokeWidth={2.5} />
              </div>

              <div className="min-w-0">
                <h1 className="bg-gradient-to-r from-fuchsia-500 to-violet-500 bg-clip-text text-xl font-extrabold leading-tight tracking-tight text-transparent sm:text-2xl">
                  MeetMind AI
                </h1>

                <p className="text-[11px] text-slate-500 dark:text-violet-200/80 sm:text-sm">
                  Your AI Meeting Assistant
                </p>
              </div>
            </div>

            {/* Navigation and Theme */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">

              <nav className="flex items-center gap-1 sm:gap-2">

                <NavLink to="/" end className={navClass}>
                  <Mic size={18} />
                  <span>Record</span>
                </NavLink>

                <NavLink to="/meetings" className={navClass}>
                  <History size={18} />
                  <span>Meetings</span>
                </NavLink>

              </nav>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                aria-label={
                  darkMode
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                title={darkMode ? 'Light mode' : 'Dark mode'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all duration-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 hover:text-fuchsia-600 dark:border-violet-800/60 dark:text-violet-200 dark:hover:border-fuchsia-500 dark:hover:bg-violet-950/60 dark:hover:text-fuchsia-300 sm:h-11 sm:w-11"
              >
                {darkMode ? (
                  <Sun size={21} />
                ) : (
                  <Moon size={21} />
                )}
              </button>

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-4 py-6 transition-colors duration-300 sm:px-6 sm:py-8">
          <AppRoutes />
        </main>

      </div>
    </BrowserRouter>
  )
}
