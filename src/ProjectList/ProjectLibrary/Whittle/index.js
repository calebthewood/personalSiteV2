import { useState } from "react";
import { fiveLetterWords } from "./wordList";
import { WhittleHeader } from "./WhittleHeader";
import "./whittle.css";
import { WhittleList } from "./WhittleList";
import { WhittleButton } from "./WhittleButton";
import _ from "lodash";

/**
 * TODOs:
 * 1) Add Webster API to get a word definition on click
 * 2) Think about storing the word list better, maybe filter down one list if adding
 *    characters, and refulter the whole list if previous characters change?
 * 3) Move wordlist to db?
 */
export function Whittle() {
  const [filteredWords, setFilteredWords] = useState(fiveLetterWords);
  const [grid, setGrid] = useState(createBoard());
  const [chars, setChars] = useState(createFormData());

  const debouncedFilter = _.debounce(() => runFilter(), 500);

  function getFilterData() {
    const data = [];
    const included = {};
    let char, type;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        char = chars[y][x];
        type = grid[y][x];
        if (char !== "" && type !== "white") {
          data.push({ char, type, index: x });
          if (type !== "grey") included[char] = x;
        }
      }
    }
    return [data, included];
  }

  function runFilter() {
    const [filterData, included] = getFilterData();
    setFilteredWords(fiveLetterWords.filter(word => {
      for (let { char, type, index } of filterData) {
        let charIdx = word.indexOf(char);
        console.log("charIdx: ", charIdx);
        if (type === 'grey' && charIdx >= 0) {
          if (char in included) {
            if (included[char] !== charIdx) {
              return false;
            }
          } else {
            return false;
          }
        } else if (type === 'yellow' && charIdx >= 0) {
          if (word[index] === char) return false;
        } else if (type === 'green') {
          if (word[index] !== char) return false;
        }
      }
      return true;
    }));
  }

  function changeColor(x, y) {
    let newGrid = grid;
    if (chars[y][x] === "") newGrid[y][x] = "white";
    else if (newGrid[y][x] === "white") newGrid[y][x] = "grey";
    else if (newGrid[y][x] === "grey") newGrid[y][x] = "yellow";
    else if (newGrid[y][x] === "yellow") newGrid[y][x] = "green";
    else if (newGrid[y][x] === "green") newGrid[y][x] = "grey";
    setGrid([...newGrid]);
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
        cell => "white"
      )
    );
  }

  function handleClick(evt) {
    const [x, y] = evt.target.name.match(/\d+/g).map(Number);
    console.log("clicked xy ", x, y);
    if (!evt.target.value.length) return;
    changeColor(x, y);
  }

  function handleKeyDown(e) {
    const [x, y] = e.target.name.match(/\d+/g).map(Number);
    if (e.key === "Backspace" && !chars[y][x]) {
      handleFocus(x, y, "backward");
      changeColor(x, y);
    } else if (e.key === "Enter" && chars[y][x].length) {
      changeColor(x, y);
    } else if (e.key !== "Backspace" && chars[y][x]) {
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

  return (
    <div id="whittle-container" className="container">
      <div className="row justify-content-center">
        <WhittleHeader />
      </div>
      <div className="row justify-content-center">
        <div className="col" style={{ width: "270px" }}>

          <table className="whittle mb-4">
            <tbody onClick={handleClick}>
              {grid.map((row, y) => {
                return (
                  <tr key={`row-${y}`}>{row.map(
                    (cell, x) => (
                      <td id={`x${x}-y${y}`} key={`x${x}-y${y}`} className="whittle-td">
                        <input
                          type="text"
                          className={`whittle-cell ${cell} border rounded border-3 `}
                          size="1"
                          maxLength="1"
                          autoComplete="off"
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

        <div className="col">
          <WhittleButton listLen={filteredWords.length} onClick={() => debouncedFilter()} />
          <WhittleList wordList={filteredWords} handleClick={debouncedFilter} />
        </div>
      </div>
    </div>
  );
};