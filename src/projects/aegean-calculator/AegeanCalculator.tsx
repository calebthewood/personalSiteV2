import { useState } from 'react'
import { aegeanNums } from './aegeanNums'

const numCls = 'h-[50px] border-[0.5px] border-[#a1a1a1] bg-gray-100 text-lg transition hover:bg-white'
const opCls = 'h-[50px] border-[0.5px] border-[#a1a1a1] bg-amber-400 text-lg transition hover:bg-amber-300'
const fnCls = 'h-[50px] border-[0.5px] border-[#a1a1a1] bg-gray-500 text-lg text-white transition hover:bg-gray-400'

export default function AegeanCalculator() {
  const initMemory = {
    baseVal: '',
    operator: '',
    nextVal: '',
  }
  const [memory, setMemory] = useState(initMemory)
  const [aegean, setAegean] = useState(false)

  function handleCompute(baseVal: string, nextVal: string, operator: string) {
    const a = Number(baseVal)
    const b = Number(nextVal)
    if (operator === '+') return String(a + b)
    if (operator === '-') return String(a - b)
    if (operator === 'x') return String(a * b)
    if (operator === '/') return String(a / b)
    return baseVal
  }

  function handleSignChange(val: string) {
    const n = Number(val)
    if (n === 0) return String(0)
    if (n > 0) return String(-1 * n)
    return String(Math.abs(n))
  }

  function displayAegeanNum() {
    const base = String(Math.floor(Number(memory.baseVal)))
    if (Number(base) > 90000) return 'limit reached'
    const len = base.length
    const output = []
    for (let i = 0; i < len; i++) {
      if (base[i] !== '0') {
        const number = base[i] + '0'.repeat(len - (i + 1))
        output.push(aegeanNums[number])
      }
    }
    return output.join(' ')
  }

  function displayNumber() {
    const { baseVal, operator, nextVal } = memory
    return `${baseVal} ${operator} ${nextVal}`.trim()
  }

  function handleClick(evt: React.MouseEvent<HTMLDivElement>) {
    const value = (evt.target as HTMLButtonElement).value
    if (!value) return
    const { baseVal, nextVal, operator } = memory
    let newBaseVal = baseVal
    let newNextVal = nextVal
    let newOperator = operator

    if ('0123456789'.includes(value)) {
      if (operator) {
        newNextVal = nextVal + value
      } else {
        newBaseVal = baseVal + value
      }
    } else if ('x+-/'.includes(value)) {
      newOperator = value
      newNextVal = ''
    } else if (value === '=') {
      if (operator && nextVal) {
        newBaseVal = handleCompute(baseVal, nextVal, operator)
      }
      newNextVal = ''
      newOperator = ''
    } else if (value === 'ac') {
      newBaseVal = ''
      newNextVal = ''
      newOperator = ''
    } else if (value === '+/-') {
      if (!nextVal) {
        newBaseVal = handleSignChange(baseVal)
      } else {
        newNextVal = handleSignChange(nextVal)
      }
    } else if (value === 'aegean') {
      setAegean(a => !a)
    }

    setMemory({
      baseVal: newBaseVal,
      nextVal: newNextVal,
      operator: newOperator,
    })
  }

  const display = aegean ? displayAegeanNum() : displayNumber()

  return (
    <div className='mx-auto w-[280px] overflow-hidden rounded-lg border border-[#a1a1a1]'>
      <div className='flex h-20 items-end justify-end break-all bg-[#a1a1a1] px-3 py-1 text-right'>
        <span className={memory.baseVal.length < 10 ? 'text-4xl' : 'text-lg'}>{display}</span>
      </div>
      <div onClick={handleClick} className='grid grid-cols-4'>
        <button type='button' value='ac' className={fnCls}>AC</button>
        <button type='button' value='+/-' className={fnCls}>+/-</button>
        <button type='button' value='aegean' className={fnCls}>{aegean ? '123' : '𐁅'}</button>
        <button type='button' value='/' className={opCls}>/</button>

        <button type='button' value='7' className={numCls}>{aegean ? aegeanNums['7'] : '7'}</button>
        <button type='button' value='8' className={numCls}>{aegean ? aegeanNums['8'] : '8'}</button>
        <button type='button' value='9' className={numCls}>{aegean ? aegeanNums['9'] : '9'}</button>
        <button type='button' value='x' className={opCls}>x</button>

        <button type='button' value='4' className={numCls}>{aegean ? aegeanNums['4'] : '4'}</button>
        <button type='button' value='5' className={numCls}>{aegean ? aegeanNums['5'] : '5'}</button>
        <button type='button' value='6' className={numCls}>{aegean ? aegeanNums['6'] : '6'}</button>
        <button type='button' value='-' className={opCls}>-</button>

        <button type='button' value='1' className={numCls}>{aegean ? aegeanNums['1'] : '1'}</button>
        <button type='button' value='2' className={numCls}>{aegean ? aegeanNums['2'] : '2'}</button>
        <button type='button' value='3' className={numCls}>{aegean ? aegeanNums['3'] : '3'}</button>
        <button type='button' value='+' className={opCls}>+</button>

        <button type='button' value='0' className={`${numCls} col-span-2`}>0</button>
        <button type='button' value='.' className={numCls} disabled>.</button>
        <button type='button' value='=' className={opCls}>=</button>
      </div>
    </div>
  )
}
