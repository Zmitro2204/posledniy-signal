const game=document.querySelector('#game'),canvas=document.querySelector('#map'),ctx=canvas.getContext('2d'),dialog=document.querySelector('#minigame'),content=document.querySelector('#minigame-content'),message=document.querySelector('#message'),status=document.querySelector('#system-status');
const blueprint=new Image();let blueprintReady=false;blueprint.onload=()=>{blueprintReady=true;draw()};blueprint.src='assets/submarine-blueprint.png';
const S=24,OX=130,OY=200,done=new Set();let player={x:3,y:11},active=null;
const rooms=[
 {id:1,name:'РЕМОНТНЫЙ ОТСЕК',task:'power',x:2,y:7,w:6,h:6,tx:5,ty:10},
 {id:2,name:'ЭНЕРГООТСЕК',task:'pump',x:8,y:7,w:6,h:6,tx:11,ty:10},
 {id:3,name:'ГИДРОАКУСТИКА',task:'sonar',x:14,y:7,w:6,h:6,tx:17,ty:10},
 {id:4,name:'КАПИТАНСКИЙ МОСТИК',task:'code',x:20,y:7,w:6,h:6,tx:23,ty:10},
 {id:5,name:'КАЮТ-КОМПАНИЯ',task:'relay',x:26,y:7,w:6,h:6,tx:29,ty:10},
 {id:6,name:'КАМБУЗ / ОСУШЕНИЕ',task:'pump',x:32,y:7,w:6,h:6,tx:35,ty:10},
 {id:7,name:'ТРЮМ СВЯЗИ',task:'code',x:38,y:7,w:6,h:6,tx:41,ty:10}
];
const corridors=[];
const walk=new Set(),key=(x,y)=>x+','+y;
function add(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)walk.add(key(i,j));}
rooms.forEach(r=>add(r.x,r.y,r.w,r.h));corridors.forEach(c=>add(...c));
function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)}
function say(t){message.textContent='РМ-01: '+t}
function reachable(x,y){const r=roomAt(x,y);return walk.has(key(x,y))&&(!r||r.id<=done.size+1)}
function draw(){
 const W=canvas.width,H=canvas.height,visual=[
  [228,404,151,155],[379,404,158,155],[537,404,166,155],[703,404,170,155],[873,404,167,155],[1040,404,167,155],[1207,404,165,155]
 ];
 if(blueprintReady)ctx.drawImage(blueprint,0,0,W,H);else{ctx.fillStyle='#06151b';ctx.fillRect(0,0,W,H);return}
 ctx.fillStyle='#07191e';ctx.fillRect(1320,35,275,58);ctx.fillStyle='#f7bd54';ctx.font='32px VT323';ctx.textAlign='right';ctx.fillText('СИСТЕМЫ: '+done.size+' / 7',1575,77);ctx.textAlign='left';
 rooms.forEach(r=>{const v=visual[r.id-1],fixed=done.has(r.id),selected=r.id===done.size+1,tx=v[0]+v[2]/2,ty=v[1]+v[3]*.56;if(selected){ctx.strokeStyle='#f7bd54';ctx.lineWidth=4;ctx.shadowColor='#f7bd54';ctx.shadowBlur=15;ctx.strokeRect(v[0]+3,v[1]+3,v[2]-6,v[3]-6);ctx.shadowBlur=0}ctx.fillStyle=fixed?'#76e6c5':'#ef6b5d';ctx.fillRect(tx-10,ty-10,20,20);ctx.strokeStyle='#e2fff2';ctx.lineWidth=2;ctx.strokeRect(tx-12,ty-12,24,24)});
 const current=roomAt(player.x,player.y);if(current){const v=visual[current.id-1],px=v[0]+(player.x-current.x+.5)*v[2]/current.w,py=v[1]+(player.y-current.y+.5)*v[3]/current.h;ctx.fillStyle='#76e6c5';ctx.fillRect(px-9,py-9,18,16);ctx.strokeStyle='#e2fff2';ctx.lineWidth=2;ctx.strokeRect(px-10,py-10,20,18);ctx.fillStyle='#f7bd54';ctx.fillRect(px+3,py-3,4,4)}
 if(active){const v=visual[active.id-1];ctx.strokeStyle='#f7bd54';ctx.lineWidth=2;ctx.strokeRect(v[0]+v[2]/2-27,v[1]+v[3]*.56-27,54,54)}
 ctx.fillStyle='#07191e';ctx.fillRect(44,750,W-88,72);ctx.fillStyle='#e1f7ec';ctx.font='35px VT323';ctx.fillText(message.textContent,64,796);
 ctx.fillStyle='#07191e';ctx.fillRect(1370,655,225,80);ctx.fillStyle='#7fa4a5';ctx.font='18px VT323';['ДАТЧИКИ:  НОРМА','КОРПУС:   ЦЕЛ','ПИТАНИЕ:  '+done.size+' / 7'].forEach((t,i)=>ctx.fillText(t,1390,680+i*21));
}
function update(){const r=roomAt(player.x,player.y);active=r&&!done.has(r.id)&&Math.abs(player.x-r.tx)+Math.abs(player.y-r.ty)<=1?r:null;draw();}
function finish(id){done.add(id);status.textContent='СИСТЕМЫ: '+done.size+' / 7';dialog.close();say(id===7?'СИГНАЛ ПЕРЕДАН. В ГЛУБИНЕ ЕСТЬ ОТВЕТ.':'Система восстановлена. Открыт следующий шлюз.');game.focus();update()}
function mount(title,copy,hint,body){content.innerHTML='<button class="hint">?</button><h2 class="mini-title">'+title+'</h2><p class="mini-copy">'+copy+'</p><div class="hint-box"></div>'+body;content.querySelector('.hint').onclick=()=>content.querySelector('.hint-box').textContent='ПОДСКАЗКА: '+hint;}
function power(id){
 const symbols=['◉','⚙','◆','☼','✦','◈','☍','✚'],deck=[...symbols,...symbols].sort(()=>Math.random()-.5),open=Array(16).fill(false),matched=Array(16).fill(false);let first=null,scanning=false,scanTimer,scanInterval;
 mount('ЩИТ ПИТАНИЯ','Память щита: найдите восемь пар символов. После запуска сканер на 10 секунд покажет всю схему.','Нажмите «СБРОС / СКАН» в любой момент: все символы снова откроются на 10 секунд.','<div class="memory-grid">'+deck.map((_,i)=>'<button class="memory-card" data-i="'+i+'">?</button>').join('')+'</div><div class="mini-status">СКАНЕР ГОТОВ</div><button class="reset">СБРОС / СКАН: 10 СЕК.</button>');
 const cards=[...content.querySelectorAll('.memory-card')],miniStatus=content.querySelector('.mini-status');
 const draw=()=>cards.forEach((b,i)=>{const visible=scanning||open[i]||matched[i];b.textContent=visible?deck[i]:'?';b.classList.toggle('open',visible);b.classList.toggle('matched',matched[i]);b.disabled=scanning||matched[i]});
 const scan=()=>{clearTimeout(scanTimer);clearInterval(scanInterval);scanning=true;first=null;open.fill(false);let left=10;miniStatus.textContent='СКАНИРОВАНИЕ: '+left+' СЕК.';draw();scanInterval=setInterval(()=>{left--;miniStatus.textContent='СКАНИРОВАНИЕ: '+left+' СЕК.'},1000);scanTimer=setTimeout(()=>{clearInterval(scanInterval);scanning=false;miniStatus.textContent='НАЙДИТЕ ПАРЫ';draw()},10000)};
 cards.forEach(b=>b.onclick=()=>{if(scanning)return;const i=+b.dataset.i;if(open[i]||matched[i])return;open[i]=true;draw();if(first===null){first=i;miniStatus.textContent='ВЫБЕРИТЕ ВТОРУЮ КАРТОЧКУ';return}const other=first;first=null;if(deck[i]===deck[other]){matched[i]=matched[other]=true;open[i]=open[other]=false;miniStatus.textContent='ПАРА НАЙДЕНА';draw();if(matched.every(Boolean))finish(id)}else{miniStatus.textContent='НЕ ПАРА';setTimeout(()=>{open[i]=open[other]=false;miniStatus.textContent='НАЙДИТЕ ПАРЫ';draw()},650)}});
 content.querySelector('.reset').onclick=scan;scan();
}
function pump(id){const directions=['ВНИЗ','ВЛЕВО','ВВЕРХ','ВПРАВО'],r=[2,1,3,0];mount(id===6?'ОСУШИТЕЛЬНЫЙ НАСОС':'НАСОС № 4','Поверните каждый клапан в положение, указанное в схеме.','Цель слева направо: ВНИЗ → ВЛЕВО → ВВЕРХ → ВПРАВО. Нажатие переключает положение по этому кругу.','<div class="flow-target">ЦЕЛЬ: <b>ВНИЗ</b> → <b>ВЛЕВО</b> → <b>ВВЕРХ</b> → <b>ВПРАВО</b></div><div class="pipe-grid">'+r.map((v,i)=>'<button class="pipe-cell" data-i="'+i+'"><small>КЛАПАН '+(i+1)+'</small><strong>'+directions[v]+'</strong></button>').join('')+'</div>');content.querySelectorAll('.pipe-cell').forEach(b=>b.onclick=()=>{let i=+b.dataset.i;r[i]=(r[i]+1)%4;b.querySelector('strong').textContent=directions[r[i]];if(r.every((v,i)=>v===i))finish(id)})}
function sonar(id){
 let sequence=[],input=[],playing=false,timers=[];
 mount('ГИДРОАКУСТИКА','Прослушайте и повторите шесть импульсов. Нажимайте на большие кнопки «ИМПУЛЬ».','Кнопка «НОВЫЙ СИГНАЛ» каждый раз создаёт другую комбинацию. Пока индикаторы мигают, дождитесь окончания передачи.','<div class="sequence">'+[0,1,2,3].map(i=>'<button class="tone tone-'+i+'" data-i="'+i+'" aria-label="Импульс '+(i+1)+'"><small>ИМПУЛЬ</small><strong>'+(i+1)+'</strong></button>').join('')+'</div><div class="mini-status">ГОТОВ К ПЕРЕДАЧЕ</div><button class="replay">НОВЫЙ СИГНАЛ</button>');
 const tones=[...content.querySelectorAll('.tone')],miniStatus=content.querySelector('.mini-status');
 const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
 function playNew(){timers.forEach(clearTimeout);timers=[];sequence=Array.from({length:6},()=>Math.floor(Math.random()*4));input=[];playing=true;tones.forEach(t=>t.classList.remove('flash'));miniStatus.textContent='СЛУШАЙТЕ…';let n=0;const next=()=>{if(n===sequence.length){playing=false;miniStatus.textContent='ПОВТОРИТЕ СИГНАЛ';return}const tone=tones[sequence[n++]];tone.classList.add('flash');later(()=>{tone.classList.remove('flash');later(next,170)},420)};later(next,350)}
 content.querySelector('.replay').onclick=playNew;
 tones.forEach(b=>b.onclick=()=>{if(playing){miniStatus.textContent='ДОЖДИТЕСЬ КОНЦА ПЕРЕДАЧИ';return}const value=+b.dataset.i;input.push(value);b.classList.add('flash');later(()=>b.classList.remove('flash'),160);if(value!==sequence[input.length-1]){input=[];miniStatus.textContent='ОШИБКА. ЗАПРОСИТЕ НОВЫЙ СИГНАЛ.'}else if(input.length===sequence.length)finish(id);else miniStatus.textContent='ПРИНЯТО: '+input.length+' / '+sequence.length});
 playNew();
}
function code(id){const answer=id===4?'731':'407';let typed='';mount(id===4?'КАПИТАНСКИЙ МОСТИК':'ТРЮМ СВЯЗИ','Введите код доступа на терминале.','Код написан в самой задаче: для мостика — номер каюты 7, палубы 3, поста 1. Для трюма — сектор 4, ячейка 0, канал 7.','<div class="choices">'+[0,1,2,3,4,7].map(n=>'<button class="choice" data-n="'+n+'">'+n+'</button>').join('')+'</div><div class="mini-status">КОД: ———</div>');content.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{typed+=b.dataset.n;content.querySelector('.mini-status').textContent='КОД: '+typed;if(typed.length===3){if(typed===answer)finish(id);else {content.querySelector('.mini-status').textContent='НЕВЕРНО. СБРОС.';typed=''}}})}
function relay(id){const correct=[2,0,3,1],input=[];mount('КАЮТ-КОМПАНИЯ','Перезапустите аварийное освещение: выберите четыре реле по порядку.','Слева направо лампы мигают: третья, первая, четвёртая, вторая.','<div class="choices">'+[0,1,2,3].map(n=>'<button class="choice" data-n="'+n+'">'+(n+1)+'</button>').join('')+'</div><div class="mini-status">ОЧЕРЕДЬ РЕЛЕ</div>');content.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{input.push(+b.dataset.n);if(input.at(-1)!==correct[input.length-1]){input.length=0;content.querySelector('.mini-status').textContent='СБРОС ЦЕПИ'}else if(input.length===4)finish(id)})}
function open(r){({power,pump,sonar,code,relay})[r.task](r.id);dialog.showModal()}
window.addEventListener('keydown',e=>{if(dialog.open){if(e.key==='Escape')dialog.close();return}const d={ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0],ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1]}[e.key];if(d){e.preventDefault();let x=player.x+d[0],y=player.y+d[1];if(reachable(x,y))player={x,y};else say('Здесь сплошная переборка или закрытый шлюз.');update()}if((e.key==='e'||e.key==='E')&&active)open(active);if(e.key==='r'||e.key==='R')say(active?'ЦЕЛЬ: '+active.name+'. Подлетите к центральному терминалу и нажмите E.':'ЦЕЛЬ: найдите красный терминал в доступном отсеке.');});
document.querySelector('#close-game').onclick=()=>dialog.close();game.addEventListener('click',()=>game.focus());game.focus();update();
