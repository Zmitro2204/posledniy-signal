const game=document.querySelector('#game'),canvas=document.querySelector('#map'),ctx=canvas.getContext('2d'),dialog=document.querySelector('#minigame'),content=document.querySelector('#minigame-content'),message=document.querySelector('#message'),status=document.querySelector('#system-status');
const blueprint=new Image();let blueprintReady=false;blueprint.onload=()=>{blueprintReady=true;draw()};blueprint.src='assets/submarine-layout.png';
const S=16,done=new Set();let player={x:17,y:35},active=null;
const rooms=[
 {id:1,name:'РЕМОНТНЫЙ ОТСЕК',task:'power',x:15,y:33,w:7,h:5},
 {id:2,name:'ЭНЕРГООТСЕК',task:'pump',x:24,y:24,w:7,h:5},
 {id:3,name:'ГИДРОАКУСТИКА',task:'sonar',x:42,y:32,w:8,h:5},
 {id:4,name:'КАПИТАНСКИЙ МОСТИК',task:'code',x:44,y:19,w:7,h:5},
 {id:5,name:'КАЮТ-КОМПАНИЯ',task:'relay',x:52,y:26,w:9,h:5},
 {id:6,name:'КАМБУЗ / ОСУШЕНИЕ',task:'pump',x:69,y:32,w:7,h:5},
 {id:7,name:'ТРЮМ СВЯЗИ',task:'code',x:81,y:29,w:7,h:5}
];
rooms.forEach(r=>{r.tx=r.x+1+Math.floor(Math.random()*(r.w-2));r.ty=r.y+r.h-1});
const corridors=[
 [18,29,1,4],[18,29,6,1],[23,27,1,3],
 [31,27,10,1],[36,27,1,6],[36,32,6,1],
 [40,21,1,7],[40,21,4,1],
 [47,24,1,3],[47,26,5,1],
 [61,28,5,1],[65,28,1,6],[65,33,4,1],
 [76,34,4,1],[79,31,1,4],[79,31,2,1]
];
const walk=new Set(),key=(x,y)=>x+','+y;
function add(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)walk.add(key(i,j));}
rooms.forEach(r=>add(r.x,r.y,r.w,r.h));corridors.forEach(c=>add(...c));
function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)}
function say(t){message.textContent='РМ-01: '+t}
function reachable(x,y){const r=roomAt(x,y);return walk.has(key(x,y))&&(!r||r.id<=done.size+1)}
function draw(){
 const W=canvas.width,H=canvas.height;
 if(blueprintReady)ctx.drawImage(blueprint,0,0,W,H);else{ctx.fillStyle='#06151b';ctx.fillRect(0,0,W,H);return}
 ctx.fillStyle='#07191e';ctx.fillRect(1320,35,275,58);ctx.fillStyle='#f7bd54';ctx.font='32px VT323';ctx.textAlign='right';ctx.fillText('СИСТЕМЫ: '+done.size+' / 7',1575,77);ctx.textAlign='left';
 [[329,584],[445,444],[763,577],[788,359],[892,465],[1174,582],[1375,524]].forEach(([x,y])=>{ctx.fillStyle='#082329';ctx.fillRect(x-15,y-15,30,30)});
 ctx.fillStyle='#17413f';ctx.fillRect(623,486,35,30);ctx.strokeStyle='#b8fff0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(623,486);ctx.lineTo(658,486);ctx.moveTo(623,516);ctx.lineTo(658,516);ctx.stroke();
 rooms.forEach(r=>{const fixed=done.has(r.id),selected=r.id===done.size+1,x=r.x*S,y=r.y*S,w=r.w*S,h=r.h*S;ctx.strokeStyle='#082329';ctx.lineWidth=10;ctx.strokeRect(x,y,w,h);ctx.strokeStyle=selected?'#f7bd54':fixed?'#76e6c5':'#75b8b1';ctx.lineWidth=selected?4:2;if(selected){ctx.shadowColor='#f7bd54';ctx.shadowBlur=14}ctx.strokeRect(x,y,w,h);ctx.shadowBlur=0;const tx=(r.tx+.5)*S,ty=(r.ty+.5)*S;ctx.fillStyle=fixed?'#76e6c5':'#ef6b5d';ctx.fillRect(tx-8,ty-8,16,16);ctx.strokeStyle='#e2fff2';ctx.lineWidth=2;ctx.strokeRect(tx-10,ty-10,20,20)});
 const px=(player.x+.5)*S,py=(player.y+.5)*S;ctx.fillStyle='#76e6c5';ctx.fillRect(px-7,py-6,14,12);ctx.strokeStyle='#e2fff2';ctx.lineWidth=2;ctx.strokeRect(px-8,py-7,16,14);ctx.fillStyle='#f7bd54';ctx.fillRect(px+2,py-2,4,4);
 if(active){const tx=(active.tx+.5)*S,ty=(active.ty+.5)*S;ctx.strokeStyle='#f7bd54';ctx.lineWidth=2;ctx.strokeRect(tx-18,ty-18,36,36)}
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
