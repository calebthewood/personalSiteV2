import "./gameOfLife.css";
import { useState, useEffect } from "react";
import { patterns } from "./patternData";

/** Spent Way too much time polishing this lol.
 * TODOs:
 *  1) add row of Conway shapes that are pasted to the board when you click
 *      ex: 3 spaceships, 3 oscilators, 3 something else?
 *  2) Make it scale based on mobile or desktop
 *  3) User created patterns, stored in local storage
 *      - button w/ function that saves the coords of every live cell
 */
export default function GameOfLife({ width = 39, height = 23, defaultChance = .5 }) {

  const [board, setBoard] = useState(initializeBoard(defaultChance));
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [generation, setGeneration] = useState(0);
  const [pattern, setPattern] = useState("single");

  function handleRadioField(event) {
    let val = event.target.value;
    setPattern(val === pattern ? "none" : val);
  }

  function placePattern(newBoard, x, y) {
    for (let [x1, y1] of patterns[pattern].coords) {
      if (newBoard[y1 + y][x1 + x] !== undefined) {
        newBoard[y1 + y][x1 + x] = !newBoard[y + y1][x + x1];
      }
    }
    return newBoard;
  }

  function handleReset() {
    setBoard(initializeBoard(defaultChance));
    setGeneration(0);
    setIsRunning(false);
  }

  function clearBoard() {
    setBoard(initializeBoard(1));
    setGeneration(0);
    setIsRunning(false);
  }

  function handleSpeed(event) {
    setSpeed(event.target.value);
  }

  function handleClick(event) {
    const [x, y] = event.target.id.split(",");
    console.log("Cell Clicked x", x, ", y", y);
    setBoard(placePattern([...board], Number(x), Number(y)));
  }

  function toggleRunning() {
    setIsRunning((isRunning ? false : true));
  }

  function initializeBoard(chance) {
    return Array.from({ length: height }).map(
      row => Array.from({ length: width }).map(
        cell => Math.random() > chance
      ));
  }

  function countNeighbors(board, x, y) {
    let neighbors = 0;
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
    for (let i = 0; i < dirs.length; i++) {
      let offsetY = y + dirs[i][0];
      let offsetX = x + dirs[i][1];
      let y1 = y + offsetY < 0 ? height - 1 : offsetY >= height ? 0 : offsetY;
      let x1 = x + offsetX < 0 ? width - 1 : offsetX >= width ? 0 : offsetX;

      if (board[y1][x1]) neighbors++;
    }
    return neighbors;
  }

  function nextGeneration() {
    setGeneration(generation + 1);
    let newBoard = [];
    for (let y = 0; y < height; y++) {
      let row = [];
      for (let x = 0; x < width; x++) {
        let liveNeighbors = countNeighbors(board, x, y);

        if (liveNeighbors < 2 || liveNeighbors > 3) {
          row.push(false);
        } else if (liveNeighbors === 2) {
          row.push(board[y][x]);
        } else {
          row.push(true);
        }
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
  }

  useEffect(() => {
    const newSpeed = 510 - speed * 5;
    if (isRunning) {
      let interval = setInterval(() => {
        nextGeneration();
      }, newSpeed);
      return () => clearInterval(interval);
    }
  }, [isRunning, board]);

  return (
    <div className="card text-bg-dark">
      <div className="card-body">
        <h2 className="cart-title">Conway's Game of Life</h2>
        <p class="card-text">
          My implementation of Conway's Game of Life in React. It's what's
          called a 0-player game, or simulation. There are many iterations,
          but the fundamental game is based on just 3 rules, and from that
          all sorts of fascinating pattterns may emerge.
        </p>
        <div className="row mb-4">
          <table className="game-of-life">
            <tbody onClick={handleClick}>
              {board.map((row, y) => {
                return (
                  <tr key={`row-${y}`}>{row.map(
                    (cell, x) => <td id={`${x},${y}`} key={`x${x}-y${y}`} className={cell ? "cell alive" : "cell dead"}></td>
                  )}</tr>);
              })}
            </tbody>
          </table>
        </div>
        <hr />
        <div className="row justify-content-center align-items-center" >
          <div className="col-12 col-md-5 d-grid gap-2 mx-auto mb-2">
            <div className="btn-group" role="group">
              <input
                type="checkbox"
                className="btn-check"
                id="btncheck1"
                autocomplete="off"
                checked={isRunning}
                onChange={toggleRunning}
              />
              <label
                className="btn btn-lg btn-outline-light"
                htmlFor="btncheck1">
                {isRunning ?
                  <i class="fa-solid fa-pause"></i> :
                  <i class="fa-solid fa-play"></i>}
              </label>
              <button
                className="btn btn-lg btn-outline-light"
                onClick={handleReset}>
                <i class="fa-solid fa-arrow-rotate-left"></i>
              </button>
              <button
                className="btn btn-lg btn-outline-light"
                onClick={clearBoard}>
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <label className="text-center">
              <input
                type="range"
                min="10"
                max="100"
                className="form-range align-middle"
                onChange={handleSpeed}
                value={speed}
              />
              <button
                className="btn btn-sm btn-dark px-2"
                onClick={() => setSpeed(speed - 10 > 0 ? speed - 10 : 0)}>
                <i className="fa-solid fa-backward-fast"></i>
              </button>
              <button
                className="btn btn-sm btn-dark px-2"
                onClick={() => setSpeed(speed + 10 < 100 ? speed + 10 : 100)}>
                <i className="fa-solid fa-forward-fast "></i>
              </button>
            </label>
          </div>

          <div className="col-3 col-md-3 text-center">
            <h4 className="card-title">{generation}  <i class="fa-solid fa-repeat"></i></h4>
          </div>

        </div>

        <div className="row justify-content-around align-items-center m-2" onClick={handleRadioField}>
            <div className="btn-group col-md-1 mb-2" role="group" aria-label="Basic radio toggle button group">
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="single"
                value="single"
                checked={pattern === "single"}
              />
              <label className="btn btn-outline-light" htmlFor="single">{patterns.single.icon}</label>
            </div>
            <div className="btn-group col-md-3 mb-2" role="group" aria-label="Basic radio toggle button group">
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="glider"
                value="glider"
                checked={pattern === "glider"}
              />
              <label className="btn btn-outline-light" htmlFor="glider">{patterns.glider.icon}</label>
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="lwss"
                value="lwss"
                checked={pattern === "lwss"}
              />
              <label className="btn btn-outline-light" htmlFor="lwss">{patterns.lwss.icon}</label>
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="mwss"
                value="mwss"
                checked={pattern === "mwss"}
              />
              <label className="btn btn-outline-light" htmlFor="mwss">{patterns.mwss.icon}</label>
            </div>
            <div className="btn-group col-md-3 mb-2" role="group" aria-label="Basic radio toggle button group">
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="toad"
                value="toad"
                checked={pattern === "toad"}
              />
              <label className="btn btn-outline-light" htmlFor="toad">{patterns.toad.icon}</label>
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="pentaDec"
                value="pentaDec"
                checked={pattern === "pentaDec"}
              />
              <label className="btn btn-outline-light" htmlFor="pentaDec">{patterns.pentaDec.icon}</label>
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="pulsar"
                value="pulsar"
                checked={pattern === "pulsar"}
              />
              <label className="btn btn-outline-light" htmlFor="pulsar">{patterns.pulsar.icon}</label>
            </div>
            <div className="btn-group col-md-3 mb-2" role="group" aria-label="Basic radio toggle button group">
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="diehard"
                value="diehard"
                checked={pattern === "diehard"}
              />
              <label className="btn btn-outline-light" htmlFor="diehard">{patterns.diehard.icon}</label>
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="acorn"
                value="acorn"
                checked={pattern === "acorn"}
              />
              <label className="btn btn-outline-light" htmlFor="acorn">{patterns.acorn.icon}</label>
              <input
                type="radio"
                className="btn-check"
                name="pattern-radio"
                id="gosper"
                value="gosper"
                checked={pattern === "gosper"}
              />
              <label className="btn btn-outline-light" htmlFor="gosper">{patterns.gosper.icon}</label>
            </div>
        </div>
      </div >
    </div >
  );
}