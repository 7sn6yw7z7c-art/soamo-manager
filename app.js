const $ = id => document.getElementById(id);
const state = JSON.parse(localStorage.getItem('soamo-manager') || '{"items":[]}');
function save(){localStorage.setItem('soamo-manager', JSON.stringify(state)); render();}
function money(n){return Number(n).toLocaleString('cs-CZ',{style:'currency',currency:'CZK'});}
function render(){
  const select=$('priceItem'); select.innerHTML='';
  state.items.forEach((it,i)=>{const o=document.createElement('option');o.value=i;o.textContent=it.name+' '+(it.size||'');select.appendChild(o);});
  const summary=$('summary'); summary.innerHTML='';
  if(!state.items.length){summary.innerHTML='<p class="muted">Zatím tu nic není. Přidej první VZT položku.</p>'; return;}
  state.items.forEach((it,i)=>{
    const tpl=$('itemTpl').content.cloneNode(true); const art=tpl.querySelector('.item');
    tpl.querySelector('h3').textContent=it.name;
    tpl.querySelector('p').textContent=`Rozměr: ${it.size||'-'} • Délka: ${it.length||'-'} • Stěna: ${it.wall||'-'} • Množství: ${it.qty}`;
    tpl.querySelector('.danger').onclick=()=>{state.items.splice(i,1);save();};
    const prices=tpl.querySelector('.prices');
    if(!it.prices.length){prices.innerHTML='<div class="muted">Bez cen od dodavatelů.</div>';} else {
      const vals=it.prices.map(p=>Number(p.price)); const min=Math.min(...vals);
      it.prices.slice().sort((a,b)=>a.price-b.price).forEach(p=>{
        const total=Number(p.price)*Number(it.qty||1); const diff=Number(p.price)-min;
        const row=document.createElement('div'); row.className='price-row '+(Number(p.price)===min?'best':'');
        row.innerHTML=`<strong>${p.supplier}</strong><span>${money(p.price)} / jedn. • celkem ${money(total)}${diff?` • +${money(diff)} / jedn.`:' • nejlepší'}</span>`;
        prices.appendChild(row);
      });
    }
    summary.appendChild(tpl);
  });
}
$('addItem').onclick=()=>{
  const name=$('itemName').value.trim(); if(!name) return alert('Vyplň název položky.');
  state.items.push({name,size:$('itemSize').value.trim(),length:$('itemLength').value.trim(),wall:$('itemWall').value.trim(),qty:Number($('itemQty').value||1),prices:[]});
  ['itemName','itemSize','itemLength','itemWall'].forEach(id=>$(id).value=''); $('itemQty').value=1; save();
};
$('addPrice').onclick=()=>{
  if(!state.items.length) return alert('Nejdřív přidej položku.');
  const supplier=$('supplier').value.trim(); const price=Number($('price').value);
  if(!supplier || !price) return alert('Vyplň dodavatele a cenu.');
  state.items[Number($('priceItem').value)].prices.push({supplier,price}); $('supplier').value=''; $('price').value=''; save();
};
$('clearAll').onclick=()=>{if(confirm('Smazat všechna data?')){state.items=[];save();}};
$('exportJson').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='soamo-manager-export.json';a.click();};
let deferredPrompt; window.addEventListener('beforeinstallprompt', e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false;});
$('installBtn').onclick=()=>deferredPrompt?.prompt();
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
render();
