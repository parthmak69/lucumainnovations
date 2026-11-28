import {esc,avatar} from './util.js';
import {emp,proj} from './db.js';
export const who=(id,o={})=>{const e=emp(id);if(!e)return'<span class="dim">—</span>';const{sub=true,size=30}=o;return`<div class="person">${avatar(e.name,size)}<div><b>${esc(e.name)}</b>${sub?`<small>${esc(e.designation)}</small>`:''}</div></div>`};
export const whoSm=id=>{const e=emp(id);return e?`<span class="row" style="gap:6px;display:inline-flex">${avatar(e.name,22)}<span>${esc(e.name)}</span></span>`:'—'};
export const stack=(ids,max=4,size=26)=>{ids=ids||[];const s=ids.slice(0,max).map(i=>avatar(emp(i)?.name||i,size)).join('');return`<span class="avs" title="${esc(ids.map(i=>emp(i)?.name||i).join(', '))}">${s}${ids.length>max?`<span class="av" style="--s:${size}px;background:var(--g3)">+${ids.length-max}</span>`:''}</span>`};
export const projName=id=>proj(id)?.name||'—';
export const pct=n=>`<div class="row" style="gap:8px;min-width:110px"><div class="progress grow"><i style="width:${n}%"></i></div><small>${n}%</small></div>`;

import {favs} from './db.js';
import {ic} from './icons.js';
export const favBtn=(type,id,label,route)=>`<button class="favbtn ${favs.has(type,id)?'on':''}" data-fav='${esc(JSON.stringify([type,id,label,route]))}' aria-label="Toggle favorite" data-tip="Favorite">${ic('star')}</button>`;
