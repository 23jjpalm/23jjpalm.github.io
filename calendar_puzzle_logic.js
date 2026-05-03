const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const BOARD = [
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', null],
  ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', null],
  ['1',   '2',   '3',   '4',   '5',   '6',   '7'],
  ['8',   '9',   '10',  '11',  '12',  '13',  '14'],
  ['15',  '16',  '17',  '18',  '19',  '20',  '21'],
  ['22',  '23',  '24',  '25',  '26',  '27',  '28'],
  ['29',  '30',  '31',  'Sun', 'Mon', 'Tue', 'Wed'],
  [null,  null,  null,  null,  'Thu', 'Fri', 'Sat']
];

const BASE_PIECES = [
  { name: 'P1',  shape: [[1,1,1,1]] },
  { name: 'P2',  shape: [[1,1,1],[1,1,0]] },
  { name: 'P3',  shape: [[1,1,1],[0,1,0],[0,1,0]] },
  { name: 'P4',  shape: [[1,1,1],[1,0,1]] },
  { name: 'P5',  shape: [[1,0,0],[1,1,1],[0,0,1]] },
  { name: 'P6',  shape: [[1,1,1],[1,0,0],[1,0,0]] },
  { name: 'P7',  shape: [[1,1,1,1],[1,0,0,0]] },
  { name: 'P8',  shape: [[1,1,1],[1,0,0]] },
  { name: 'P9',  shape: [[0,0,1,1],[1,1,1,0]] },
  { name: 'P10', shape: [[1,1,0],[0,1,1]] }
];

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#84cc16','#f43f5e'];

const boardEl = document.getElementById('board');
const boardShell = document.getElementById('boardShell');
const bankGrid = document.getElementById('bankGrid');
const monthSelect = document.getElementById('monthSelect');
const daySelect = document.getElementById('daySelect');
const weekdaySelect = document.getElementById('weekdaySelect');
const statusEl = document.getElementById('status');
const hintBox = document.getElementById('hintBox');
const placedCountEl = document.getElementById('placedCount');
const coveredCountEl = document.getElementById('coveredCount');
const mistakeCountEl = document.getElementById('mistakeCount');

let pieces = [];
let selectedPieceId = null;
let drag = null;
let zCounter = 20;
let activeHint = null;
let suggestedPieceIds = new Set();

function cellSize() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell'));
}

function gapSize() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap'));
}

function stepSize() {
  return cellSize() + gapSize();
}

function cloneShape(shape) {
  return shape.map(row => [...row]);
}

function trimShape(shape) {
  let rows = [];
  for (let r = 0; r < shape.length; r++) {
    if (shape[r].some(Boolean)) rows.push([...shape[r]]);
  }
  if (rows.length === 0) return [[0]];

  let minC = Infinity;
  let maxC = -Infinity;
  rows.forEach(row => {
    row.forEach((v, c) => {
      if (v) {
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    });
  });
  return rows.map(row => row.slice(minC, maxC + 1));
}

function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const out = [];
  for (let c = 0; c < cols; c++) {
    const newRow = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(shape[r][c] ? 1 : 0);
    }
    out.push(newRow);
  }
  return trimShape(out);
}

function flipShape(shape) {
  return trimShape(shape.map(row => [...row].reverse()));
}

function occupiedOffsets(shape) {
  const cells = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) cells.push([r, c]);
    }
  }
  return cells;
}

function normalizeCells(cells) {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const shifted = cells.map(([r, c]) => [r - minR, c - minC]);
  shifted.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return shifted;
}

function rotateCells(cells) {
  return normalizeCells(cells.map(([r, c]) => [c, -r]));
}

function reflectCells(cells) {
  return normalizeCells(cells.map(([r, c]) => [r, -c]));
}

function cellsKey(cells) {
  return cells.map(([r, c]) => `${r},${c}`).join('|');
}

function generateOrientations(shape) {
  const base = normalizeCells(occupiedOffsets(shape));
  const variants = new Map();
  let current = base;

  for (let i = 0; i < 4; i++) {
    variants.set(cellsKey(current), current);
    const reflected = reflectCells(current);
    variants.set(cellsKey(reflected), reflected);
    current = rotateCells(current);
  }

  return Array.from(variants.values());
}

function populateControls() {
  MONTHS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = i;
    daySelect.appendChild(opt);
  }

  WEEKDAYS.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    weekdaySelect.appendChild(opt);
  });

  useToday(false);
}

function targets() {
  return new Set([monthSelect.value, daySelect.value, weekdaySelect.value]);
}

function validBoardCell(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 7 && BOARD[r][c] !== null;
}

function isTargetCell(r, c) {
  return validBoardCell(r, c) && targets().has(BOARD[r][c]);
}

function hitsBlockedCell(piece, baseR, baseC) {
  return occupiedOffsets(piece.shape).some(([r, c]) => {
    const rr = baseR + r;
    const cc = baseC + c;
    return !validBoardCell(rr, cc);
  });
}

function requiredCellCount() {
  let count = 0;
  const t = targets();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 7; c++) {
      if (BOARD[r][c] !== null && !t.has(BOARD[r][c])) count++;
    }
  }
  return count;
}

function renderBoard() {
  boardEl.innerHTML = '';
  const t = targets();
  const coverageCounts = getCoverageCounts();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 7; c++) {
      const value = BOARD[r][c];
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (value === null) {
        cell.classList.add('blocked');
        cell.textContent = 'XXXX';
      } else {
        cell.textContent = value;
        if (t.has(value)) cell.classList.add('target');

        const key = `${r},${c}`;
        const count = coverageCounts.get(key) || 0;
        if (count > 0 && !t.has(value)) cell.classList.add('covered-ok');
        if (count > 0 && t.has(value)) cell.classList.add('covered-bad');
        if (count > 1) cell.classList.add('covered-bad');

        if (activeHint && activeHint.r === r && activeHint.c === c) {
          cell.classList.add('hint-cell');
          const badge = document.createElement('div');
          badge.className = 'hint-badge';
          badge.textContent = `${activeHint.optionCount}`;
          cell.appendChild(badge);
        }

        if (activeHint && activeHint.dangerCells.has(key)) cell.classList.add('danger-cell');
        if (activeHint && activeHint.warningCells.has(key)) cell.classList.add('warning-cell');
      }

      const coord = document.createElement('div');
      coord.className = 'coord';
      coord.textContent = `${r+1},${c+1}`;
      cell.appendChild(coord);
      boardEl.appendChild(cell);
    }
  }
}

function createPieces() {
  pieces = BASE_PIECES.map((p, i) => ({
    id: i,
    name: p.name,
    shape: cloneShape(p.shape),
    color: COLORS[i],
    placed: false,
    boardR: null,
    boardC: null,
    x: 0,
    y: 0,
    z: 20 + i
  }));
  selectedPieceId = null;
  clearHint(false);
}

function makePieceElement(piece, mode) {
  const el = document.createElement('div');
  el.className = `piece ${mode === 'bank' ? 'in-bank' : 'on-board'}`;
  el.dataset.id = piece.id;
  if (piece.id === selectedPieceId) el.classList.add('selected');
  if (piece.placed) el.classList.add('locked');

  const grid = document.createElement('div');
  grid.className = 'piece-grid';
  grid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, ${mode === 'bank' ? 'var(--bank-cell)' : 'var(--cell)'})`;
  grid.style.gridTemplateRows = `repeat(${piece.shape.length}, ${mode === 'bank' ? 'var(--bank-cell)' : 'var(--cell)'})`;

  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      const b = document.createElement('div');
      if (piece.shape[r][c]) {
        b.className = 'block';
        b.style.background = piece.color;
        b.textContent = piece.name.replace('P', '');
      } else {
        b.className = 'block ghost';
        b.style.background = 'transparent';
        b.style.borderColor = 'transparent';
        b.textContent = '';
      }
      grid.appendChild(b);
    }
  }

  el.appendChild(grid);
  el.addEventListener('pointerdown', pointerDown);
  el.addEventListener('click', () => selectPiece(piece.id));
  return el;
}

function renderPieces() {
  document.querySelectorAll('.piece:not(.dragging)').forEach(el => el.remove());
  bankGrid.innerHTML = '';

  pieces.forEach(piece => {
    if (piece.placed) {
      const el = makePieceElement(piece, 'board');
      boardShell.appendChild(el);
      const pos = boardPositionFromCell(piece.boardR, piece.boardC);
      piece.x = pos.x;
      piece.y = pos.y;
      el.style.left = `${piece.x}px`;
      el.style.top = `${piece.y}px`;
      el.style.zIndex = piece.z;
    } else {
      const slot = document.createElement('div');
      slot.className = 'bank-slot';
      if (suggestedPieceIds.has(piece.id)) slot.classList.add('suggested-piece');
      slot.dataset.slotId = piece.id;

      const title = document.createElement('div');
      title.className = 'bank-slot-title';
      title.innerHTML = `<span>${piece.name}</span><span>${occupiedOffsets(piece.shape).length} cells</span>`;

      const el = makePieceElement(piece, 'bank');
      slot.appendChild(title);
      slot.appendChild(el);
      bankGrid.appendChild(slot);
    }
  });

  updatePieceValidityStyles();
}

function selectPiece(id) {
  selectedPieceId = id;
  const piece = pieces.find(p => p.id === id);
  if (piece) piece.z = ++zCounter;
  renderPieces();
  statusEl.textContent = `${piece.name} selected. Press R to rotate, F to flip, or drag it around.`;
}

function boardPositionFromCell(r, c) {
  return { x: c * stepSize(), y: r * stepSize() };
}

function cellFromBoardPosition(x, y) {
  const s = stepSize();
  return {
    r: Math.round(y / s),
    c: Math.round(x / s)
  };
}

function pointerDown(e) {
  const id = Number(e.currentTarget.dataset.id);
  const piece = pieces.find(p => p.id === id);
  selectedPieceId = id;
  piece.z = ++zCounter;

  const rect = e.currentTarget.getBoundingClientRect();
  const pointerOffset = getPointerOffsetInFullSizePiece(e, rect, e.currentTarget.classList.contains('in-bank'));

  e.preventDefault();

  if (piece.placed) {
    piece.placed = false;
    piece.boardR = null;
    piece.boardC = null;
  }

  clearHint(false);
  renderPieces();
  renderBoard();
  updateStats();

  const dragEl = makePieceElement(piece, 'board');
  dragEl.classList.add('dragging', 'selected');
  dragEl.style.left = `${e.clientX - pointerOffset.x}px`;
  dragEl.style.top = `${e.clientY - pointerOffset.y}px`;
  dragEl.style.zIndex = 1000;
  document.body.appendChild(dragEl);

  drag = {
    id,
    offsetX: pointerOffset.x,
    offsetY: pointerOffset.y,
    el: dragEl
  };

  document.addEventListener('pointermove', pointerMove);
  document.addEventListener('pointerup', pointerUp);
}

function getPointerOffsetInFullSizePiece(e, rect, wasBankPiece) {
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  if (!wasBankPiece) return { x: rawX, y: rawY };

  const scale = cellSize() / parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bank-cell'));
  return { x: rawX * scale, y: rawY * scale };
}

function pointerMove(e) {
  if (!drag) return;
  drag.el.style.left = `${e.clientX - drag.offsetX}px`;
  drag.el.style.top = `${e.clientY - drag.offsetY}px`;
}

function pointerUp(e) {
  if (!drag) return;
  const piece = pieces.find(p => p.id === drag.id);
  const boardRect = boardShell.getBoundingClientRect();
  const pieceLeft = e.clientX - drag.offsetX;
  const pieceTop = e.clientY - drag.offsetY;
  const xInBoard = pieceLeft - boardRect.left;
  const yInBoard = pieceTop - boardRect.top;
  const pointerNearBoard = e.clientX >= boardRect.left - 80 && e.clientX <= boardRect.right + 160 && e.clientY >= boardRect.top - 80 && e.clientY <= boardRect.bottom + 160;

  if (pointerNearBoard) {
    const cell = cellFromBoardPosition(xInBoard, yInBoard);

    if (hitsBlockedCell(piece, cell.r, cell.c)) {
      piece.placed = false;
      piece.boardR = null;
      piece.boardC = null;
      statusEl.textContent = `${piece.name} cannot be placed on blocked XXXX squares.`;
    } else {
      piece.placed = true;
      piece.boardR = cell.r;
      piece.boardC = cell.c;
      piece.z = ++zCounter;
      statusEl.textContent = `${piece.name} placed at row ${cell.r + 1}, column ${cell.c + 1}.`;
    }
  } else {
    piece.placed = false;
    piece.boardR = null;
    piece.boardC = null;
    statusEl.textContent = `${piece.name} returned to the piece bank.`;
  }

  drag.el.remove();
  drag = null;
  document.removeEventListener('pointermove', pointerMove);
  document.removeEventListener('pointerup', pointerUp);
  renderPieces();
  renderBoard();
  updateStats();
  checkWin();
}

function occupiedBoardCells(piece, baseR = piece.boardR, baseC = piece.boardC) {
  if (baseR === null || baseC === null) return [];
  return occupiedOffsets(piece.shape).map(([r, c]) => [baseR + r, baseC + c]);
}

function canPlacePiece(piece, baseR, baseC) {
  if (hitsBlockedCell(piece, baseR, baseC)) return { ok: false, reason: 'covers blocked square' };
  return { ok: true, reason: '' };
}

function getCoverageCounts() {
  const counts = new Map();
  pieces.forEach(p => {
    if (!p.placed) return;
    occupiedBoardCells(p).forEach(([r, c]) => {
      const key = `${r},${c}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return counts;
}

function getOpenRequiredCells() {
  const t = targets();
  const coverageCounts = getCoverageCounts();
  const cells = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 7; c++) {
      const label = BOARD[r][c];
      const key = `${r},${c}`;
      if (label !== null && !t.has(label) && !coverageCounts.has(key)) {
        cells.push({ r, c, key, label });
      }
    }
  }

  return cells;
}

function updatePieceValidityStyles() {
  pieces.forEach(piece => {
    const el = document.querySelector(`.piece[data-id="${piece.id}"]`);
    if (!el || !piece.placed) return;
    const valid = canPlacePiece(piece, piece.boardR, piece.boardC);
    if (!valid.ok) el.classList.add('invalid');
  });
}

function updateStats() {
  const placed = pieces.filter(p => p.placed).length;
  const required = requiredCellCount();
  const coverageCounts = getCoverageCounts();
  let mistakes = 0;
  let coveredRequired = 0;

  for (const [key, count] of coverageCounts.entries()) {
    const [r, c] = key.split(',').map(Number);
    if (!validBoardCell(r, c)) mistakes += count;
    else if (isTargetCell(r, c)) mistakes += count;
    else {
      if (count === 1) coveredRequired++;
      if (count > 1) mistakes += count - 1;
    }
  }

  placedCountEl.textContent = `${placed}/10`;
  coveredCountEl.textContent = `${coveredRequired}/${required}`;
  mistakeCountEl.textContent = String(mistakes);
  mistakeCountEl.className = mistakes ? 'stat-value bad-text' : 'stat-value';

  return { placed, coveredRequired, required, mistakes };
}

function checkWin() {
  const s = updateStats();
  if (s.placed === 10 && s.coveredRequired === s.required && s.mistakes === 0) {
    statusEl.innerHTML = `<span class="win">Solved!</span> You covered everything except ${monthSelect.value}, ${daySelect.value}, and ${weekdaySelect.value}.`;
  }
}

function rotateSelected() {
  const piece = pieces.find(p => p.id === selectedPieceId);
  if (!piece) {
    statusEl.textContent = 'Select a piece first.';
    return;
  }

  const oldShape = cloneShape(piece.shape);
  piece.shape = rotateShape(piece.shape);

  if (piece.placed && hitsBlockedCell(piece, piece.boardR, piece.boardC)) {
    piece.shape = oldShape;
    statusEl.textContent = `${piece.name} cannot rotate onto blocked XXXX squares.`;
  } else {
    piece.z = ++zCounter;
    clearHint(false);
    statusEl.textContent = `${piece.name} rotated.`;
  }

  renderPieces();
  renderBoard();
  updateStats();
  checkWin();
}

function flipSelected() {
  const piece = pieces.find(p => p.id === selectedPieceId);
  if (!piece) {
    statusEl.textContent = 'Select a piece first.';
    return;
  }

  const oldShape = cloneShape(piece.shape);
  piece.shape = flipShape(piece.shape);

  if (piece.placed && hitsBlockedCell(piece, piece.boardR, piece.boardC)) {
    piece.shape = oldShape;
    statusEl.textContent = `${piece.name} cannot flip onto blocked XXXX squares.`;
  } else {
    piece.z = ++zCounter;
    clearHint(false);
    statusEl.textContent = `${piece.name} flipped.`;
  }

  renderPieces();
  renderBoard();
  updateStats();
  checkWin();
}

function returnSelected() {
  const piece = pieces.find(p => p.id === selectedPieceId);
  if (!piece) {
    statusEl.textContent = 'Select a piece first.';
    return;
  }
  piece.placed = false;
  piece.boardR = null;
  piece.boardC = null;
  clearHint(false);
  statusEl.textContent = `${piece.name} returned to the piece bank.`;
  renderPieces();
  renderBoard();
  updateStats();
}

function resetPieces() {
  createPieces();
  statusEl.textContent = 'Pieces reset.';
  renderPieces();
  renderBoard();
  updateStats();
}

function useToday(shouldRender = true) {
  const now = new Date();
  monthSelect.value = MONTHS[now.getMonth()];
  daySelect.value = String(now.getDate());
  weekdaySelect.value = WEEKDAYS[now.getDay()];
  if (shouldRender) newGame();
}

function newGame() {
  createPieces();
  renderBoard();
  renderPieces();
  updateStats();
  statusEl.textContent = `New puzzle: leave ${monthSelect.value}, ${daySelect.value}, and ${weekdaySelect.value} uncovered.`;
}

function findCoverOptionsForCell(targetCell) {
  const coverageCounts = getCoverageCounts();
  const blockedByCurrentPieces = new Set();

  for (const [key, count] of coverageCounts.entries()) {
    if (count > 0) blockedByCurrentPieces.add(key);
  }

  const options = [];
  const remainingPieces = pieces.filter(p => !p.placed);

  for (const piece of remainingPieces) {
    const orientations = generateOrientations(piece.shape);

    for (let oi = 0; oi < orientations.length; oi++) {
      const offsets = orientations[oi];

      for (const [or, oc] of offsets) {
        const baseR = targetCell.r - or;
        const baseC = targetCell.c - oc;
        let ok = true;
        const coveredKeys = [];

        for (const [r, c] of offsets) {
          const rr = baseR + r;
          const cc = baseC + c;
          const key = `${rr},${cc}`;

          if (!validBoardCell(rr, cc)) {
            ok = false;
            break;
          }
          if (isTargetCell(rr, cc)) {
            ok = false;
            break;
          }
          if (blockedByCurrentPieces.has(key)) {
            ok = false;
            break;
          }
          coveredKeys.push(key);
        }

        if (ok) {
          options.push({
            pieceId: piece.id,
            pieceName: piece.name,
            orientationIndex: oi,
            baseR,
            baseC,
            coveredKeys
          });
        }
      }
    }
  }

  return options;
}

function getHint() {
  const stats = updateStats();
  const coverageCounts = getCoverageCounts();
  const dangerCells = new Set();
  const warningCells = new Set();

  for (const [key, count] of coverageCounts.entries()) {
    const [r, c] = key.split(',').map(Number);
    if (!validBoardCell(r, c) || isTargetCell(r, c) || count > 1) {
      dangerCells.add(key);
    }
  }

  if (dangerCells.size > 0) {
    activeHint = { r: -1, c: -1, optionCount: 0, dangerCells, warningCells };
    suggestedPieceIds = new Set();
    hintBox.textContent = 'Fix highlighted red cells first. They are either overlaps or pieces covering target cells.';
    renderBoard();
    renderPieces();
    return;
  }

  const openCells = getOpenRequiredCells();
  if (openCells.length === 0) {
    activeHint = null;
    suggestedPieceIds = new Set();
    hintBox.textContent = stats.mistakes === 0 ? 'No hint needed — the board is solved.' : 'No empty required cells remain, but mistakes still exist.';
    renderBoard();
    renderPieces();
    return;
  }

  let best = null;
  for (const cell of openCells) {
    const options = findCoverOptionsForCell(cell);
    if (!best || options.length < best.options.length) {
      best = { cell, options };
    }
  }

  if (!best) {
    hintBox.textContent = 'No hint available.';
    return;
  }

  if (best.options.length === 0) {
    warningCells.add(best.cell.key);
    activeHint = {
      r: best.cell.r,
      c: best.cell.c,
      optionCount: 0,
      dangerCells,
      warningCells
    };
    suggestedPieceIds = new Set();
    hintBox.textContent = `Problem cell: ${best.cell.label} at row ${best.cell.r + 1}, column ${best.cell.c + 1}. No remaining piece can cover it without conflict. Backtrack.`;
    renderBoard();
    renderPieces();
    return;
  }

  const pieceNames = [...new Set(best.options.map(o => o.pieceName))];
  suggestedPieceIds = new Set(best.options.map(o => o.pieceId));
  activeHint = {
    r: best.cell.r,
    c: best.cell.c,
    optionCount: best.options.length,
    dangerCells,
    warningCells
  };

  const topOptions = best.options.slice(0, 4).map(o => `${o.pieceName} at row ${o.baseR + 1}, col ${o.baseC + 1}`).join('\n');
  hintBox.textContent = `Best next target: ${best.cell.label} at row ${best.cell.r + 1}, column ${best.cell.c + 1}.\nPossible placements: ${best.options.length}\nSuggested pieces: ${pieceNames.join(', ')}\n\nExamples:\n${topOptions}`;

  renderBoard();
  renderPieces();
}

function clearHint(shouldRender = true) {
  activeHint = null;
  suggestedPieceIds = new Set();
  if (hintBox) hintBox.textContent = 'Hint output will appear here.';
  if (shouldRender) {
    renderBoard();
    renderPieces();
  }
}

function handleKeyboardShortcuts(e) {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  const key = e.key.toLowerCase();
  if (key === 'r') {
    e.preventDefault();
    rotateSelected();
  }
  if (key === 'f') {
    e.preventDefault();
    flipSelected();
  }
  if (key === 'h') {
    e.preventDefault();
    getHint();
  }
}

document.getElementById('todayBtn').addEventListener('click', () => useToday(true));
document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('rotateBtn').addEventListener('click', rotateSelected);
document.getElementById('flipBtn').addEventListener('click', flipSelected);
document.getElementById('hintBtn').addEventListener('click', getHint);
document.getElementById('clearHintBtn').addEventListener('click', () => clearHint(true));
document.getElementById('returnBtn').addEventListener('click', returnSelected);
document.getElementById('resetBtn').addEventListener('click', resetPieces);

monthSelect.addEventListener('change', newGame);
daySelect.addEventListener('change', newGame);
weekdaySelect.addEventListener('change', newGame);
window.addEventListener('keydown', handleKeyboardShortcuts);

window.addEventListener('resize', () => {
  renderPieces();
  renderBoard();
});

populateControls();
createPieces();
renderBoard();
renderPieces();
updateStats();
