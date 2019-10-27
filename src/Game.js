import React from 'react';
import './Game.css';

const WIDTH = 3;
const HEIGHT = 3;

const UNTAKEN = Symbol('untaken');

const PLAYER_ONE = 1;
const PLAYER_TWO = 2;

const SQUARE_CLASSES = {
  [UNTAKEN]: 'untaken',
  [PLAYER_ONE]: 'one',
  [PLAYER_TWO]: 'two',
};

const initialState = {
  player: PLAYER_ONE,
  squares: createInitialSquares(),
  walls: createInitialWalls(),
};

export default function Game() {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  let winner = whoWon(state.squares);
  if (winner !== false) {
    return 'Congratulations player ' + winner;
  }

  return (
    <div>
      <div>Player {state.player === PLAYER_ONE ? 1 : 2}</div>
      <div className="Game">
        {state.walls.map((rowState, rowIndex) => (
          <Row
            key={rowIndex}
            rowState={rowState}
            squares={state.squares}
            index={rowIndex}
            onTake={cellIndex => dispatch({ rowIndex, cellIndex })}
          />
        ))}
      </div>
    </div>
  );
}

function Row({ rowState, squares, index: rowIndex, onTake }) {
  let isOdd = Boolean(rowIndex % 2);

  return (
    <div className={`Row ${isOdd ? 'odd' : 'even'}`}>
      {rowState.map((isTaken, cellIndex) => {
        let isLast = cellIndex === rowState.length - 1;
        let square = null;

        if (isOdd && !isLast) {
          let squareIndex = cellIndex + ((rowIndex - 1) / 2) * HEIGHT;
          let squareState = squares[squareIndex];
          let squareClass = SQUARE_CLASSES[squareState];

          square = <div className={`Square ${squareClass}`} />;
        }

        return (
          <React.Fragment key={cellIndex}>
            <button
              disabled={isTaken}
              className={`Wall ${isTaken ? 'taken' : ''}`}
              onClick={() => onTake(cellIndex)}
            />
            {square}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function reducer(state, { rowIndex, cellIndex }) {
  let newWalls = updateWalls(state.walls, rowIndex, cellIndex);

  let [newSquares, didTake] = updateSquares(state.squares, newWalls, state.player);

  let nextPlayer = state.player;
  if (!didTake) {
    nextPlayer = state.player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  }

  return { player: nextPlayer, walls: newWalls, squares: newSquares };
}

function updateSquares(squares, walls, player) {
  let didTake = false;
  let newSquares = squares.map((state, index) => {
    if (state === UNTAKEN) {
      let col = index % WIDTH;
      let row = (index - col) / HEIGHT;

      let top = walls[row * 2][col];
      let left = walls[row * 2 + 1][col];
      let right = walls[row * 2 + 1][col + 1];
      let bottom = walls[row * 2 + 2][col];

      if (top && left && right && bottom) {
        didTake = true;
        return player;
      }
    }
    return state;
  });
  return [newSquares, didTake];
}

function updateWalls(walls, rowIndex, cellIndex) {
  return walls.map((row, rowIdx) => {
    if (rowIndex === rowIdx) {
      return row.map((cell, cellIdx) => {
        if (cellIndex === cellIdx) {
          return true;
        }
        return cell;
      });
    }
    return row;
  });
}

function whoWon(squares) {
  let finished = squares.every(square => square !== UNTAKEN);
  if (!finished) return false;

  let playerScores = squares.reduce((players, square) => {
    return players.set(square, (players.get(square) || 0) + 1);
  }, new Map());

  return Array.from(playerScores)
    .sort((a, b) => a[1] - b[1])
    .pop()[0];
}

function createInitialSquares() {
  // create a HEIGHT x WIDTH array filled with UNTAKEN squares
  return Array.from(range(HEIGHT * WIDTH, UNTAKEN));
}

function createInitialWalls() {
  let numRows = HEIGHT * 2 + 1;
  return Array.from(range(numRows)).map((_, index) => {
    let isOdd = Boolean(index % 2);
    let numCols = isOdd ? WIDTH + 1 : WIDTH;
    return Array.from(range(numCols, false));
  });
}

function* range(length, value = undefined) {
  for (let i = 0; i < length; i++) {
    yield value;
  }
}
