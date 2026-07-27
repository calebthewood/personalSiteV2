import { Link } from 'react-router-dom'

type Project = {
  title: string
  description: string
  tags: string[]
  to: string
}

const PROJECTS: Project[] = [
  {
    title: 'Open Water Replay',
    description:
      'A 3D voxel map of Waimea Bay that replays real North Shore Swim Series races — pick a race, add swimmers, and watch them cross the bay.',
    tags: ['TypeScript', 'Three.js', 'React'],
    to: '/projects/swim-map',
  },
  {
    title: 'Whittle',
    description:
      'A wordle assist app that whittles down a list of potential answers based on your previous guesses.',
    tags: ['JavaScript', 'React'],
    to: '/projects/whittle',
  },
  {
    title: "Conway's Game of Life",
    description:
      "My implementation of Conway's Game of Life in React. It's what's called a 0-player game, or simulation. The fundamental game is based on just 3 rules, and from that all sorts of fascinating patterns may emerge.",
    tags: ['JavaScript', 'React'],
    to: '/projects/game-of-life',
  },
  {
    title: 'Aegean Calculator',
    description:
      'Calculate how much grain you still owe Mykonos with this handy Linear-B calculator.',
    tags: ['JavaScript', 'React'],
    to: '/projects/aegean-calculator',
  },
]

// recessed at rest, pops up out of the box on hover
const tileCls =
  'flex flex-col gap-3 rounded-[5px] border-2 border-black bg-[#e9e9e9] p-5 no-underline shadow-nb-recess transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-white hover:shadow-nb-sm'

export function Projects() {
  return (
    <div className='grid gap-6 sm:grid-cols-2'>
      {PROJECTS.map(p => (
        <Link key={p.to} to={p.to} className={tileCls}>
          <h2 className='font-display text-2xl text-black'>{p.title}</h2>
          <p className='grow text-sm leading-relaxed text-black'>{p.description}</p>
          <div className='flex flex-wrap gap-2'>
            {p.tags.map(tag => (
              <span key={tag} className='rounded-[5px] border-2 border-black bg-mustard px-2 py-0.5 font-semi text-xs text-black'>
                {tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  )
}
