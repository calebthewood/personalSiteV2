import "./AegeanCalculator.css";
import { memo, useState } from "react";
import { createMemoryHistory } from "@remix-run/router";

export function AegeanCalculator() {
  const initMemory = {
    currentVal: "",
    nextVal: false,
    operator: false,
  };
  const [memory, setMemory] = useState(initMemory);
  const [display, setDisplay] = useState(memory.currentVal);

  function handleClick(evt) {
    const { value } = evt.target;
    const { currentVal, nextVal, operator } = memory;

    if (value === "ac") {
      setMemory(initMemory);
      setDisplay(memory.currentVal);
    } else if (value === "=") {
      if (operator === "-") {

      } else if (operator === "+") { }
        else if (operator === "/") { }
        else if (operator === "x") { }

    }

  }


  return (
    <div className="calculator">
      <div className="display">
        <span >{display}</span>
      </div>
      <div className="buttons">
        <div className="row calc-btns">
          <button
            type="button"
            value="ac">AC</button>
          <button
            type="button"
            value="+/-">+/-</button>
          <button
            type="button"
            value="%">%</button>
          <button
            type="button"
            value="/">/</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="7">7</button>
          <button
            type="button"
            value="8">8</button>
          <button
            type="button"
            value="9">9</button>
          <button
            type="button"
            value="x">x</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="4">4</button>
          <button
            type="button"
            value="5">5</button>
          <button
            type="button"
            value="6">6</button>
          <button
            type="button"
            value="-">-</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="1">1</button>
          <button
            type="button"
            value="2">2</button>
          <button
            type="button"
            value="3">3</button>
          <button
            type="button">+</button>
        </div>
        <div className="row calc-btns">
          <button
            id="calc-0"
            type="button"
            value="0"></button>
          <button>.</button>
          <button>=</button>
        </div>
      </div>
    </div>
  );
}