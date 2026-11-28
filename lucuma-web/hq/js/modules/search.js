import {searchAll,hl} from '../core/search.js';
import {esc,debounce} from '../core/util.js';
import {ic} from '../core/icons.js';
export default function(host,{query}){
 let q=query.get('q')||'';
 host.innerHTML=`<div class="ph"><div><div class="eyebrow">Global search</div><h1>Search</h1><p>Across documents, people, projects, tasks, messages, mail, meetings, clients, invoices and the knowledge base.</p></div></div><div class="card"><div class="sbox" style="position:relative;max-width:none"><input id="sq" value="${esc(q)}" placeholder="Search everything…" style="padding:14px 16px;font-size:16px" autofocus></div><div id="sr" class="mt"></div></div>`;
 const draw=()=>{const g=searchAll(q,8);host.querySelector('#sr').innerHTML=!q.trim()?'<div class="empty">'+ic('search')+'Start typing to search the whole workspace.</div>':g.length?g.map(x=>`<h4 style="margin:16px 0 6px">${ic(x.icon)} ${x.label} <small class="mut">${x.items.length}</small></h4>`+x.items.map(i=>`<a class="li click" href="${i.r}"><div class="grow"><b>${hl(i.l,q)}</b><br><small class="mut">${esc(i.s)}</small></div>${ic('chevron')}</a>`).join('')).join(''):'<div class="empty">'+ic('search')+'No results for “'+esc(q)+'”</div>'};
 draw();host.querySelector('#sq').oninput=debounce(e=>{q=e.target.value;draw()},120);
}
