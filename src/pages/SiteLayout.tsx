import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'

// three.js is heavy — keep it out of the entry chunk
const BoxCanvas = lazy(() =>
  import('../components/BoxCanvas').then(m => ({ default: m.BoxCanvas })),
)

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/contact', label: 'Contact' },
]

type PageMeta = { title: string; back?: boolean }

const PAGES: Record<string, PageMeta> = {
  '/': { title: 'Welcome' },
  '/projects': { title: 'Projects' },
  '/portfolio': { title: 'Portfolio' },
  '/contact': { title: 'Contact' },
  '/projects/whittle': { title: 'Whittle', back: true },
  '/projects/game-of-life': { title: "Conway's Game of Life", back: true },
  '/projects/aegean-calculator': { title: 'Aegean Calculator', back: true },
}

const REST_SHADOW = '9px 9px 0 0 #272727'
const PRESSED_SHADOW = '2px 2px 0 0 #272727'

/** Captures the outlet at mount so the exiting page keeps its own content
 * while the router has already moved on to the next location. */
function FrozenRoute() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

/**
 * Mustard neo-brutalist frame shared by every page except the voxel map.
 *
 * One white box persists across navigation: on a route change it depresses
 * (like the buttons), the old content fades out fast, the box animates to the
 * new content's size while it fades in, then the box pops back up.
 */
export function SiteLayout() {
  const { pathname } = useLocation()
  const meta = PAGES[pathname] ?? PAGES['/']
  const isHome = pathname === '/'
  const [pressed, setPressed] = useState(false)
  const prevPath = useRef(pathname)

  useEffect(() => {
    document.title = isHome ? 'Caleb Wood' : `${meta.title} — Caleb Wood`
  }, [isHome, meta.title])

  // depress the box as soon as the route changes; it pops back up once the
  // new content has faded in (onAnimationComplete below)
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      setPressed(true)
    }
  }, [pathname])

  return (
    <div className='min-h-full px-5 py-8 sm:py-24'>
      <div className='mx-auto flex w-full max-w-[1000px] flex-col gap-8'>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={meta.title}
            className='flex items-baseline justify-between gap-4'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <PageHeading>{meta.title}</PageHeading>
            {meta.back && (
              <Link
                to='/projects'
                className='shrink-0 font-semi text-black underline-offset-2 hover:underline'
              >
                ← All projects
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={isHome ? 'grid items-start gap-12 sm:grid-cols-9' : ''}>
          <motion.div
            layout
            className={`nb-card relative overflow-hidden ${isHome ? 'sm:col-span-5' : ''}`}
            animate={{
              x: pressed ? 6 : 0,
              y: pressed ? 6 : 0,
              boxShadow: pressed ? PRESSED_SHADOW : REST_SHADOW,
            }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
              layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
            }}
          >
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.div
                key={pathname}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.2, delay: 0.15 } },
                  exit: { opacity: 0, transition: { duration: 0.1 } },
                }}
                initial='hidden'
                animate='visible'
                exit='exit'
                onAnimationComplete={definition => {
                  if (definition === 'visible') setPressed(false)
                }}
              >
                <FrozenRoute />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {isHome && (
            <motion.div
              className='hidden h-[150px] sm:col-span-4 sm:block'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <Suspense fallback={null}>
                <BoxCanvas />
              </Suspense>
            </motion.div>
          )}
        </div>

        <nav className='grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-12'>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => `nb-btn ${isActive ? 'nb-btn-pressed' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
