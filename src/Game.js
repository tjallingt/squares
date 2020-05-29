import React from 'react';
import produce from 'immer';
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

function init() {
  return {
    player: PLAYER_ONE,
    squares: createInitialSquares(WIDTH, HEIGHT),
    walls: createInitialWalls(WIDTH, HEIGHT),
  };
}

export default function Game() {
  const [state, dispatch] = React.useReducer(reducer, undefined, init);

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
            onTake={(cellIndex) => {
              dispatch({ type: 'take', rowIndex, cellIndex });
            }}
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

function reducer(state, action) {
  switch (action.type) {
    case 'take': {
      return updateSquares(state, action);
    }

    case 'reset': {
      return init(action);
    }

    default:
      throw new Error(`unknown action "${action.type}"`);
  }
}

function updateSquares(state, action) {
  const newWalls = produce(state.walls, (draft) => {
    draft[action.rowIndex][action.cellIndex] = true;
  });

  let didTakeSquare = false;
  let newSquares = state.squares.map((squareTakenBy, squareIndex) => {
    if (squareTakenBy === UNTAKEN) {
      let col = squareIndex % WIDTH;
      let row = (squareIndex - col) / HEIGHT;

      let top = newWalls[row * 2][col];
      let left = newWalls[row * 2 + 1][col];
      let right = newWalls[row * 2 + 1][col + 1];
      let bottom = newWalls[row * 2 + 2][col];

      if (top && left && right && bottom) {
        didTakeSquare = true;
        return state.player;
      }
    }
    return squareTakenBy;
  });

  let nextPlayer = state.player;
  if (didTakeSquare === false) {
    nextPlayer = state.player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  }

  return { player: nextPlayer, walls: newWalls, squares: newSquares };
}

function whoWon(squares) {
  const playerScores = new Map();
  let winner = undefined;

  for (const squareTakenBy of squares) {
    if (squareTakenBy === UNTAKEN) return false;

    const previousScore = playerScores.get(squareTakenBy) || 0;
    const currentScore = previousScore + 1;

    const highestScore = playerScores.get(winner) || 0;

    if (currentScore > highestScore) {
      winner = squareTakenBy;
    }

    playerScores.set(squareTakenBy, currentScore);
  }

  return winner;
}

function createInitialSquares(width, height) {
  // create a width * height array filled with UNTAKEN squares
  return Array.from(range(width * height, UNTAKEN));
}

function createInitialWalls(width, height) {
  let numRows = height * 2 + 1;
  return Array.from(range(numRows)).map((_, index) => {
    let isOdd = Boolean(index % 2);
    let numCols = isOdd ? width + 1 : width;
    return Array.from(range(numCols, false));
  });
}

function* range(length, value = undefined) {
  for (let i = 0; i < length; i++) {
    yield value;
  }
}
