const storeKey = 'soamo-manager-compare-v2';
let data = { projectName:'', projectNote:'', suppliers:['Dodavatel A','Dodavatel B'], items:[] };
const qs = s => document.querySelector(s);
const money = n => (Number(n)||0).toLocaleString('cs-CZ',{maximumFractionDigits:2}) + ' Kč';
const uid = () => Math.random().toString(36).slice(2,9);
function load(){ try{ const saved=localStorage.getItem(storeKey); if(saved) data=JSON.parse(saved);}catch(e){} if(!data.items.length) addBlankItem(false); render(); }
function save(){ data.projectName=qs('#projectName').value; data.projectNote=qs('#projectNote').value; localStorage.setItem(storeKey,JSON.stringify(data)); }
function addBlankItem(doRender=true){ data.items.push({id:uid(), name:'', size:'', length:'', wall:'', qty:1, unit:'ks', prices:{}}); if(doRender) render(); }
function render(){
 qs('#projectName').value=data.projectName||''; qs('#projectNote').value=data.projectNote||'';
 qs('#suppliers').innerHTML=data.suppliers.map(s=>`<span class="chip">${esc(s)} <button onclick="removeSupplier('${enc(s)}')">×</button></span>`).join('')||'<span class="muted">Zatím žádný dodavatel</span>';
 const head=['Název položky','Rozměr','Délka','Stěna','Množství','Jedn.',...data.suppliers.map(esc),'Nejlevnější',''].map(x=>`<th>${x}</th>`).join('');
 qs('#itemsTable thead').innerHTML=`<tr>${head}</tr>`;
 qs('#itemsTable tbody').innerHTML=data.items.map((it,i)=>rowHtml(it,i)).join('');
 renderSummary(); save();
}
function rowHtml(it,i){
 const best = bestForItem(it);
 const priceCells = data.suppliers.map(s=>{
   const val=it.prices?.[s]??''; const cls=best && best.s===s?'best':'';
   return `<td><input class="${cls}" inputmode="decimal" value="${esc(val)}" onchange="setPrice('${it.id}','${enc(s)}',this.value)" placeholder="Kč/ks"></td>`;
 }).join('');
 return `<tr>
 <td><input value="${esc(it.name)}" onchange="setItem('${it.id}','name',this.value)" placeholder="Potrubí / koleno / tvarovka…"></td>
 <td><input value="${esc(it.size)}" onchange="setItem('${it.id}','size',this.value)" placeholder="např. 250"></td>
 <td><input value="${esc(it.length)}" onchange="setItem('${it.id}','length',this.value)" placeholder="např. 1 m"></td>
 <td><input value="${esc(it.wall)}" onchange="setItem('${it.id}','wall',this.value)" placeholder="např. 0,6"></td>
 <td><input inputmode="decimal" value="${esc(it.qty)}" onchange="setItem('${it.id}','qty',num(this.value)||1)"></td>
 <td><input value="${esc(it.unit)}" onchange="setItem('${it.id}','unit',this.value)"></td>
 ${priceCells}
 <td>${best?`<b class="green">${esc(best.s)}</b><br>${money(best.total)} celkem<br><span class="muted">${money(best.p)}/${esc(it.unit||'ks')}</span>`:'—'}</td>
 <td><button class="small danger" onclick="deleteItem('${it.id}')">Smazat</button></td>
 </tr>`;
}
function num(v){ return parseFloat(String(v).replace(',','.').replace(/[^0-9.\-]/g,'')); }
function bestForItem(it){ let best=null; for(const s of data.suppliers){ const p=num(it.prices?.[s]); if(!p && p!==0) continue; const total=p*(num(it.qty)||1); if(!best || total<best.total) best={s,p,total}; } return best; }
function totals(){
 const totals={}; data.suppliers.forEach(s=>totals[s]=0); let bestTotal=0, missing=0;
 data.items.forEach(it=>{ const b=bestForItem(it); if(b) bestTotal+=b.total; else missing++; data.suppliers.forEach(s=>{ const p=num(it.prices?.[s]); if(p||p===0) totals[s]+=p*(num(it.qty)||1); }); });
 return {totals,bestTotal,missing};
}
function renderSummary(){ const t=totals(); const entries=Object.entries(t.totals).filter(([s,v])=>v>0).sort((a,b)=>a[1]-b[1]); const cheapest=entries[0];
 let html=`<div class="box"><h3>Nejlevnější kombinace po položkách</h3><div class="price green">${money(t.bestTotal)}</div><div class="muted">Bere se vždy nejnižší cena u každé položky.</div></div>`;
 html+=`<div class="box"><h3>Nejlepší jeden dodavatel</h3>${cheapest?`<div class="price">${esc(cheapest[0])}</div><b>${money(cheapest[1])}</b>`:'<span class="muted">Zadej ceny.</span>'}</div>`;
 if(t.missing) html+=`<div class="box"><h3>Chybí nacenění</h3><div class="price red">${t.missing}</div><div class="muted">položek nemá žádnou cenu</div></div>`;
 html+=entries.map(([s,v],idx)=>`<div class="box"><h3>${idx+1}. ${esc(s)}</h3><div class="price">${money(v)}</div>${t.bestTotal?`<div class="muted">Rozdíl proti mixu: ${money(v-t.bestTotal)}</div>`:''}</div>`).join('');
 qs('#summary').innerHTML=html;
}
function setItem(id,k,v){ const it=data.items.find(x=>x.id===id); if(it){it[k]=v; render();} }
function setPrice(id,s,v){ const it=data.items.find(x=>x.id===id); if(it){ if(!it.prices)it.prices={}; it.prices[dec(s)]=v; render();} }
function deleteItem(id){ data.items=data.items.filter(x=>x.id!==id); if(!data.items.length)addBlankItem(false); render(); }
function removeSupplier(s){ s=dec(s); data.suppliers=data.suppliers.filter(x=>x!==s); data.items.forEach(it=>{ if(it.prices) delete it.prices[s]; }); render(); }
function addSupplier(){ const s=qs('#supplierInput').value.trim(); if(!s)return; if(!data.suppliers.includes(s))data.suppliers.push(s); qs('#supplierInput').value=''; render(); }
function importRows(){ const txt=qs('#pasteBox').value.trim(); if(!txt)return; const lines=txt.split(/\n+/); lines.forEach(line=>{ const c=line.split(/\t|;/).map(x=>x.trim()); if(c.length<2)return; const [name,size='',length='',wall='',qty='1',unit='ks',supplier='',price='']=c; let it=data.items.find(x=>x.name===name && x.size===size && x.length===length && x.wall===wall); if(!it){ it={id:uid(),name,size,length,wall,qty:num(qty)||1,unit,prices:{}}; data.items.push(it); } if(supplier){ if(!data.suppliers.includes(supplier))data.suppliers.push(supplier); it.prices[supplier]=price; } }); qs('#pasteBox').value=''; render(); }
function csv(){ const headers=['Název','Rozměr','Délka','Stěna','Množství','Jednotka',...data.suppliers,'Nejlevnější dodavatel','Nejlevnější celkem']; const rows=data.items.map(it=>{ const b=bestForItem(it); return [it.name,it.size,it.length,it.wall,it.qty,it.unit,...data.suppliers.map(s=>it.prices?.[s]||''),b?.s||'',b?.total||'']; }); return [headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'); }
function exportCsv(){ const blob=new Blob([csv()],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(data.projectName||'soamo-porovnani')+'.csv'; a.click(); }
function copySummary(){ const t=totals(); const lines=[`SOAMO – ${data.projectName||'porovnání nabídek'}`,`Nejlevnější kombinace: ${money(t.bestTotal)}`]; Object.entries(t.totals).sort((a,b)=>a[1]-b[1]).forEach(([s,v])=>lines.push(`${s}: ${money(v)}`)); navigator.clipboard.writeText(lines.join('\n')); alert('Souhrn zkopírován.'); }
function sample(){ data.suppliers=['Lindab','Airproduct','Ventishop']; data.items=[{id:uid(),name:'SPIRO potrubí',size:'250',length:'3 m',wall:'0,6',qty:8,unit:'ks',prices:{Lindab:890,Airproduct:840,Ventishop:910}},{id:uid(),name:'Koleno segmentové 90°',size:'250',length:'',wall:'0,6',qty:12,unit:'ks',prices:{Lindab:420,Airproduct:445,Ventishop:399}},{id:uid(),name:'T-kus',size:'250/160',length:'',wall:'0,6',qty:4,unit:'ks',prices:{Lindab:780,Airproduct:720,Ventishop:850}}]; render(); }
function clearAll(){ if(confirm('Smazat všechna uložená data?')){ localStorage.removeItem(storeKey); data={projectName:'',projectNote:'',suppliers:[],items:[]}; addBlankItem(false); render(); } }
function esc(v){ return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } function enc(s){return encodeURIComponent(s)} function dec(s){return decodeURIComponent(s)}
qs('#addSupplier').onclick=addSupplier; qs('#addItem').onclick=()=>addBlankItem(); qs('#importBtn').onclick=importRows; qs('#exportCsv').onclick=exportCsv; qs('#copySummary').onclick=copySummary; qs('#sampleData').onclick=sample; qs('#clearAll').onclick=clearAll; qs('#projectName').onchange=save; qs('#projectNote').onchange=save; qs('#supplierInput').addEventListener('keydown',e=>{if(e.key==='Enter')addSupplier()});
let deferredPrompt; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); deferredPrompt=e; qs('#installBtn').hidden=false;}); qs('#installBtn').onclick=async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; qs('#installBtn').hidden=true; }};
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
load();
