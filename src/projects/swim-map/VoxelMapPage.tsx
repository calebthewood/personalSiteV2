import { useLayoutEffect } from 'react'
import { FiberCanvas } from './fiber'

/**
 * Full-bleed route for the map. The map itself is untouched — this wrapper
 * only swaps the body theme and title; navigating back is the browser's job.
 */
export default function VoxelMapPage() {
  useLayoutEffect(() => {
    document.body.classList.add('map-theme')
    const prev = document.title
    document.title = 'Open Water Replay — Hawaii open water races'
    return () => {
      document.body.classList.remove('map-theme')
      document.title = prev
    }
  }, [])

  return <FiberCanvas />
}
