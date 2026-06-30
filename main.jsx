import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, ShoppingCart, Trash2, Plus, Download, Upload, ExternalLink } from 'lucide-react';
import './styles.css';

const PRAGOPOLAIR_URL = 'https://eshop.pragopolair.cz/2-vsechny-produkty';
const STORAGE_KEY = 'soamo-manager-v2';

const seedProducts = [
  { id: 'pp-1', supplier: 'Pragopolair', name: 'Bloková jednotka / BYWS352MA70P11 / R290', category: 'Blokové jednotky', price: 108144.05, url: 'https://eshop.pragopolair.cz/2-vsechny-produkty' },
  { id: 'pp-2', supplier: 'Pragopolair', name: 'Kondenzační jednotka / P-HU0 /400 QQ', category: 'Kondenzační jednotky', price: 37600.99, url: 'https://eshop.pragopolair.cz/2-vsechny-produkty' },
  { id: 'pp-3', supplier: 'Pragopolair', name: 'Měděné potrubí a izolace - položka pro test vyhledávání', category: 'Měděné potrubí a izolace', price: 890.00, url: PRAGOPOLAIR_URL },
  { id: 'pp-4', supplier: 'Pragopolair', name: 'Ventilátor - položka pro test vyhledávání', category: 'Ventilátory', price: 2450.00, url: PRAGOPOLAIR_URL },
  { id: 'pp-5', supplier: 'Pragopolair', name: 'Filtr / průhledítko - položka pro test vyhledávání', category: 'Filtry a průhledítka', price: 420.00, url: PRAGOPOLAIR_URL },
];

function money(value) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 2 }).format(value || 0);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function App() {
  const saved = loadState();
  const [products, setProducts] = useState(saved?.products || seedProducts);
  const [cart, setCart] = useState(saved?.cart || []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Vše');
  const [notice, setNotice] = useState('');
  const [htmlInput, setHtmlInput] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, cart }));
  }, [products, cart]);

  const categories = useMemo(() => ['Vše', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()], [products]);
  const filtered = useMemo(() => products.filter(p => {
    const text = `${p.name} ${p.category} ${p.supplier}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'Vše' || p.category === category);
  }), [products, query, category]);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addToCart(product) {
    setCart(current => {
      const found = current.find(i => i.id === product.id);
      if (found) return current.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...current, { ...product, qty: 1 }];
    });
  }

  function updateQty(id, qty) {
    setCart(current => current.map(i => i.id === id ? { ...i, qty: Math.max(1, Number(qty) || 1) } : i));
  }

  function removeItem(id) {
    setCart(current => current.filter(i => i.id !== id));
  }

  function exportJson() {
    const data = JSON.stringify({ products, cart, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soamo-manager-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function parsePragopolairHtml() {
    const doc = new DOMParser().parseFromString(htmlInput, 'text/html');
    const text = doc.body.innerText || htmlInput;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const priceLine = lines[i + 1] || '';
      const priceMatch = priceLine.match(/([0-9.\s]+,[0-9]{2})\s*Kč/);
      if (line.length > 5 && priceMatch && !line.includes('Kč')) {
        const price = Number(priceMatch[1].replace(/[.\s]/g, '').replace(',', '.'));
        parsed.push({
          id: `pp-import-${Date.now()}-${parsed.length}`,
          supplier: 'Pragopolair',
          name: line.replace(/^#+\s*/, ''),
          category: 'Import Pragopolair',
          price,
          url: PRAGOPOLAIR_URL
        });
      }
    }
    if (!parsed.length) {
      setNotice('Z vloženého textu se nepodařilo najít produkty a ceny. Zkopíruj stránku e-shopu jako text nebo HTML.');
      return;
    }
    setProducts(current => [...parsed, ...current]);
    setHtmlInput('');
    setNotice(`Naimportováno ${parsed.length} položek z Pragopolairu.`);
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">SOAMO Manager v2</p>
          <h1>Porovnání cen a zakázka</h1>
          <p>První použitelná verze pro veřejné katalogové ceny Pragopolairu. Ceny jsou brané jako bez DPH.</p>
        </div>
        <button className="primary" onClick={exportJson}><Download size={18}/> Export dat</button>
      </header>

      <section className="grid two">
        <div className="card">
          <h2>Produkty</h2>
          <div className="toolbar">
            <label className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Hledat: ventil, měď, jednotka..." /></label>
            <select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="table">
            <div className="row head"><span>Název</span><span>Kategorie</span><span>Cena bez DPH</span><span></span></div>
            {filtered.map(product => <div className="row" key={product.id}>
              <span><strong>{product.name}</strong><small>{product.supplier}</small></span>
              <span>{product.category}</span>
              <span>{money(product.price)}</span>
              <button onClick={() => addToCart(product)}><Plus size={16}/> Přidat</button>
            </div>)}
          </div>
        </div>

        <div className="card sticky">
          <h2><ShoppingCart size={20}/> Zakázka</h2>
          {cart.length === 0 ? <p className="muted">Zatím prázdné. Přidej položky z katalogu.</p> : <div className="cart">
            {cart.map(item => <div className="cartItem" key={item.id}>
              <div><strong>{item.name}</strong><small>{money(item.price)} / ks</small></div>
              <input type="number" min="1" value={item.qty} onChange={e => updateQty(item.id, e.target.value)} />
              <span>{money(item.price * item.qty)}</span>
              <button className="icon" onClick={() => removeItem(item.id)}><Trash2 size={16}/></button>
            </div>)}
            <div className="total"><span>Celkem bez DPH</span><strong>{money(total)}</strong></div>
            <div className="total secondary"><span>Celkem s DPH 21 %</span><strong>{money(total * 1.21)}</strong></div>
          </div>}
        </div>
      </section>

      <section className="card">
        <h2><Upload size={20}/> Import z Pragopolairu</h2>
        <p className="muted">Kvůli omezení prohlížeče nejde veřejný e-shop spolehlivě načítat přímo z aplikace bez serveru. Proto je ve v2 bezpečná varianta: otevři Pragopolair, zkopíruj text/HTML stránky a vlož ho sem. Později přidáme serverový import.</p>
        <p><a href={PRAGOPOLAIR_URL} target="_blank" rel="noreferrer">Otevřít Pragopolair <ExternalLink size={14}/></a></p>
        <textarea value={htmlInput} onChange={e => setHtmlInput(e.target.value)} placeholder="Sem vlož zkopírovaný text nebo HTML ze stránky Pragopolairu..." />
        <button className="primary" onClick={parsePragopolairHtml}>Načíst vložené produkty</button>
        {notice && <p className="notice">{notice}</p>}
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
