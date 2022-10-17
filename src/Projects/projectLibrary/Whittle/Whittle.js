import { useState } from "react";
import { fiveLetterWords } from "./wordList";
import "./whittle.css";


export default function Whittle() {
  const [filteredWords, setFilteredWords] = useState(fiveLetterWords);
  const [grid, setGrid] = useState(createBoard());
  const [chars, setChars] = useState(createFormData());

  function handleClick(evt) {
    const { value, name } = evt.target;
    const [x, y] = name.match(/\d+/g).map(Number);
    console.log("clicked xy ",x,y)
    let newGrid = grid;
    if (newGrid[y][x] === "grey") newGrid[y][x] = "yellow";
    else if (newGrid[y][x] === "yellow") newGrid[y][x] = "green";
    else if (newGrid[y][x] === "green") newGrid[y][x] = "grey";
    setGrid(newGrid)
  }

  function createFormData() {
    let data = {};
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        data[`x${x}-y${y}`] = "";
      }
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

  function handleChange(evt) {
    const { value, name } = evt.target;
    setChars((data) => ({
      ...data,
      [name]: value,
    }));
  }
  return (
    <div className="container">
      <div className="row text-center justify-content-center">

        <div className="col">

          <table className="whittle">
            <tbody onClick={handleClick} onChange={handleChange}>
              {grid.map((row, y) => {
                return (
                  <tr key={`row-${y}`}>{row.map(
                    (cell, x) => (
                      <td id={`x${x}-y${y}`} key={`x${x}-y${y}`} className={cell}>
                        <input
                          type="text"
                          className="whittle-cell"
                          size="1"
                          maxlength="1"
                          name={`x${x}-y${y}`}
                          value={chars[`x${x}-y${y}`].char}
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
              {filteredWords.length > 30 ? "Still too Vague" :
                filteredWords.map((word, i) => <li>{word}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};