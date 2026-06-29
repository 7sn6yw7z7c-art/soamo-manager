const storeKey = 'soamo-manager-compare-v3';
let data = { projectName:'', projectNote:'', suppliers:['M-klima','Pragopolair'], items:[] };
const qs = s => document.querySelector(s);
const money = n => (Number(n)||0).toLocaleString('cs-CZ',{maximumFractionDigits:2}) + ' Kč';
const uid = () => Math.random().toString(36).slice(2,9);
const pragopolairImport = [
 {name:'Chladivo R32', size:'kg', length:'', wall:'', qty:1, unit:'kg', prices:{'M-klima':510,'Pragopolair':979.50}, note:'Pragopolair R32/kg; M-klima R32 cena/kg'},
 {name:'Chladivo R32', size:'5 kg lahev', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':7444.50}, note:'Pragopolair R32 5 kg'},
 {name:'Chladivo R32', size:'1,8 kg lahev', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':3159.00}, note:'Pragopolair R32 1,8 kg'},
 {name:'Chladivo R600a', size:'420 g', length:'', wall:'', qty:1, unit:'ks', prices:{'M-klima':189,'Pragopolair':203}, note:'M-klima R600a 0,42 kg; Pragopolair R600A 420 g'},
 {name:'Trubka Cu měkká s izolací', size:'10+16 (3/8 + 5/8)', length:'25 m', wall:'0,8+1 mm', qty:25, unit:'m', prices:{'M-klima':240,'Pragopolair':333.90}, note:'Pragopolair cena přepočtena 8347,50 / 25 m'},
 {name:'Trubka Cu tyč tvrdá', size:'18x1 mm', length:'5 m', wall:'1 mm', qty:5, unit:'m', prices:{'M-klima':160,'Pragopolair':64.33}, note:'Pragopolair cena přepočtena 321,66 / 5 m - ověř jednotku'},
 {name:'Oblouk Cu 90° 5002 A', size:'10 mm', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':30.60}, note:'Pragopolair'},
 {name:'Oblouk Cu 90° 5002 A', size:'16 mm', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':30.60}, note:'Pragopolair'},
 {name:'Oblouk Cu 90° 5002 A', size:'22 mm', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':39.10}, note:'Pragopolair'},
 {name:'Oblouk Cu 90° 5002 A', size:'42 mm', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':278.80}, note:'Pragopolair'},
 {name:'Izolace / panel / TCS', size:'', length:'', wall:'', qty:1, unit:'ks', prices:{'Pragopolair':712.50}, note:'Pragopolair'},
 {name:'Kapilára TC-80', size:'30 m', length:'30 m', wall:'', qty:1, unit:'bal', prices:{'Pragopolair':2333.08}, note:'Pragopolair'}
];
function load(){ try{ const saved=localStorage.getItem(storeKey); if(saved) data=JSON.parse(saved);}catch(e){} if(!data.items.length) addBlankItem(false); render(); }
function save(){ data.projectName=qs('#projectName').value; data.projectNote=qs('#projectNote').value; localStorage.setItem(storeKey,JSON.stringify(data)); }
function addBlankItem(doRender=true){ data.items.push({id:uid(), name:'', size:'', length:'', wall:'', qty:1, unit:'ks', prices:{}, note:''}); if(doRender) render(); }
function render(){
 qs('#projectName').value=data.projectName||''; qs('#projectNote').value=data.projectNote||'';
 qs('#suppliers').innerHTML=data.suppliers.map(s=>`<span class="chip">${esc(s)} <button onclick="removeSupplier('${enc(s)}')">×</button></span>`).join('')||'<span class="muted">Zatím žádný dodavatel</span>';
 const head=['Název položky','Rozměr','Délka','Stěna','Množství','Jedn.',...data.suppliers.map(esc),'Nejlevnější','Pozn.',''].map(x=>`<th>${x}</th>`).join('');
 qs('#itemsTable thead').innerHTML=`<tr>${head}</tr>`;
 qs('#itemsTable tbody').innerHTML=data.items.map((it,i)=>rowHtml(it,i)).join('');
 renderSummary(); save();
}
function rowHtml(it,i){
 const best = bestForItem(it);
 const priceCells = data.suppliers.map(s=>{
   const val=it.prices?.[s]??''; const cls=best && best.s===s?'best':'';
   return `<td><input class="${cls}" inputmode="decimal" value="${esc(val)}" onchange="setPrice('${it.id}','${enc(s)}',this.value)" placeholder="Kč/jedn."></td>`;
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
 <td><input value="${esc(it.note||'')}" onchange="setItem('${it.id}','note',this.value)" placeholder="pozn."></td>
 <td><button class="small danger" onclick="deleteItem('${it.id}')">Smazat</button></td>
 </tr>`;
}
function num(v){ return parseFloat(String(v).replace(',','.').replace(/[^0-9.\-]/g,'')); }
function bestForItem(it){ let best=null; for(const s of data.suppliers){ const p=num(it.prices?.[s]); if(!p && p!==0) continue; const total=p*(num(it.qty)||1); if(!best || total<best.total) best={s,p,total}; } return best; }
function totals(){ const totals={}; data.suppliers.forEach(s=>totals[s]=0); let bestTotal=0, missing=0; data.items.forEach(it=>{ const b=bestForItem(it); if(b) bestTotal+=b.total; else missing++; data.suppliers.forEach(s=>{ const p=num(it.prices?.[s]); if(p||p===0) totals[s]+=p*(num(it.qty)||1); }); }); return {totals,bestTotal,missing}; }
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
function importRows(){ const txt=qs('#pasteBox').value.trim(); if(!txt)return; const lines=txt.split(/\n+/); lines.forEach(line=>{ const c=line.split(/\t|;/).map(x=>x.trim()); if(c.length<2)return; const [name,size='',length='',wall='',qty='1',unit='ks',supplier='',price='',note='']=c; let it=data.items.find(x=>x.name===name && x.size===size && x.length===length && x.wall===wall); if(!it){ it={id:uid(),name,size,length,wall,qty:num(qty)||1,unit,prices:{},note}; data.items.push(it); } if(supplier){ if(!data.suppliers.includes(supplier))data.suppliers.push(supplier); it.prices[supplier]=price; } }); qs('#pasteBox').value=''; render(); }
function importPragopolair(){ if(!data.suppliers.includes('M-klima')) data.suppliers.push('M-klima'); if(!data.suppliers.includes('Pragopolair')) data.suppliers.push('Pragopolair'); data.items = data.items.filter(x=>x.name || Object.keys(x.prices||{}).length); pragopolairImport.forEach(src=>{ let it=data.items.find(x=>x.name===src.name && x.size===src.size && x.length===src.length && x.wall===src.wall); if(!it){ it={id:uid(), ...JSON.parse(JSON.stringify(src))}; data.items.push(it); } else { it.qty=src.qty; it.unit=src.unit; it.note=src.note; it.prices={...(it.prices||{}),...src.prices}; } }); render(); }
function csv(){ const headers=['Název','Rozměr','Délka','Stěna','Množství','Jednotka',...data.suppliers,'Nejlevnější dodavatel','Nejlevnější celkem','Poznámka']; const rows=data.items.map(it=>{ const b=bestForItem(it); return [it.name,it.size,it.length,it.wall,it.qty,it.unit,...data.suppliers.map(s=>it.prices?.[s]||''),b?.s||'',b?.total||'',it.note||'']; }); return [headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'); }
function exportCsv(){ const blob=new Blob([csv()],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(data.projectName||'soamo-porovnani')+'.csv'; a.click(); }
function copySummary(){ const t=totals(); const lines=[`SOAMO – ${data.projectName||'porovnání nabídek'}`,`Nejlevnější kombinace: ${money(t.bestTotal)}`]; Object.entries(t.totals).sort((a,b)=>a[1]-b[1]).forEach(([s,v])=>lines.push(`${s}: ${money(v)}`)); navigator.clipboard.writeText(lines.join('\n')); alert('Souhrn zkopírován.'); }
function sample(){ importPragopolair(); }
function clearAll(){ if(confirm('Smazat všechna uložená data?')){ localStorage.removeItem(storeKey); data={projectName:'',projectNote:'',suppliers:['M-klima','Pragopolair'],items:[]}; addBlankItem(false); render(); } }
function esc(v){ return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } function enc(s){return encodeURIComponent(s)} function dec(s){return decodeURIComponent(s)}
qs('#addSupplier').onclick=addSupplier; qs('#addItem').onclick=()=>addBlankItem(); qs('#importBtn').onclick=importRows; qs('#exportCsv').onclick=exportCsv; qs('#copySummary').onclick=copySummary; qs('#sampleData').onclick=sample; qs('#clearAll').onclick=clearAll; qs('#loadPragopolair').onclick=importPragopolair; qs('#projectName').onchange=save; qs('#projectNote').onchange=save; qs('#supplierInput').addEventListener('keydown',e=>{if(e.key==='Enter')addSupplier()});
let deferredPrompt; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); deferredPrompt=e; qs('#installBtn').hidden=false;}); qs('#installBtn').onclick=async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; qs('#installBtn').hidden=true; }};
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
load();
