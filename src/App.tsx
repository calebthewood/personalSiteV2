import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './pages/SiteLayout'
import { Home } from './pages/Home'
import { Projects } from './pages/Projects'
import { Portfolio } from './pages/Portfolio'
import { Contact } from './pages/Contact'

// each project is its own chunk: three.js, the word list, etc. stay out of the
// main bundle
const VoxelMapPage = lazy(() => import('./projects/voxel-map/VoxelMapPage'))
const Whittle = lazy(() => import('./projects/whittle/Whittle'))
const GameOfLife = lazy(() => import('./projects/game-of-life/GameOfLife'))
const AegeanCalculator = lazy(() => import('./projects/aegean-calculator/AegeanCalculator'))

function WidgetFallback() {
  return <div className='py-10 text-center font-semi'>Loading…</div>
}

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/portfolio' element={<Portfolio />} />
        <Route path='/contact' element={<Contact />} />
        <Route
          path='/projects/whittle'
          element={<Suspense fallback={<WidgetFallback />}><Whittle /></Suspense>}
        />
        <Route
          path='/projects/game-of-life'
          element={<Suspense fallback={<WidgetFallback />}><GameOfLife /></Suspense>}
        />
        <Route
          path='/projects/aegean-calculator'
          element={<Suspense fallback={<WidgetFallback />}><AegeanCalculator /></Suspense>}
        />
      </Route>
      <Route
        path='/projects/voxel-map'
        element={
          <Suspense
            fallback={
              <div className='grid h-full place-items-center bg-slate-950 text-sm text-slate-400'>
                Loading the bay…
              </div>
            }
          >
            <VoxelMapPage />
          </Suspense>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
