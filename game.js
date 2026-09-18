const game = document.querySelector('#game');
const drone = document.querySelector('#drone');
const prompt = document.querySelector('#prompt');
const message = document.querySelector('#message');
const status = document.querySelector('#system-status');
const dialog = document.querySelector('#minigame');
const content = document.querySelector('#minigame-content');
const terminals = [...document.querySelectorAll('.terminal')];

let position = 12;
let altitude = 8;
let repaired = new Set();
let activeTerminal = null;

function say(text) { message.textContent = `СИСТЕМА РМ-01: ${text}`; }
function updateDrone() { drone.style.left = `${position}%`; drone.style.bottom = `${altitude}%`; }
function currentTerminal() {
  return terminals.find(terminal => !terminal.closest('.locked') && !repaired.has(terminal.dataset.room)
    && Math.abs((Number(terminal.dataset.room) * 33 - 17) - position) < 9 && Math.abs(altitude - 38) < 12);
}
function updatePrompt() { activeTerminal = currentTerminal(); prompt.classList.toggle('hidden', !activeTerminal); }
function lockedDoorBetween(from, to) {
  return [{ x: 33.33, room: '1', name: 'ШЛЮЗ 01' }, { x: 66.66, room: '2', name: 'ШЛЮЗ 02' }]
    .find(door => !repaired.has(door.room) && ((from < door.x && to >= door.x - 1.4) || (from > door.x && to <= door.x + 1.4)));
}
function moveHorizontal(delta) {
  const next = Math.max(4, Math.min(95, position + delta));
  const door = lockedDoorBetween(position, next);
  if (door) { say(`${door.name}: ЗАБЛОКИРОВАН. ВОССТАНОВИТЕ СИСТЕМУ В ТЕКУЩЕМ ОТСЕКЕ.`); return; }
  position = next;
}

function repair(room) {
  repaired.add(room);
  const element = document.querySelector(`#room-${room}`);
  element.classList.remove('locked');
  element.classList.add('fixed');
  element.querySelector('.terminal small').textContent = 'НОРМА';
  if (room === '1') {
    const door = document.querySelector('.door-one'); door.classList.add('open'); door.querySelector('.door-sign').innerHTML = 'ШЛЮЗ 01<br>ОТКРЫТ';
  }
  if (room === '2') {
    const door = document.querySelector('.door-two'); door.classList.add('open'); door.querySelector('.door-sign').innerHTML = 'ШЛЮЗ 02<br>ОТКРЫТ';
  }
  status.textContent = `СИСТЕМЫ: ${repaired.size} / 3`;
  say({ 1: 'ЩИТ ПИТАНИЯ ВОССТАНОВЛЕН. ШЛЮЗ 01 ОТКРЫТ.', 2: 'НАСОС № 4 ЗАПУЩЕН. ШЛЮЗ 02 ОТКРЫТ.', 3: 'СОНАР АКТИВЕН. В ГЛУБИНЕ ОБНАРУЖЕН СЛАБЫЙ ОТВЕТНЫЙ СИГНАЛ...' }[room]);
  dialog.close(); game.focus(); updatePrompt();
}

function powerGame() {
  const initial = [1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
  let cells = [...initial];
  content.innerHTML = `<h2 class="mini-title">ЩИТ ПИТАНИЯ</h2><p class="mini-copy">Калибровка 4×4: касание переключает ячейку и четыре соседние. Зажгите весь контур.</p><div class="grid">${cells.map((_, i) => `<button class="cell" data-cell="${i}"></button>`).join('')}</div><div class="mini-status">НАЙДИТЕ ПОСЛЕДОВАТЕЛЬНОСТЬ ПЕРЕКЛЮЧЕНИЙ</div><button class="reset">СБРОСИТЬ КАЛИБРОВКУ</button>`;
  const draw = () => content.querySelectorAll('.cell').forEach((button, i) => { button.textContent = cells[i] ? '●' : '×'; button.classList.toggle('lit', Boolean(cells[i])); });
  const toggle = i => { if (i >= 0 && i < 16) cells[i] = cells[i] ? 0 : 1; };
  content.querySelectorAll('.cell').forEach(button => button.onclick = () => {
    const i = Number(button.dataset.cell);
    toggle(i); if (i % 4) toggle(i - 1); if (i % 4 < 3) toggle(i + 1); toggle(i - 4); toggle(i + 4);
    draw(); if (cells.every(Boolean)) repair('1');
  });
  content.querySelector('.reset').onclick = () => { cells = [...initial]; draw(); };
  draw();
}

function pumpGame() {
  const shapes = ['╹', '╺', '╻', '╸']; const rotations = [2, 1, 3, 0];
  content.innerHTML = `<h2 class="mini-title">НАСОС № 4</h2><p class="mini-copy">Поверните клапаны, чтобы пустить давление по контуру.</p><div class="pipe-grid">${rotations.map((r, i) => `<button class="pipe-cell" data-pipe="${i}">${shapes[r]}</button>`).join('')}</div><div class="mini-status">СОВМЕСТИТЕ ВСЕ КЛАПАНЫ</div>`;
  content.querySelectorAll('.pipe-cell').forEach(button => button.onclick = () => {
    const i = Number(button.dataset.pipe); rotations[i] = (rotations[i] + 1) % 4; button.textContent = shapes[rotations[i]];
    if (rotations.every((r, index) => r === index)) repair('2');
  });
}

function sonarGame() {
  const pattern = [0, 2, 1, 3, 1, 0]; const input = [];
  content.innerHTML = `<h2 class="mini-title">ГИДРОАКУСТИКА</h2><p class="mini-copy">Повторите шесть импульсов. Сонар помнит чужой сигнал.</p><div class="sequence">${[0, 1, 2, 3].map(i => `<button class="tone" data-tone="${i}"></button>`).join('')}</div><div class="mini-status">СЛУШАЙТЕ...</div>`;
  const tones = [...content.querySelectorAll('.tone')]; let ix = 0;
  const play = () => {
    if (ix >= pattern.length) { content.querySelector('.mini-status').textContent = 'ПОВТОРИТЕ ПОСЛЕДОВАТЕЛЬНОСТЬ'; return; }
    tones[pattern[ix]].classList.add('flash'); setTimeout(() => { tones[pattern[ix]].classList.remove('flash'); ix++; setTimeout(play, 180); }, 420);
  };
  setTimeout(play, 500);
  tones.forEach(tone => tone.onclick = () => {
    if (ix < pattern.length) return;
    input.push(Number(tone.dataset.tone)); tone.classList.add('flash'); setTimeout(() => tone.classList.remove('flash'), 130);
    if (input.at(-1) !== pattern[input.length - 1]) { content.querySelector('.mini-status').textContent = 'СИГНАЛ ИСКАЖЁН. ЕЩЁ РАЗ.'; setTimeout(sonarGame, 700); }
    else if (input.length === pattern.length) repair('3');
  });
}

function openGame(task) { ({ power: powerGame, pump: pumpGame, sonar: sonarGame })[task](); dialog.showModal(); }
window.addEventListener('keydown', event => {
  if (dialog.open) { if (event.key === 'Escape') dialog.close(); return; }
  const key = event.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) event.preventDefault();
  if (['ArrowLeft', 'a', 'A'].includes(key)) { moveHorizontal(-2); drone.className = 'drone facing-left'; }
  if (['ArrowRight', 'd', 'D'].includes(key)) { moveHorizontal(2); drone.className = 'drone facing-right'; }
  if (['ArrowUp', 'w', 'W', ' '].includes(key)) { altitude = Math.min(78, altitude + 7); drone.classList.add('thrusting'); }
  if (['ArrowDown', 's', 'S'].includes(key)) { altitude = Math.max(8, altitude - 7); drone.classList.add('thrusting'); }
  if ((key === 'e' || key === 'E') && activeTerminal) openGame(activeTerminal.dataset.task);
  updateDrone(); updatePrompt(); setTimeout(() => drone.classList.remove('thrusting'), 140);
});
document.querySelector('#close-game').onclick = () => dialog.close();
terminals.forEach(terminal => terminal.onclick = () => { say('ПОДЛЕТИТЕ К ТЕРМИНАЛУ И НАЖМИТЕ E.'); game.focus(); });
game.addEventListener('click', () => game.focus());
setTimeout(() => { say('ПИТАНИЕ: АВАРИЙНЫЙ РЕЖИМ. ПОДНИМИТЕСЬ К ЩИТУ И НАЖМИТЕ E.'); game.focus(); }, 900);
updateDrone(); updatePrompt();
