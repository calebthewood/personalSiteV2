import { useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiberCanvas } from './fiber'

/**
 * Full-bleed route for the map. The map itself is untouched — this wrapper
 * only swaps the body theme and floats a back link styled like the map's own
 * glass chrome.
 */
export default function VoxelMapPage() {
  useLayoutEffect(() => {
    document.body.classList.add('map-theme')
    const prev = document.title
    document.title = 'Open Water Replay — North Shore Swim Series'
    return () => {
      document.body.classList.remove('map-theme')
      document.title = prev
    }
  }, [])

  return (
    <FiberCanvas
      topLeftAccessory={
        <Link
          to='/projects'
          className='flex h-11 items-center rounded-full border border-white/10 bg-slate-900/70 px-4 text-xs text-slate-300 no-underline shadow-lg shadow-black/30 backdrop-blur-xl transition hover:bg-white/10 hover:text-white animate-fade-in'
        >
          ←
        </Link>
      }
    />
  )
}
