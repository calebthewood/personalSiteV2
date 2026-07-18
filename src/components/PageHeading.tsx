import type { ReactNode } from 'react'

/** Big display heading that sits on the mustard background, outside the cards. */
export function PageHeading({ children }: { children: ReactNode }) {
  return <h1 className='font-display text-4xl leading-tight sm:text-[3.5rem]'>{children}</h1>
}
