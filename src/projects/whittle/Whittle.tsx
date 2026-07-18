import { useRef, useState } from 'react'
import fiveLetterWords from './five-letter-words.json'

type CellColor = 'white' | 'grey' | 'yellow' | 'green'

const CELL_COLORS: Record<CellColor, string> = {
  white: 'bg-white',
  grey: 'bg-[#95afc0]',
  yellow: 'bg-[#f9ca24]',
  green: 'bg-[#6ab04c]',
}

function createBoard(): CellColor[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 'white' as CellColor))
}

function createFormData(): string[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ''))
}

function WhittleHeader() {
  return (
    <div className='text-center font-serif'>
      <h1 className='mx-auto w-fit border-b-4 border-[#212121] text-5xl font-bold italic text-[#212121]'>
        whittle
      </h1>
      <p className='mx-auto mt-3 max-w-lg text-sm text-[#666666]/65'>
        Welcome to <i>whittle</i>, my wordle-assist app. Enter your wordle guesses, and then click
        or press enter to change the color, and whittle down the number of potential words to
        choose from.
      </p>
    </div>
  )
}

function WhittleButton({ listLen, onClick }: { listLen: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      className='w-full rounded border border-gray-800 px-3 py-2 text-gray-800 transition hover:bg-gray-800 hover:text-white'
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered ? "Whittle 'em down!" : `${listLen} words to choose from`}
    </button>
  )
}

function WhittleList({ wordList }: { wordList: string[] }) {
  return (
    <ul className='mt-2 h-[230px] divide-y divide-gray-200 overflow-auto rounded border border-gray-200'>
      {wordList.map((word, i) => (
        <li className='px-3 py-1.5 hover:bg-gray-100' key={`${word}-${i}`}>
          {word}
        </li>
      ))}
    </ul>
  )
}

export default function Whittle() {
  const [filteredWords, setFilteredWords] = useState<string[]>(fiveLetterWords)
  const [grid, setGrid] = useState(createBoard)
  const [chars, setChars] = useState(createFormData)
  const filterTimer = useRef<number>()

  function debouncedFilter() {
    window.clearTimeout(filterTimer.current)
    filterTimer.current = window.setTimeout(runFilter, 300)
  }

  function getFilterData(): [{ char: string; type: CellColor; index: number }[], Record<string, number>] {
    const data = []
    const included: Record<string, number> = {}
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const char = chars[y][x]
        const type = grid[y][x]
        if (char !== '' && type !== 'white') {
          data.push({ char, type, index: x })
          if (type !== 'grey') included[char] = x
        }
      }
    }
    return [data, included]
  }

  function runFilter() {
    const [filterData, included] = getFilterData()
    setFilteredWords(fiveLetterWords.filter(word => {
      for (const { char, type, index } of filterData) {
        const charIdx = word.indexOf(char)
        if (type === 'grey' && charIdx >= 0) {
          if (char in included) {
            if (included[char] !== charIdx) return false
          } else {
            return false
          }
        } else if (type === 'yellow' && charIdx >= 0) {
          if (word[index] === char) return false
        } else if (type === 'green') {
          if (word[index] !== char) return false
        }
      }
      return true
    }))
  }

  function changeColor(x: number, y: number) {
    const newGrid = grid
    if (chars[y][x] === '') newGrid[y][x] = 'white'
    else if (newGrid[y][x] === 'white') newGrid[y][x] = 'grey'
    else if (newGrid[y][x] === 'grey') newGrid[y][x] = 'yellow'
    else if (newGrid[y][x] === 'yellow') newGrid[y][x] = 'green'
    else if (newGrid[y][x] === 'green') newGrid[y][x] = 'grey'
    setGrid([...newGrid])
  }

  function cellCoords(el: HTMLElement): [number, number] | null {
    const match = el.getAttribute('name')?.match(/\d+/g)
    if (!match) return null
    const [x, y] = match.map(Number)
    return [x, y]
  }

  function handleClick(evt: React.MouseEvent<HTMLTableSectionElement>) {
    const target = evt.target as HTMLInputElement
    const coords = cellCoords(target)
    if (!coords || !target.value.length) return
    changeColor(...coords)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const coords = cellCoords(e.target as HTMLInputElement)
    if (!coords) return
    const [x, y] = coords
    if (e.key === 'Backspace' && !chars[y][x]) {
      handleFocus(x, y, 'backward')
      changeColor(x, y)
    } else if (e.key === 'Enter' && chars[y][x].length) {
      changeColor(x, y)
    } else if (e.key !== 'Backspace' && chars[y][x]) {
      handleFocus(x, y, 'forward')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    const coords = cellCoords(e.target)
    if (!coords) return
    const [x, y] = coords
    const newChars = chars
    newChars[y][x] = value
    if (!value) changeColor(x, y)
    setChars([...newChars])
  }

  function handleFocus(x: number, y: number, direction: 'forward' | 'backward') {
    let siblingName
    if (direction === 'forward') {
      siblingName = x < 4 ? `x${x + 1}-y${y}` : `x0-y${y + 1}`
    } else {
      siblingName = x > 0 ? `x${x - 1}-y${y}` : `x4-y${y - 1}`
    }
    const moveTo = document.querySelector<HTMLInputElement>(`input[name=${siblingName}]`)
    if (moveTo) moveTo.focus()
  }

  return (
    <div className='mx-auto flex max-w-[700px] flex-col gap-6'>
      <WhittleHeader />
      <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center'>
        <table className='border-collapse'>
          <tbody onClick={handleClick}>
            {grid.map((row, y) => (
              <tr key={`row-${y}`}>
                {row.map((cell, x) => (
                  <td key={`x${x}-y${y}`} className='p-0'>
                    <input
                      type='text'
                      className={`m-0.5 h-12 w-12 cursor-pointer rounded border-[3px] border-gray-300 p-0.5 text-center text-3xl uppercase caret-transparent ${CELL_COLORS[cell]}`}
                      size={1}
                      maxLength={1}
                      autoComplete='off'
                      name={`x${x}-y${y}`}
                      value={chars[y][x]}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className='w-full max-w-[270px] grow'>
          <WhittleButton listLen={filteredWords.length} onClick={debouncedFilter} />
          <WhittleList wordList={filteredWords} />
        </div>
      </div>
    </div>
  )
}
