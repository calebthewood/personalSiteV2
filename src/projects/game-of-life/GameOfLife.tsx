import { FastForward, Pause, Play, RefreshCw, Rewind, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { patterns } from './patterns'

const controlBtnCls =
  'flex h-11 w-11 items-center justify-center rounded border border-gray-500 text-gray-100 transition hover:bg-gray-100 hover:text-gray-900'

export default function GameOfLife({ width = 39, height = 23, defaultChance = 0.5 }) {
  const [board, setBoard] = useState(() => initializeBoard(defaultChance))
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(50)
  const [generation, setGeneration] = useState(0)
  const [pattern, setPattern] = useState('single')

  function initializeBoard(chance: number): boolean[][] {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => Math.random() > chance),
    )
  }

  function placePattern(newBoard: boolean[][], x: number, y: number) {
    const selected = patterns[pattern]
    if (!selected) return newBoard
    for (const [x1, y1] of selected.coords) {
      if (newBoard[y1 + y]?.[x1 + x] !== undefined) {
        newBoard[y1 + y][x1 + x] = !newBoard[y + y1][x + x1]
      }
    }
    return newBoard
  }

  function handleReset() {
    setBoard(initializeBoard(defaultChance))
    setGeneration(0)
    setIsRunning(false)
  }

  function clearBoard() {
    setBoard(initializeBoard(1))
    setGeneration(0)
    setIsRunning(false)
  }

  function handleClick(event: React.MouseEvent<HTMLTableSectionElement>) {
    const id = (event.target as HTMLElement).id
    if (!id.includes(',')) return
    const [x, y] = id.split(',').map(Number)
    setBoard(placePattern([...board], x, y))
  }

  function countNeighbors(current: boolean[][], x: number, y: number) {
    let neighbors = 0
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]]
    for (let i = 0; i < dirs.length; i++) {
      const offsetY = y + dirs[i][0]
      const offsetX = x + dirs[i][1]
      const y1 = y + offsetY < 0 ? height - 1 : offsetY >= height ? 0 : offsetY
      const x1 = x + offsetX < 0 ? width - 1 : offsetX >= width ? 0 : offsetX
      if (current[y1][x1]) neighbors++
    }
    return neighbors
  }

  function nextGeneration() {
    setGeneration(g => g + 1)
    const newBoard = []
    for (let y = 0; y < height; y++) {
      const row = []
      for (let x = 0; x < width; x++) {
        const liveNeighbors = countNeighbors(board, x, y)
        if (liveNeighbors < 2 || liveNeighbors > 3) {
          row.push(false)
        } else if (liveNeighbors === 2) {
          row.push(board[y][x])
        } else {
          row.push(true)
        }
      }
      newBoard.push(row)
    }
    setBoard(newBoard)
  }

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(nextGeneration, 510 - speed * 5)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, board])

  return (
    <div className='mx-auto max-w-[764px] rounded-lg bg-gray-900 p-5 text-gray-100'>
      <h2 className='text-2xl font-bold'>Conway's Game of Life</h2>
      <p className='mt-1 text-sm text-gray-400'>
        Use the control panel to play, pause, +/- generation speed, clear or reset screen, and
        place premade patterns.
      </p>

      <table className='mx-auto my-4 border-collapse'>
        <tbody onClick={handleClick}>
          {board.map((row, y) => (
            <tr key={`row-${y}`}>
              {row.map((cell, x) => (
                <td
                  id={`${x},${y}`}
                  key={`x${x}-y${y}`}
                  className={`h-2 w-2 rounded-[30%] border border-[#2f343b] sm:h-3 sm:w-3 md:h-4 md:w-4 ${cell ? 'bg-gray-100' : 'bg-[#212529]'}`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <hr className='border-gray-700' />

      <div className='mt-4 flex flex-wrap items-center justify-center gap-6'>
        <div className='flex gap-2'>
          <button className={controlBtnCls} onClick={() => setIsRunning(r => !r)} title={isRunning ? 'Pause' : 'Play'}>
            {isRunning ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
          </button>
          <button className={controlBtnCls} onClick={handleReset} title='Reset board'>
            <RotateCcw className='h-5 w-5' />
          </button>
          <button className={controlBtnCls} onClick={clearBoard} title='Clear board'>
            <Trash2 className='h-5 w-5' />
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <button
            className='text-gray-400 transition hover:text-white'
            onClick={() => setSpeed(s => (s - 10 > 0 ? s - 10 : 0))}
            title='Slower'
          >
            <Rewind className='h-4 w-4' />
          </button>
          <input
            type='range'
            min={10}
            max={100}
            className='accent-gray-100'
            onChange={e => setSpeed(Number(e.target.value))}
            value={speed}
          />
          <button
            className='text-gray-400 transition hover:text-white'
            onClick={() => setSpeed(s => (s + 10 < 100 ? s + 10 : 100))}
            title='Faster'
          >
            <FastForward className='h-4 w-4' />
          </button>
        </div>

        <div className='flex items-center gap-2 text-xl font-bold'>
          {generation} <RefreshCw className='h-4 w-4' />
        </div>
      </div>

      <div className='mt-4 flex flex-wrap justify-center gap-2'>
        {Object.entries(patterns).map(([key, { icon, label }]) => (
          <button
            key={key}
            title={label}
            onClick={() => setPattern(p => (p === key ? 'none' : key))}
            className={`h-11 w-11 rounded border text-lg transition ${
              pattern === key
                ? 'border-gray-100 bg-gray-100/20'
                : 'border-gray-500 hover:bg-gray-100/10'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
