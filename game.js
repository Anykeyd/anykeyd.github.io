const SIZE = 4;
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const messageEl = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

let board = [];
let score = 0;
let best = Number(localStorage.getItem('best2048') || 0);
let gameOver = false;
let won = false;

bestEl.textContent = best;

// Создаём 16 клеток один раз
const cellEls = [];
for (let i = 0; i < SIZE * SIZE; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  boardEl.appendChild(cell);
  cellEls.push(cell);
}

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      const el = cellEls[r * SIZE + c];
      if (value === 0) {
        el.textContent = '';
        el.removeAttribute('data-value');
      } else {
        el.textContent = value;
        el.setAttribute('data-value', value);
      }
    }
  }
  scoreEl.textContent = score;
}

function startGame() {
  board = emptyBoard();
  score = 0;
  gameOver = false;
  won = false;
  messageEl.textContent = '';
  messageEl.className = 'message';
  addRandomTile();
  addRandomTile();
  render();
}

// Сжатие и слияние одной строки влево
function slideLine(line) {
  const filtered = line.filter(v => v !== 0);
  const result = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      gained += merged;
      if (merged === 2048) won = true;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { line: result, gained };
}

function move(direction) {
  if (gameOver) return;

  const before = JSON.stringify(board);
  let gainedTotal = 0;

  for (let i = 0; i < SIZE; i++) {
    let line;
    if (direction === 'left') {
      line = board[i].slice();
    } else if (direction === 'right') {
      line = board[i].slice().reverse();
    } else if (direction === 'up') {
      line = board.map(row => row[i]);
    } else {
      line = board.map(row => row[i]).reverse();
    }

    const { line: newLine, gained } = slideLine(line);
    gainedTotal += gained;

    if (direction === 'left') {
      board[i] = newLine;
    } else if (direction === 'right') {
      board[i] = newLine.reverse();
    } else if (direction === 'up') {
      for (let r = 0; r < SIZE; r++) board[r][i] = newLine[r];
    } else {
      const rev = newLine.reverse();
      for (let r = 0; r < SIZE; r++) board[r][i] = rev[r];
    }
  }

  if (JSON.stringify(board) !== before) {
    score += gainedTotal;
    if (score > best) {
      best = score;
      localStorage.setItem('best2048', best);
      bestEl.textContent = best;
    }
    addRandomTile();
    render();

    if (won) {
      messageEl.textContent = 'Победа! Вы собрали 2048 🎉';
      messageEl.className = 'message win';
    } else if (!canMove()) {
      gameOver = true;
      messageEl.textContent = 'Игра окончена. Попробуйте ещё раз!';
      messageEl.className = 'message lose';
    }
  }
}

function canMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

document.addEventListener('keydown', e => {
  const map = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down'
  };
  if (map[e.key]) {
    e.preventDefault();
    move(map[e.key]);
  }
});

// Свайпы
let touchStartX = 0;
let touchStartY = 0;

boardEl.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

boardEl.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < 30) return;
  if (absX > absY) {
    move(dx > 0 ? 'right' : 'left');
  } else {
    move(dy > 0 ? 'down' : 'up');
  }
}, { passive: true });

newGameBtn.addEventListener('click', startGame);

startGame();
