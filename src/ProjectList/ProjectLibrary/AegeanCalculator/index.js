import "./AegeanCalculator.css";
import { useState } from "react";

/** */
export function AegeanCalculator() {
  const initMemory = {
    currentVal: "",
    operator: "",
    nextVal: "",
  };
  const [memory, setMemory] = useState(initMemory);
  const [display, setDisplay] = useState(memory.currentVal);

  function handleAdd(val1, val2) {
    return Number(val1) + Number(val2);
  }

  function handleSubtract(val1, val2) {
    return Number(val1) - Number(val2);
  }

  function handleDivide(val1, val2) {
    return Number(val1) / Number(val2);
  }

  function handleMultiply(val1, val2) {
    return Number(val1) * Number(val2);
  }

  function handleSignChange(val) {
    if (val === 0) return 0;
    if (val > 0) return -1 * val;
    return Math.abs(val);
  }

  function handleCompute(baseVal, nextVal, operator) {
    let newVal;
    if (operator === "+") {
      newVal = handleAdd(baseVal, nextVal)
    } else if (operator === "-") {
      newVal = handleSubtract(baseVal, nextVal)
    } else if (operator === "*") {
      newVal = handleMultiply(baseVal, nextVal)
    } else if (operator === "/") {
      newVal = handleDivide(baseVal, nextVal)
    }
    return newVal
  }


  function handleClick(evt) {
    const { value } = evt.target;
    let { currentVal, nextVal, operator } = memory;

    console.log("handleClick ", value);

    // clicked number
      // update base value
      // or if operator, update 2nd value
    // clicked operator
      // if base val exists update operator state
      // else ignore
    // clicked compute
      // if base val, next val, and operator perform calc
      // if no next val, undo reset operator
    // clicked clear
      // reset state
    //clicked sign change
      // if no next val, invert base val
      // else inverse next val

      //some edge cases around creating smooth behavior whenever clicking btns out of order, but not important for basic functionality.
  }


  return (
    <div className="calculator">
      <div className="row display">
        {display}
      </div>
      <div onClick={handleClick} className="buttons">
        <div className="row calc-btns">
          <button
            type="button"
            value="ac">AC</button>
          <button
            type="button"
            value="+/-">+/-</button>
          <button
            type="button"
            value="%" disabled>%</button>
          <button
            type="button"
            value="/"
            className="rounded-0 btn btn-warning">/</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="7"
            className="rounded-0 btn btn-light">7</button>
          <button
            type="button"
            value="8"
            className="rounded-0 btn btn-light">8</button>
          <button
            type="button"
            value="9"
            className="rounded-0 btn btn-light">9</button>
          <button
            type="button"
            value="x"
            className="rounded-0 btn btn-warning">x</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="4"
            className="rounded-0 btn btn-light">4</button>
          <button
            type="button"
            value="5"
            className="rounded-0 btn btn-light">5</button>
          <button
            type="button"
            value="6"
            className="rounded-0 btn btn-light">6</button>
          <button
            type="button"
            value="-"
            className="rounded-0 btn btn-warning">-</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="1"
            className="rounded-0 btn btn-light">1</button>
          <button
            type="button"
            value="2"
            className="rounded-0 btn btn-light">2</button>
          <button
            type="button"
            value="3"
            className="rounded-0 btn btn-light">3</button>
          <button
            type="button"
            className="rounded-0 btn btn-warning">+</button>
        </div>
        <div className="row calc-btns">
          <button
            id="calc-0"
            type="button"
            value="0"
            className="rounded-0 btn btn-light">0</button>
          <button
            type="button"
            value="."
            className="rounded-0 btn btn-light" disabled>.</button>
          <button
            type="button"
            value="="
            className="rounded-0 btn btn-warning">=</button>
        </div>
      </div>
    </div>
  );
}