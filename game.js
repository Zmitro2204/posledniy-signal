const game=document.querySelector('#game'),canvas=document.querySelector('#map'),ctx=canvas.getContext('2d'),dialog=document.querySelector('#minigame'),content=document.querySelector('#minigame-content'),message=document.querySelector('#message'),status=document.querySelector('#system-status');
const S=24,done=new Set();let player={x:3,y:8},active=null;
const rooms=[
 {id:1,name:'РЕМОНТНЫЙ ОТСЕК',task:'power',x:2,y:4,w:7,h:7,tx:5,ty:7},
 {id:2,name:'ЭНЕРГООТСЕК',task:'pump',x:12,y:4,w:7,h:7,tx:15,ty:7},
 {id:3,name:'ГИДРОАКУСТИКА',task:'sonar',x:22,y:4,w:7,h:7,tx:25,ty:7},
 {id:4,name:'КАПИТАНСКИЙ МОСТИК',task:'code',x:37,y:2,w:8,h:7,tx:41,ty:5},
 {id:5,name:'КАЮТ-КОМПАНИЯ',task:'relay',x:8,y:13,w:7,h:4,tx:11,ty:15},
 {id:6,name:'КАМБУЗ / ОСУШЕНИЕ',task:'pump',x:21,y:13,w:7,h:4,tx:24,ty:15},
 {id:7,name:'ТРЮМ СВЯЗИ',task:'code',x:35,y:12,w:8,h:5,tx:39,ty:14}
];
const corridors=[ [9,7,3,1],[19,7,3,1],[29,7,8,1],[15,11,1,2],[15,13,6,1],[28,14,7,1],[39,9,1,3] ];
const walk=new Set(),key=(x,y)=>x+','+y;
function add(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)walk.add(key(i,j));}
rooms.forEach(r=>add(r.x,r.y,r.w,r.h));corridors.forEach(c=>add(...c));
function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)}
function say(t){message.textContent='РМ-01: '+t}
function reachable(x,y){const r=roomAt(x,y);return walk.has(key(x,y))&&(!r||r.id<=done.size+1)}
function draw(){
 ctx.clearRect(0,0,1200,500);ctx.fillStyle='#06151b';ctx.fillRect(0,0,1200,500);
 ctx.strokeStyle='#31565e';ctx.lineWidth=9;ctx.strokeRect(18,26,1125,405);ctx.fillStyle='#0b2229';ctx.fillRect(22,30,1117,397);
 corridors.forEach(c=>{ctx.fillStyle='#173640';ctx.fillRect(c[0]*S,c[1]*S,c[2]*S,c[3]*S)});
 rooms.forEach(r=>{const unlocked=r.id<=done.size+1, fixed=done.has(r.id);ctx.fillStyle=fixed?'#17403f':unlocked?'#102e35':'#0a171c';ctx.fillRect(r.x*S,r.y*S,r.w*S,r.h*S);ctx.strokeStyle=unlocked?'#5c8b89':'#2b454b';ctx.lineWidth=4;ctx.strokeRect(r.x*S,r.y*S,r.w*S,r.h*S);ctx.fillStyle=unlocked?'#b7ddd3':'#52666a';ctx.font='18px VT323';ctx.fillText(('0'+r.id).slice(-2)+' · '+r.name,r.x*S+8,r.y*S+22);
  ctx.fillStyle=fixed?'#76e6c5':'#ef6b5d';ctx.fillRect((r.tx-.5)*S,(r.ty-.5)*S,S,S);ctx.strokeStyle='#d7f5e8';ctx.strokeRect((r.tx-.5)*S,(r.ty-.5)*S,S,S);
 });
 rooms.slice(1).forEach(r=>{if(r.id>done.size+1){ctx.fillStyle='#263b41';ctx.fillRect((r.x-1)*S,(r.ty-.75)*S,12,S*1.5);ctx.fillStyle='#ef6b5d';ctx.font='13px VT323';ctx.fillText('ЗАКРЫТО',(r.x-1.2)*S,(r.ty-1)*S)}});
 ctx.fillStyle='#76e6c5';ctx.fillRect((player.x+.15)*S,(player.y+.2)*S,S*.7,S*.6);ctx.fillStyle='#f7bd54';ctx.fillRect((player.x+.55)*S,(player.y+.4)*S,5,5);
 if(active){ctx.strokeStyle='#f7bd54';ctx.lineWidth=2;ctx.strokeRect((active.tx-1)*S,(active.ty-1)*S,S*2,S*2)}
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
function sonar(id){const p=[0,2,1,3,1,0],input=[];mount('ГИДРОАКУСТИКА','Повторите шесть импульсов неизвестного сигнала.','Смотрите до конца: импульсы повторяются в порядке 1, 3, 2, 4, 2, 1.','<div class="sequence">'+[0,1,2,3].map(i=>'<button class="tone" data-i="'+i+'"></button>').join('')+'</div><div class="mini-status">СЛУШАЙТЕ…</div>');let tones=[...content.querySelectorAll('.tone')],n=0;function play(){if(n===p.length){content.querySelector('.mini-status').textContent='ПОВТОРИТЕ';return}tones[p[n]].classList.add('flash');setTimeout(()=>{tones[p[n++]].classList.remove('flash');setTimeout(play,160)},360)}setTimeout(play,450);tones.forEach(b=>b.onclick=()=>{if(n<p.length)return;input.push(+b.dataset.i);if(input.at(-1)!==p[input.length-1]){content.querySelector('.mini-status').textContent='ИСКАЖЕНИЕ — СНОВА';setTimeout(()=>sonar(id),700)}else if(input.length===p.length)finish(id)})}
function code(id){const answer=id===4?'731':'407';let typed='';mount(id===4?'КАПИТАНСКИЙ МОСТИК':'ТРЮМ СВЯЗИ','Введите код доступа на терминале.','Код написан в самой задаче: для мостика — номер каюты 7, палубы 3, поста 1. Для трюма — сектор 4, ячейка 0, канал 7.','<div class="choices">'+[0,1,2,3,4,7].map(n=>'<button class="choice" data-n="'+n+'">'+n+'</button>').join('')+'</div><div class="mini-status">КОД: ———</div>');content.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{typed+=b.dataset.n;content.querySelector('.mini-status').textContent='КОД: '+typed;if(typed.length===3){if(typed===answer)finish(id);else {content.querySelector('.mini-status').textContent='НЕВЕРНО. СБРОС.';typed=''}}})}
function relay(id){const correct=[2,0,3,1],input=[];mount('КАЮТ-КОМПАНИЯ','Перезапустите аварийное освещение: выберите четыре реле по порядку.','Слева направо лампы мигают: третья, первая, четвёртая, вторая.','<div class="choices">'+[0,1,2,3].map(n=>'<button class="choice" data-n="'+n+'">'+(n+1)+'</button>').join('')+'</div><div class="mini-status">ОЧЕРЕДЬ РЕЛЕ</div>');content.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{input.push(+b.dataset.n);if(input.at(-1)!==correct[input.length-1]){input.length=0;content.querySelector('.mini-status').textContent='СБРОС ЦЕПИ'}else if(input.length===4)finish(id)})}
function open(r){({power,pump,sonar,code,relay})[r.task](r.id);dialog.showModal()}
window.addEventListener('keydown',e=>{if(dialog.open){if(e.key==='Escape')dialog.close();return}const d={ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0],ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1]}[e.key];if(d){e.preventDefault();let x=player.x+d[0],y=player.y+d[1];if(reachable(x,y))player={x,y};else say('Здесь сплошная переборка или закрытый шлюз.');update()}if((e.key==='e'||e.key==='E')&&active)open(active);if(e.key==='r'||e.key==='R')say(active?'ЦЕЛЬ: '+active.name+'. Подлетите к центральному терминалу и нажмите E.':'ЦЕЛЬ: найдите красный терминал в доступном отсеке.');});
document.querySelector('#close-game').onclick=()=>dialog.close();game.addEventListener('click',()=>game.focus());game.focus();update();
