import "./AegeanCalculator.css";
import { useState } from "react";


export function AegeanCalculator() {
  const initMemory = {
    currentVal: "",
    nextVal: "",
    operator: "",
  };
  const [memory, setMemory] = useState(initMemory);
  const [display, setDisplay] = useState(memory.currentVal);

  function handleClick(evt) {
    const { value } = evt.target;
    let { currentVal, nextVal, operator } = memory;
    let newDisplay;

    if (value === "ac") {
      currentVal = "";
      nextVal = "";
      operator = "";
    } else if (operator && value === "=") {
      if (operator === "-") {
        currentVal = Number(currentVal) - Number(nextVal);
      } else if (operator === "+") {
        currentVal = Number(currentVal) + Number(nextVal);
      } else if (operator === "/") {
        currentVal = Number(currentVal) / Number(nextVal);
      } else if (operator === "x") {
        currentVal = Number(currentVal) * Number(nextVal);
      }
      newDisplay = currentVal;
      operator = ""
    } else if ("0123456789".includes(value)) {
      if (operator) {
        nextVal += value;
        newDisplay = `${currentVal} ${operator} ${nextVal}`
        operator = "";
      } else {
        currentVal += value;
        newDisplay = currentVal;
      }
    } else {
      operator = value;
      newDisplay = `${currentVal} ${operator}`;
    }

    setMemory({
      currentVal: String(currentVal),
      nextVal: String(nextVal),
      operator: String(operator),
    });
    setDisplay(newDisplay);
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
            value="+"
            className="rounded-0 btn btn-warning">=</button>
        </div>
      </div>
    </div>
  );
}