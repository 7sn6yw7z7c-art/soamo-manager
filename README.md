# SOAMO Manager v2

Vývojová React/Vite PWA aplikace pro porovnání cen a sestavení zakázky.

## Co umí v2

- modul Pragopolair s veřejnými katalogovými cenami bez DPH
- vyhledávání produktů
- filtrování kategorií
- přidání položek do zakázky
- výpočet celkem bez DPH i s DPH
- uložení dat do prohlížeče
- export dat do JSON
- ruční import textu/HTML z Pragopolairu
- připravený GitHub Pages deploy přes GitHub Actions

## Spuštění lokálně

```bash
npm install
npm run dev
```

## Nasazení na GitHub Pages

1. Nahraj obsah této složky do GitHub repozitáře.
2. V GitHubu otevři Settings → Pages.
3. Source nastav na GitHub Actions.
4. Pushni změny do větve `main`.
5. V záložce Actions počkej na dokončení deploye.

## Poznámka k importu Pragopolairu

Přímé načítání e-shopu z prohlížečové PWA může narazit na CORS omezení. Proto v2 používá bezpečný ruční import z vloženého textu/HTML. Pro plně automatické tahání celého katalogu bude potřeba serverový scraper/API.
