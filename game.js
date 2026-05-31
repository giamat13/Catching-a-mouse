'use strict';

const GRID_SIZE = 6;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const GAME_DURATION = 30;

const MICE = ['🐭', '🐁'];
const CHEESE = '🧀';
const TRAP = '🪤';

const LEVELS = [
  { mouseCount: 3, speed: 1600, points: 10 },
  { mouseCount: 4, speed: 1200, points: 15 },
  { mouseCount: 5, speed: 900,  points: 20 },
  { mouseCount: 6, speed: 650,  points: 30 },
];

const board        = document.getElementById('board');
const scoreEl      = document.getElementById('score');
const timerEl      = document.getElementById('timer');
const levelEl      = document.getElementById('level');
const overlay      = document.getElementById('overlay');
const startBtn     = document.getElementById('start-btn');
const menuTitle    = document.getElementById('menu-title');
const menuSubtitle = document.getElementById('menu-subtitle');
const finalScoreWrap = document.getElementById('final-score-wrap');
const finalScoreEl   = document.getElementById('final-score');

let cells = [];
let score = 0;
let timeLeft = GAME_DURATION;
let levelIndex = 0;
let mousePositions = new Set();
let moveInterval = null;
let timerInterval = null;
let running = false;

function buildBoard() {
  board.innerHTML = '';
  cells = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', onCellClick);
    board.appendChild(cell);
    cells.push(cell);
  }
}

function renderBoard() {
  cells.forEach((cell, i) => {
    if (mousePositions.has(i)) {
      cell.textContent = MICE[i % MICE.length];
      cell.classList.add('has-mouse');
    } else {
      cell.textContent = '';
      cell.classList.remove('has-mouse', 'hit', 'miss');
    }
  });
}

function placeMice() {
  mousePositions.clear();
  const level = LEVELS[levelIndex];
  while (mousePositions.size < level.mouseCount) {
    mousePositions.add(Math.floor(Math.random() * TOTAL_CELLS));
  }
  renderBoard();
}

function moveMice() {
  const level = LEVELS[levelIndex];
  const newPositions = new Set();
  mousePositions.forEach(() => {
    let pos;
    let tries = 0;
    do {
      pos = Math.floor(Math.random() * TOTAL_CELLS);
      tries++;
    } while (newPositions.has(pos) && tries < 20);
    newPositions.add(pos);
  });
  mousePositions = newPositions;
  renderBoard();

  if (newPositions.size < level.mouseCount) {
    placeMice();
  }
}

function onCellClick(e) {
  if (!running) return;
  const idx = parseInt(e.currentTarget.dataset.index, 10);

  if (mousePositions.has(idx)) {
    const level = LEVELS[levelIndex];
    score += level.points;
    scoreEl.textContent = score;
    mousePositions.delete(idx);

    const cell = cells[idx];
    cell.classList.remove('has-mouse');
    cell.classList.add('hit');
    cell.textContent = '💥';
    showScorePopup(cell, `+${level.points}`);

    setTimeout(() => {
      cell.classList.remove('hit');
      cell.textContent = '';
      if (!mousePositions.has(idx)) {
        const newPos = randomFreeCell();
        if (newPos !== null) mousePositions.add(newPos);
      }
      renderBoard();
    }, 350);

    const thresholds = [100, 250, 450, 700];
    const newLevelIndex = thresholds.filter(t => score >= t).length;
    if (newLevelIndex > levelIndex && newLevelIndex < LEVELS.length) {
      levelIndex = newLevelIndex;
      levelEl.textContent = levelIndex + 1;
      restartMoveInterval();
    }
  } else {
    const cell = cells[idx];
    cell.classList.add('miss');
    setTimeout(() => cell.classList.remove('miss'), 350);
  }
}

function randomFreeCell() {
  const free = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!mousePositions.has(i)) free.push(i);
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function showScorePopup(cell, text) {
  const popup = document.createElement('span');
  popup.className = 'score-popup';
  popup.textContent = text;
  cell.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 10) timerEl.classList.add('warning');
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function restartMoveInterval() {
  clearInterval(moveInterval);
  moveInterval = setInterval(moveMice, LEVELS[levelIndex].speed);
}

function startGame() {
  score = 0;
  timeLeft = GAME_DURATION;
  levelIndex = 0;
  running = true;

  scoreEl.textContent = '0';
  timerEl.textContent = GAME_DURATION;
  timerEl.classList.remove('warning');
  levelEl.textContent = '1';

  overlay.classList.remove('visible');
  buildBoard();
  placeMice();
  restartMoveInterval();
  startTimer();
}

function endGame() {
  running = false;
  clearInterval(moveInterval);
  clearInterval(timerInterval);

  menuTitle.textContent = '⏰ המשחק נגמר!';
  menuSubtitle.textContent = getRank(score);
  finalScoreEl.textContent = score;
  finalScoreWrap.classList.remove('hidden');
  startBtn.textContent = 'שחק שוב';
  overlay.classList.add('visible');
}

function getRank(s) {
  if (s >= 700) return '🏆 אלוף תופס עכברים!';
  if (s >= 450) return '🥇 מצוין! עכבר-פרו!';
  if (s >= 250) return '🥈 טוב! תמשיך לתרגל!';
  if (s >= 100) return '🥉 סביר - העכברים ניצחו קצת...';
  return '😅 העכברים ניצחו הפעם!';
}

startBtn.addEventListener('click', startGame);

buildBoard();
