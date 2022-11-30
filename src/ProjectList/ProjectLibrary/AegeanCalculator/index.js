import "./AegeanCalculator.css";
import { useState } from "react";
import { aegeanNums } from "./aegeanNums";


export function AegeanCalculator() {
  const initMemory = {
    baseVal: "",
    operator: "",
    nextVal: "",
  };
  const [memory, setMemory] = useState(initMemory);
  const [aegean, setAegean] = useState(false);

  function handleAdd(val1, val2) {
    return String(Number(val1) + Number(val2));
  }

  function handleSubtract(val1, val2) {
    return String(Number(val1) - Number(val2));
  }

  function handleDivide(val1, val2) {
    return String(Number(val1) / Number(val2));
  }

  function handleMultiply(val1, val2) {
    return String(Number(val1) * Number(val2));
  }

  function handleSignChange(val) {
    if (val === 0) return String(0);
    if (val > 0) return String(-1 * val);
    return String(Math.abs(val));
  }

  function handleCompute(baseVal, nextVal, operator) {
    let newVal;
    if (operator === "+") {
      newVal = handleAdd(baseVal, nextVal);
    } else if (operator === "-") {
      newVal = handleSubtract(baseVal, nextVal);
    } else if (operator === "x") {
      newVal = handleMultiply(baseVal, nextVal);
    } else if (operator === "/") {
      newVal = handleDivide(baseVal, nextVal);
    }
    return newVal;
  }

  function toggleAegeanScript() {
    setAegean(!aegean);
  }

  function displayAegeanNum() {
    const base = String(Math.floor(Number(memory.baseVal)));
    if (Number(base) > 90000) return "limit reached";
    const len = base.length;
    const output = [];

    for (let i = 0; i < len; i++) {
      if (base[i] !== "0") {
        let number = base[i] + "0".repeat(len - (i + 1));
        output.push(aegeanNums[number]);
      }
    }
    return output.join(" ");
  }

  function displayNumber() {
    const { baseVal, operator, nextVal } = memory;
    return `${baseVal} ${operator} ${nextVal}`.trim();
  }

  function handleClick(evt) {
    const { value } = evt.target;
    let { baseVal, nextVal, operator } = memory;
    let newBaseVal = baseVal;
    let newNextVal = nextVal;
    let newOperator = operator;

    // clicked number
    if ("0123456789".includes(value)) {
      // update base value
      if (operator) {
        newNextVal = nextVal + value;
      } else {
        newBaseVal = baseVal + value;
      }
    } else if ("x+-/".includes(value)) {
      // clicked operator
      // if base val exists update operator state
      newBaseVal = baseVal;
      newOperator = value;
      newNextVal = "";
    } else if (value === "=") {
      // clicked compute
      // if base val, next val, and operator perform calc
      if (operator && nextVal) {
        newBaseVal = handleCompute(baseVal, nextVal, operator);
        newNextVal = "";
        newOperator = "";
      } else {
        newOperator = "";
        newNextVal = "";
      }
    } else if (value === "ac") {
      // clicked clear
      // reset state
      newBaseVal = "";
      newNextVal = "";
      newOperator = "";
    } else if (value === "+/-") {
      //clicked sign change
      if (!nextVal) {
        // if no next val, invert base val
        newBaseVal = handleSignChange(baseVal);
      } else {
        // else inverse next val
        newNextVal = handleSignChange(nextVal);
      }
    } else if (value === "aegean") {
      toggleAegeanScript();
    }

    setMemory({
      baseVal: newBaseVal,
      nextVal: newNextVal,
      operator: newOperator,
    });

  }


  return (
    <div className="calculator">
      <div className="row px-2 display-area text-end align-content-end justify-content-end">
        {memory.baseVal.length < 10 ?
          <span className="display-2">{aegean ? displayAegeanNum() : displayNumber()}</span> :
          <span className="display-6">{aegean ? displayAegeanNum() : displayNumber()} </span>}
      </div>
      <div onClick={handleClick} className="buttons">
        <div className="row calc-btns">
          <button
            type="button"
            value="ac"
            className="rounded-0 btn btn-secondary">AC</button>
          <button
            type="button"
            value="+/-"
            className="rounded-0 btn btn-secondary">+/-</button>
          <button
            type="button"
            value="aegean"
            className="rounded-0 btn btn-secondary">{memory.aegean ? "123..." : "𐁅"}</button>
          <button
            type="button"
            value="/"
            className="rounded-0 btn btn-warning">/</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="7"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["7"] : "7"}</button>
          <button
            type="button"
            value="8"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["8"] : "8"}</button>
          <button
            type="button"
            value="9"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["9"] : "9"}</button>
          <button
            type="button"
            value="x"
            className="rounded-0 btn btn-warning">x</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="4"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["4"] : "4"}</button>
          <button
            type="button"
            value="5"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["5"] : "5"}</button>
          <button
            type="button"
            value="6"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["6"] : "6"}</button>
          <button
            type="button"
            value="-"
            className="rounded-0 btn btn-warning">-</button>
        </div>
        <div className="row calc-btns">
          <button
            type="button"
            value="1"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["1"] : "1"}</button>
          <button
            type="button"
            value="2"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["2"] : "2"}</button>
          <button
            type="button"
            value="3"
            className="rounded-0 btn btn-light">{aegean ? aegeanNums["3"] : "3"}</button>
          <button
            type="button"
            value="+"
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