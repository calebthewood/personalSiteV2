import { useEffect, useState } from "react";
import { fiveLetterWords } from "./wordList";
import "./whittle.css";


export default function Whittle() {
  const [filteredWords, setFilteredWords] = useState([]);
  const [filterData, setFilterData] = useState([]); // [{char: "a", type: "green", coords: [x,y]}]
  const [grid, setGrid] = useState(createBoard());
  const [chars, setChars] = useState(createFormData());

  function getFilterData() {
    let data = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (chars[y][x] !== "") {
          data.push({
            char: chars[y][x],
            type: grid[y][x],
            coords: [y, x]
          });
        }
      }
    }
    return data;
  }

  function runFilter(x, y) {
    setFilterData(getFilterData());
    setFilteredWords([...fiveLetterWords.filter(word => filterWord(word))]);
  }

  function changeColor(x, y) {
    let newGrid = grid;
    if (chars[y][x] === "") newGrid[y][x] = "grey";
    else if (newGrid[y][x] === "grey") newGrid[y][x] = "yellow";
    else if (newGrid[y][x] === "yellow") newGrid[y][x] = "green";
    else if (newGrid[y][x] === "green") newGrid[y][x] = "grey";
    setGrid([...newGrid]);
  }

  function filterWord(word) {
    for (let { char, type, coords } of filterData) {
      let [y, x] = coords;
      if (type === 'grey') {
        if (word.includes(char)) return false;
      } else if (type === 'yellow') {
        if (word[x] === char || !word.includes(char)) return false;
      } else if (type === 'green') {
        if (word[x] !== char) return false;
      }
    }
    return true;
  }

  function createFormData() {
    let data = [];
    for (let y = 0; y < 5; y++) {
      let row = [];
      for (let x = 0; x < 5; x++) {
        row.push("");
      }
      data.push(row);
    }
    return data;
  }

  function createBoard() {
    return Array.from({ length: 5 }).map(
      row => Array.from({ length: 5 }).map(
        cell => "grey"
      )
    );
  }

  function handleClick(evt) {
    const [x, y] = evt.target.name.match(/\d+/g).map(Number);
    console.log("clicked xy ", x, y);
    if (!evt.target.value.length) return;
    runFilter(x, y);
    changeColor(x, y);
  }

  function handleKeyDown(e) {
    const [x, y] = e.target.name.match(/\d+/g).map(Number);
    if (e.key === "Backspace" && !chars[y][x]) {
      handleFocus(x, y, "backward");
      changeColor(x, y);
    }else if (e.key === "Enter" && chars[y][x].length) {
      runFilter(x, y);
      changeColor(x, y);
    }else if (e.key !== "Backspace" && chars[y][x]) {
      handleFocus(x, y, "forward");
    }
  }

  function handleChange(e) {
    const value = e.target.value;
    const [x, y] = e.target.name.match(/\d+/g).map(Number);
    let newChars = chars;
    newChars[y][x] = value;
    if (!value) changeColor(x, y);
    setChars([...newChars]);
    runFilter(x, y);
  }

  function handleFocus(x, y, direction) {
    let siblingName;
    if (direction === "forward") {
      siblingName = x < 4 ? `x${x + 1}-y${y}` : `x0-y${y + 1}`;
    } else if (direction === "backward") {
      siblingName = x > 0 ? `x${x - 1}-y${y}` : `x4-y${y - 1}`;
    }
    const moveTo = document.querySelector("input[name=" + siblingName + "]");
    if (moveTo) moveTo.focus();
  }

  /** Updates character values in state */
  // function handleChange(evt) {
  //   const { value, name } = evt.target;

  //   let newChars = chars;
  //   newChars[y][x] = value.toLowerCase();
  //   setChars([...newChars]);
  // }

  return (
    <div className="container">
      <div className="row text-center justify-content-center">

        <div className="col">
          <table className="whittle">
            <tbody onClick={handleClick}>
              {grid.map((row, y) => {
                return (
                  <tr key={`row-${y}`}>{row.map(
                    (cell, x) => (
                      <td id={`x${x}-y${y}`} key={`x${x}-y${y}`} className={`whittle-td ${cell}`}>
                        <input
                          type="text"
                          className="whittle-cell"
                          size="1"
                          maxLength="1"
                          name={`x${x}-y${y}`}
                          value={chars[y][x]}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                        />
                      </td>)
                  )}</tr>);
              })}
            </tbody>
          </table>

        </div>

        <div className="row">
          <div className="col">
            <ol>
              {filteredWords.length > 100 ? "You gotta try a little first..." :
                filteredWords.map((word, i) => <li key={`${word}-${i}`}>{word}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};