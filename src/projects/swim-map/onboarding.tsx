import { useState } from 'react'
import { RACES, UPCOMING_RACES } from './races'

// First-load welcome overlay: pick a race, learn the three things you can do.
// Rendered from RACES/UPCOMING_RACES, so new races show up here automatically.
// A second page honors Betty Ann Barnett, the swimmer who inspired the tool.

const TIPS = [
    {
        icon: '🔍',
        title: 'Find racers',
        body: 'Search the field by name or bib number.',
    },
    {
        icon: '🏊',
        title: 'Add swimmers',
        body: 'One at a time, by division, the top 100, or the entire field.',
    },
    {
        icon: '▶',
        title: 'Watch them go',
        body: 'Press play, drag to orbit, scroll to zoom. Hover a swimmer for their name.',
    },
]

export function Onboarding({ onPickRace, onShowBettyRace, onClose }: {
    onPickRace: (key: string) => void
    onShowBettyRace: () => void
    onClose: () => void
}) {
    const [page, setPage] = useState<'races' | 'betty'>('races')

    return (
        <div className='absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in'>
            <div className='max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/50 animate-fade-in-up sm:rounded-3xl sm:p-8'>
                {page === 'betty' ? (
                    <div className='animate-fade-in'>
                        <div className='text-center'>
                            <div className='text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300'>
                                Shout out to
                            </div>
                            <h1 className='mt-1 text-3xl font-bold tracking-tight text-white'>
                                Betty Ann Barnett
                            </h1>
                            <p className='mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300'>
                               I didn't approach my first time in the Cholo's Waimea swim expecting to be a competitor, 
                               but still, I couldn't help but feel awed, and extremely humbled when I saw the roster 
                               of folks who absolutely crushed me. Among them was one person from the 80 and over division, Betty Ann Barnett. 
                               This would come as no surprise to any North Shore Swim Series veteran. Betty is a Hawaii 
                               Hall of Fame swimmer. And you'd have to scroll down through 326 people, across all divisions, to find someone faster 
                               than her. I only found this out after the race, while google searching who this super woman was. 
                               I knew I had to memorialize the moment and lucky for you I'm a much better software developer than I am a swimmer
                               Click the button below to see her time against my own and the overall winner. It was an honor to get wrecked by a legend. 
                            </p>
                        </div>
                        <div className='mt-8 flex flex-col items-center gap-3'>
                            <button
                                onClick={onShowBettyRace}
                                className='rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 active:scale-95'
                            >
                                Show me the race
                            </button>
                            <button
                                onClick={() => setPage('races')}
                                className='text-xs text-slate-500 transition hover:text-slate-300'
                            >
                                ← Back to races
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='animate-fade-in'>
                        <div className='mb-6 text-center'>
                            <div className='text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-400'>
                                Hawaii &middot; Open Water
                            </div>
                            <h1 className='mt-1 text-3xl font-bold tracking-tight text-white'>
                                Open Water Replay
                            </h1>
                            <p className='mt-2 text-sm text-slate-400'>
                                Real race results, replayed swimmer by swimmer over a voxel map of the islands.
                                Pick a race to dive in.
                            </p>
                        </div>

                        {/* the swimmer who inspired all of this */}
                        <button
                            onClick={() => setPage('betty')}
                            className='group mb-3 flex w-full items-center justify-between rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-400/10 to-orange-400/5 px-4 py-2.5 text-left transition hover:border-amber-300/60 hover:from-amber-400/20 hover:to-orange-400/10'
                        >
                            <span>
                                <span className='font-semibold text-amber-200'>Betty Ann Barnett</span>
                                <span className='ml-2 text-xs text-slate-400'>the swimmer who inspired this tool</span>
                            </span>
                            <span className='text-xs font-medium uppercase tracking-wider text-amber-300/70 transition group-hover:text-amber-200'>
                                The story →
                            </span>
                        </button>

                        <div className='grid gap-3 sm:grid-cols-2'>
                            {Object.entries(RACES).map(([key, race]) => (
                                <button
                                    key={key}
                                    onClick={() => onPickRace(key)}
                                    className='group rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition
                                        hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:shadow-lg hover:shadow-cyan-500/10
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
                                >
                                    <div className='flex items-baseline justify-between gap-2'>
                                        <span className='font-semibold text-white'>{race.name}</span>
                                        <span className='shrink-0 rounded-full bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-cyan-300'>
                                            {race.miles} mi
                                        </span>
                                    </div>
                                    <div className='mt-1 text-[11px] text-slate-500'>{race.region}</div>
                                    <div className='mt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500 transition group-hover:text-cyan-300'>
                                        Dive in →
                                    </div>
                                </button>
                            ))}
                            {UPCOMING_RACES.map(race => (
                                <div
                                    key={race.name}
                                    className='cursor-not-allowed rounded-2xl border border-white/5 bg-white/[0.02] p-4 opacity-50'
                                >
                                    <div className='flex items-baseline justify-between gap-2'>
                                        <span className='font-semibold text-slate-400'>{race.name}</span>
                                        <span className='shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-500'>
                                            {race.miles} mi
                                        </span>
                                    </div>
                                    <div className='mt-3 text-[11px] font-medium uppercase tracking-wider text-slate-600'>
                                        Coming soon
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3 sm:gap-4'>
                            {TIPS.map(t => (
                                <div key={t.title} className='flex gap-2.5'>
                                    <span className='text-base leading-6'>{t.icon}</span>
                                    <div>
                                        <div className='text-xs font-semibold text-slate-200'>{t.title}</div>
                                        <div className='mt-0.5 text-xs leading-relaxed text-slate-400'>{t.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className='mt-5 text-center text-[11px] text-slate-500'>
                            This website is my personal project, and has no affiliation with the North Shore Swim Series.
                        </p>

                        <div className='mt-4 text-center'>
                            <button
                                onClick={onClose}
                                className='text-xs text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline'
                            >
                                Skip — just let me explore
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
