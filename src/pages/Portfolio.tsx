type Entry = {
  title: string
  description: string
  tags: string[]
  href: string
}

const ENTRIES: Entry[] = [
  {
    title: 'Housing Dashboard',
    description: 'Build custom fact sheets from Hawaii housing data.',
    tags: ['UHERO', 'Dashboard'],
    href: 'https://analytics.uhero.hawaii.edu/housing/factsheet-builder#top',
  },
  {
    title: 'Maui Recovery Dashboard',
    description: "Tracking housing and jobs through Maui's wildfire recovery.",
    tags: ['UHERO', 'Dashboard'],
    href: 'https://analytics.uhero.hawaii.edu/maui-recovery-dashboard/housing-and-jobs',
  },
  {
    title: 'Rapid Survey Results',
    description: "Results from UHERO's rapid public health surveys.",
    tags: ['UHERO', 'Survey'],
    href: 'https://analytics.uhero.hawaii.edu/health/rapid-survey',
  },
  {
    title: 'MauiWes Results Dashboard',
    description: 'Results from the Maui Wildfire Exposure Study.',
    tags: ['UHERO', 'Dashboard'],
    href: 'https://analytics.uhero.hawaii.edu/maui-wes',
  },
]

// recessed at rest, pops up out of the box on hover
const tileCls =
  'flex flex-col gap-3 rounded-[5px] border-2 border-black bg-[#e9e9e9] p-5 no-underline shadow-nb-recess transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-white hover:shadow-nb-sm'

export function Portfolio() {
  return (
    <div className='grid gap-6 sm:grid-cols-2'>
      {ENTRIES.map(({ title, description, tags, href }) => (
        <a key={href + title} href={href} className={tileCls}>
          <h2 className='font-display text-2xl text-black'>{title} ↗</h2>
          <p className='grow text-sm leading-relaxed text-black'>{description}</p>
          <div className='flex flex-wrap gap-2'>
            {tags.map(tag => (
              <span key={tag} className='rounded-[5px] border-2 border-black bg-mustard px-2 py-0.5 font-semi text-xs text-black'>
                {tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  )
}
