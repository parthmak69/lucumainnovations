import {db,favs,recent} from '../core/db.js';
import {esc,ago} from '../core/util.js';
import {ic} from '../core/icons.js';
import {empty} from '../core/ui.js';
import {favBtn} from '../core/cells.js';
const IC={doc:'file',project:'briefcase',task:'check-c',employee:'users',client:'building',kb:'book',mail:'mail'};
export default function(host){
 const draw=()=>{const f=Object.values(favs.all()),r=recent.list();
 host.innerHTML=`<div class="ph"><div><div class="eyebrow">Workspace</div><h1>Favorites & recent</h1><p>Pin the things you use most. Star any document, project, task, employee, client or article.</p></div></div><div class="g2"><div class="card"><div class="hd">${ic('star')}<h3>Favorites</h3></div>${f.length?f.map(x=>`<div class="li click" data-go="${esc(x.route)}">${ic(IC[x.type]||'star',18)}<div class="grow"><b>${esc(x.label)}</b><br><small class="mut">${esc(x.type)}</small></div>${favBtn(x.type,x.id,x.label,x.route)}</div>`).join(''):empty('star','No favorites yet','Use the ☆ icon on documents, projects, tasks, people and articles.')}</div>
 <div class="card"><div class="hd">${ic('clock')}<h3>Recently opened</h3></div>${r.length?r.map(x=>`<div class="li click" data-go="${esc(x.route)}">${ic(IC[x.type]||'file',18)}<div class="grow"><b>${esc(x.label)}</b><br><small class="mut">${esc(x.type)}</small></div><small class="dim">${ago(x.t)}</small></div>`).join(''):empty('clock','Nothing opened yet','Items you open will appear here.')}</div></div>`};
 draw();host.onclick=e=>{const g=e.target.closest('[data-go]');if(g&&!e.target.closest('[data-fav]'))location.hash=g.dataset.go;else if(e.target.closest('[data-fav]'))setTimeout(draw,50)};
}
