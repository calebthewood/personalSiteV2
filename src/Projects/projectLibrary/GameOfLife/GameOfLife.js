import "./gameOfLife.css";
import { useState, useEffect } from "react";


// Make Clickable, Provide basic controls.


export default function GameOfLife({ width = 20, height = 20, chance = .5 }) {

  const [board, setBoard] = useState(initializeBoard());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(100);

  /** Rewrote this from classic 'for' loop to ES6 pattern, same as Lights out,
   * consider abstracting to helper class.
   */
  function initializeBoard() {
    return Array.from({ length: height }).map(
      row => Array.from({ length: width }).map(
        cell => Math.random() > chance
      ));
  }

  function handleClick(event) {
    const [x, y] = event.target.id.split(",");
    console.log("Cell Clicked ", x, ",", y);
    let clickedBoard = board;
    clickedBoard[y][x] = !(clickedBoard[y][x]);
    setBoard([...clickedBoard]);
  }

  function toggleRunning() {
    console.log("Status Toggled ", !isRunning);
    setIsRunning((isRunning ? false : true));
  }

  /** My original implementation for this worked fine, but was much uglier,
   * this was lifted from the textbook, Eloquent JavaScript.
   */
  function countNeighbors(grid, x, y) {
    let count = 0;
    for (let y1 = Math.max(0, y - 1); y1 <= Math.min(height - 1, y + 1); y1++) {
      for (let x1 = Math.max(0, x - 1); x1 <= Math.min(width - 1, x + 1); x1++) {
        if ((x1 !== x || y1 !== y) && grid[y1][x1]) {
          count++;
        }
      }
    }
    return count;
  }

  function nextGeneration() {
    console.log("Next Generation Ran");
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
    if (isRunning) {
      let interval = setInterval(() => {
        nextGeneration();
      }, speed);
      return () => clearInterval(interval);
    }
  }, [isRunning, board]);



  return (
    <div>
      <h2>Conway's Game of Life</h2>
      My implementation of Conway's Game of Life in React. It's what's
      called a 0-player game, or simulation. There are many iterations,
      but the fundamental game is based on just 3 rules, and from that
      all sorts of fascinating pattterns emerge.
      <table className="gol-board">
        <tbody onClick={handleClick}>
          {board.map((row, y) => {
            return (
              <tr key={`row-${y}`}>{row.map(
                (cell, x) => <td id={`${x},${y}`} key={`x${x}-y${y}`} className={cell ? "cell alive" : "cell dead"}></td>
              )}</tr>);
          })}
        </tbody>
      </table>
      <hr />
      <div>
        <button
          className="button"
          onClick={toggleRunning}>
          {isRunning ? "Pause" : "Start"}
        </button>
      </div>
    </div >
  );
}