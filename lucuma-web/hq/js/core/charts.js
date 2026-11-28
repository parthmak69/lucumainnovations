import {esc,cmp} from './util.js';
export const COLORS=['#8b7bff','#5ec8ff','#4ade80','#fbbf24','#f472b6','#fb923c','#60a5fa','#a3e635','#2dd4bf','#c084fc'];
const nice=m=>{if(m<=0)return 1;const p=10**Math.floor(Math.log10(m)),f=m/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p};
export function line({labels,series,h=200,fmt=v=>v,area=true}){
 const W=640,pl=44,pr=10,pt=10,pb=26,iw=W-pl-pr,ih=h-pt-pb,max=nice(Math.max(1,...series.flatMap(s=>s.data))),n=labels.length;
 const X=i=>pl+(n<2?iw/2:i*iw/(n-1)),Y=v=>pt+ih-(v/max)*ih;
 let g='';for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.1)"/><text x="${pl-6}" y="${y+3}" text-anchor="end">${fmt(v)}</text>`}
 const step=Math.ceil(n/8);labels.forEach((l,i)=>{if(i%step===0)g+=`<text x="${X(i)}" y="${h-8}" text-anchor="middle">${esc(l)}</text>`});
 series.forEach((s,k)=>{const c=s.color||COLORS[k],pts=s.data.map((v,i)=>`${X(i)},${Y(v)}`),d='M'+pts.join('L');
  if(area&&k===0)g+=`<defs><linearGradient id="lg${k}${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".4"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${X(n-1)},${Y(0)}L${X(0)},${Y(0)}Z" fill="url(#lg${k}${n})"/>`;
  g+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/>`+s.data.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="${c}"><title>${esc(s.name||'')} ${esc(labels[i])}: ${fmt(v)}</title></circle>`).join('')});
 return`<svg class="chart" viewBox="0 0 ${W} ${h}" width="100%" role="img">${g}</svg>${legend(series)}`;
}
const legend=s=>s.length>1?`<div class="row" style="gap:14px;margin-top:6px">${s.map((x,i)=>`<small><i class="pri" style="background:${x.color||COLORS[i]}"></i> ${esc(x.name)}</small>`).join('')}</div>`:'';
export function bars({labels,series,h=200,fmt=v=>v,stack=false}){
 const W=640,pl=44,pr=10,pt=10,pb=26,iw=W-pl-pr,ih=h-pt-pb,n=labels.length;
 const tot=i=>series.reduce((t,s)=>t+s.data[i],0),max=nice(Math.max(1,...(stack?labels.map((_,i)=>tot(i)):series.flatMap(s=>s.data))));
 const Y=v=>pt+ih-(v/max)*ih,bw=iw/n,gw=bw*.7,k=stack?1:series.length;let g='';
 for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.1)"/><text x="${pl-6}" y="${y+3}" text-anchor="end">${fmt(v)}</text>`}
 labels.forEach((l,i)=>{const x0=pl+i*bw+(bw-gw)/2;let acc=0;
  series.forEach((s,j)=>{const v=s.data[i],c=s.color||COLORS[j],w=gw/k,x=stack?x0:x0+j*w,y=stack?Y(acc+v):Y(v),hh=ih-(y-pt)-(stack?(ih-(Y(acc)-pt)):0);
   g+=`<rect x="${x}" y="${y}" width="${Math.max(2,w-2)}" height="${Math.max(0,stack?Y(acc)-Y(acc+v):Y(0)-y)}" rx="4" fill="${c}" opacity=".92"><title>${esc(s.name||'')} ${esc(l)}: ${fmt(v)}</title></rect>`;acc+=v});
  if(i%Math.ceil(n/12)===0)g+=`<text x="${pl+i*bw+bw/2}" y="${h-8}" text-anchor="middle">${esc(l)}</text>`});
 return`<svg class="chart" viewBox="0 0 ${W} ${h}" width="100%" role="img">${g}</svg>${legend(series)}`;
}
export function donut({items,size=170,center='',sub='',fmt=v=>v}){
 const tot=items.reduce((t,i)=>t+i.value,0)||1,r=size/2-14,C=2*Math.PI*r;let off=0,g='';
 items.forEach((it,i)=>{const len=it.value/tot*C;g+=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${it.color||COLORS[i%COLORS.length]}" stroke-width="18" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})"><title>${esc(it.label)}: ${fmt(it.value)}</title></circle>`;off+=len});
 return`<div class="row" style="gap:18px;align-items:center"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="flex:none"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="18"/>${g}<text x="50%" y="${size/2+2}" text-anchor="middle" style="fill:#fff;font:800 22px Archivo">${esc(center)}</text><text x="50%" y="${size/2+18}" text-anchor="middle">${esc(sub)}</text></svg><div class="col" style="gap:6px;min-width:130px">${items.map((it,i)=>`<small><i class="pri" style="background:${it.color||COLORS[i%COLORS.length]}"></i> ${esc(it.label)} <b style="color:#fff">${fmt(it.value)}</b></small>`).join('')}</div></div>`;
}
export const spark=(data,c='#8b7bff',w=110,h=34)=>{const mx=Math.max(...data),mn=Math.min(...data),r=mx-mn||1,p=data.map((v,i)=>`${i*w/(data.length-1)},${h-3-(v-mn)/r*(h-6)}`).join('L');return`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="M${p}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`};
export const ring=(pct,size=64,c='#8b7bff',label)=>{const r=size/2-6,C=2*Math.PI*r;return`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="6"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C*pct/100} ${C}" transform="rotate(-90 ${size/2} ${size/2})"/><text x="50%" y="${size/2+4}" text-anchor="middle" style="fill:#fff;font:800 ${size/4.2}px Archivo">${label??Math.round(pct)+'%'}</text></svg>`};
export const hbars=(items,{fmt=v=>v,max}={})=>{const m=max||Math.max(1,...items.map(i=>i.value));return items.map((i,k)=>`<div style="margin:9px 0"><div class="row sp-b" style="font-size:12.5px"><span>${esc(i.label)}</span><b>${fmt(i.value)}</b></div><div class="progress"><i style="width:${Math.min(100,i.value/m*100)}%;${i.color?`background:${i.color}`:''}"></i></div></div>`).join('')};
export const fmtMoney=cmp;
