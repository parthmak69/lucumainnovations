import {db,empName} from '../core/db.js';
import {esc,ago,avatar,debounce} from '../core/util.js';
import {ic} from '../core/icons.js';
const ICON={Document:'file',Project:'briefcase',Task:'check-c',Employee:'users',Approval:'check',Communication:'chat',Meeting:'calendar'};
export default function(host){
 let cat='',q='';
 const draw=()=>{const l=db.activity.all().filter(a=>(!cat||a.cat===cat)&&(!q||(empName(a.who)+a.verb+a.what).toLowerCase().includes(q)));
  host.querySelector('#af').innerHTML=l.map(a=>`<div class="li"><span class="chip">${ic(ICON[a.cat]||'bolt')}${esc(a.cat)}</span>${avatar(empName(a.who),30)}<div class="grow"><b>${esc(empName(a.who))}</b> ${esc(a.verb)} <b>${esc(a.what)}</b></div><small class="dim">${ago(a.t)}</small></div>`).join('')||'<div class="empty">No activity</div>'};
 host.innerHTML=`<div class="ph"><div><div class="eyebrow">Workspace</div><h1>Company activity feed</h1><p>Everything happening across documents, projects, people and communication.</p></div></div><div class="card"><div class="tbar"><div class="sbox"><span></span><input id="aq" placeholder="Filter activity…" style="padding-left:12px"></div><select id="ac"><option value="">All activity</option>${Object.keys(ICON).map(c=>`<option>${c}</option>`).join('')}</select></div><div class="list" id="af"></div></div>`;
 draw();host.querySelector('#aq').oninput=debounce(e=>{q=e.target.value.toLowerCase();draw()},120);host.querySelector('#ac').onchange=e=>{cat=e.target.value;draw()};
 return db.activity.on(draw);
}
