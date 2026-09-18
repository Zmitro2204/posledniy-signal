const game = document.querySelector('#game');
const drone = document.querySelector('#drone');
const prompt = document.querySelector('#prompt');
const message = document.querySelector('#message');
const status = document.querySelector('#system-status');
const dialog = document.querySelector('#minigame');
const content = document.querySelector('#minigame-content');
let position = 12, hovering = false, repaired = new Set(), activeTerminal = null;
const terminals = [...document.querySelectorAll('.terminal')];

function say(text) { message.textContent = `СИСТЕМА РМ-01: ${text}`; }
function updateDrone() { drone.style.left = `${position}%`; drone.style.bottom = hovering ? '21%' : '8%'; }
function currentTerminal() { return terminals.find(t => !t.closest('.locked') && !repaired.has(t.dataset.room) && Math.abs((Number(t.dataset.room) * 33 - 17) - position) < 10); }
function updatePrompt() { activeTerminal = currentTerminal(); prompt.classList.toggle('hidden', !activeTerminal); }
function repair(room) {
  repaired.add(room);
  const element = document.querySelector(`#room-${room}`);
  element.classList.remove('locked'); element.classList.add('fixed');
  element.querySelector('.terminal small').textContent = 'НОРМА';
  if (room === '1') document.querySelector('.door-one').classList.add('open');
  if (room === '2') document.querySelector('.door-two').classList.add('open');
  status.textContent = `СИСТЕМЫ: ${repaired.size} / 3`;
  const notes = { 1:'ЩИТ ПИТАНИЯ ВОССТАНОВЛЕН. ДОСТУП В ЭНЕРГООТСЕК ОТКРЫТ.', 2:'НАСОС № 4 ЗАПУЩЕН. ДАВЛЕНИЕ СТАБИЛИЗИРУЕТСЯ.', 3:'СОНАР АКТИВЕН. В ГЛУБИНЕ ОБНАРУЖЕН СЛАБЫЙ ОТВЕТНЫЙ СИГНАЛ...' };
  say(notes[room]);
  dialog.close(); game.focus(); updatePrompt();
}
function powerGame() {
  const cells = Array(9).fill(''); let turns = 0;
  content.innerHTML = `<h2 class="mini-title">ЩИТ ПИТАНИЯ</h2><p class="mini-copy">Соберите линию питания. Автоматика закорачивает одну свободную ячейку после каждого вашего хода.</p><div class="grid">${cells.map((_,i)=>`<button class="cell" data-cell="${i}"></button>`).join('')}</div><div class="mini-status">ВАШ ХОД · СОБЕРИТЕ ТРИ СИГНАЛА</div>`;
  const check = mark => [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(line => line.every(i=>cells[i]===mark));
  content.querySelectorAll('.cell').forEach(button => button.onclick = () => {
    const i = +button.dataset.cell; if(cells[i] || dialog.open === false) return;
    cells[i]='●';button.textContent='●';turns++;
    if(check('●')) return repair('1');
    const free=cells.map((v,i)=>v?'':i).filter(v=>v!==''); if(!free.length) return powerGame();
    const bad=free[Math.floor(Math.random()*free.length)];cells[bad]='×';const b=content.querySelector(`[data-cell="${bad}"]`);b.textContent='×';b.classList.add('bad');
    if(check('×')) { content.querySelector('.mini-status').textContent='КОРОТКОЕ ЗАМЫКАНИЕ. ПОПРОБУЙТЕ СНОВА.'; setTimeout(powerGame,900); }
  });
}
function pumpGame() {
  const shapes=['╹','╺','╻','╸']; const target=['╹','╺','╻','╸']; let rotations=[2,1,3,0];
  content.innerHTML=`<h2 class="mini-title">НАСОС № 4</h2><p class="mini-copy">Поверните клапаны, чтобы пустить давление по контуру.</p><div class="pipe-grid">${rotations.map((r,i)=>`<button class="pipe-cell" data-pipe="${i}">${shapes[r]}</button>`).join('')}</div><div class="mini-status">СОВМЕСТИТЕ ВСЕ КЛАПАНЫ</div>`;
  content.querySelectorAll('.pipe-cell').forEach(button=>button.onclick=()=>{const i=+button.dataset.pipe;rotations[i]=(rotations[i]+1)%4;button.textContent=shapes[rotations[i]];if(rotations.every((r,i)=>r===i)) repair('2');});
}
function sonarGame() {
  const pattern=[0,2,1,3]; let input=[];
  content.innerHTML=`<h2 class="mini-title">ГИДРОАКУСТИКА</h2><p class="mini-copy">Повторите импульсы. Сонар помнит чужой сигнал.</p><div class="sequence">${[0,1,2,3].map(i=>`<button class="tone" data-tone="${i}"></button>`).join('')}</div><div class="mini-status">СЛУШАЙТЕ...</div>`;
  const tones=[...content.querySelectorAll('.tone')]; let ix=0;
  const play=()=>{ if(ix>=pattern.length){content.querySelector('.mini-status').textContent='ПОВТОРИТЕ ПОСЛЕДОВАТЕЛЬНОСТЬ';return;} tones[pattern[ix]].classList.add('flash');setTimeout(()=>{tones[pattern[ix]].classList.remove('flash');ix++;setTimeout(play,180)},420)}; setTimeout(play,500);
  tones.forEach(t=>t.onclick=()=>{if(ix<pattern.length)return;input.push(+t.dataset.tone);t.classList.add('flash');setTimeout(()=>t.classList.remove('flash'),130);if(input[input.length-1]!==pattern[input.length-1]){content.querySelector('.mini-status').textContent='СИГНАЛ ИСКАЖЁН. ЕЩЁ РАЗ.';setTimeout(sonarGame,700)}else if(input.length===pattern.length)repair('3');});
}
function openGame(task) { ({power:powerGame,pump:pumpGame,sonar:sonarGame})[task](); dialog.showModal(); }
window.addEventListener('keydown', event => { if(dialog.open){if(event.key==='Escape')dialog.close();return;} if(['ArrowLeft','a','A'].includes(event.key)){position=Math.max(3,position-2);drone.className='drone facing-left';} if(['ArrowRight','d','D'].includes(event.key)){position=Math.min(95,position+2);drone.className='drone facing-right';} if(['ArrowUp','w','W',' '].includes(event.key)){hovering=true;setTimeout(()=>{hovering=false;updateDrone()},280)} if((event.key==='e'||event.key==='E')&&activeTerminal)openGame(activeTerminal.dataset.task); updateDrone();updatePrompt(); });
document.querySelector('#close-game').onclick=()=>dialog.close(); terminals.forEach(t=>t.onclick=()=>openGame(t.dataset.task)); game.addEventListener('click',()=>game.focus());
setTimeout(()=>say('ПИТАНИЕ: АВАРИЙНЫЙ РЕЖИМ. НАЙДЕНА НЕИСПРАВНОСТЬ.'),900); updateDrone();
