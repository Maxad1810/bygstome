# bygstome – Stomkalkyl

Materialberäkning för regelstomme med 3D-modell. Fyll i husets mått och få en inköpslista med mängder, riktpriser och totalsumma, och se huset i 3D.

## Kom igång

- **Lokalt:** öppna `index.html` i webbläsaren (allt ligger lokalt, även 3D-biblioteket, så det fungerar utan internet).
- **En enda fil:** `stomkalkyl-enfil.html` är hela appen i en fil.
- **På webben (GitHub Pages):** Settings → Pages → Deploy from a branch → `main` / `(root)`. Sidan hamnar då på `https://maxad1810.github.io/bygstome/`.

## Funktioner

- Husformer: rektangel, L-, T-, X- och U-form (vingar går att dra i 3D)
- 1–3 våningar, olika antal per del av huset
- Golv (plintar, bärlinor, bjälklag, ytskikt), väggstomme, skivor, isolering, fasad med luftspalt (stående eller liggande panel)
- Tak med takstolar eller limträbalkar, papp, plåt, vindskivor, rännor, stuprör, snörasskydd
- Fönster och dörrar per våning som går att dra i 3D
- El invändigt: uttag, brytare, lamputtag i vägg och tak, elcentral, kablar längs väggarna
- Altan med räcke och trappa
- Riktpriser (inte live-priser) med länk per rad till byggmax.se, och totalsumma
- Skala av lager i 3D
- Spara flera ritningar i webbläsaren, samt exportera/importera som `.json`
- Telefonvänligt

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och alla fält |
| `styles.css` | Utseende |
| `js/kalkyl.js` | Mått, mängdberäkning, öppningar, vingar, våningar, altan |
| `js/priser.js` | Riktpriser och summor |
| `js/3d.js` | 3D-modellen |
| `js/el.js` | El invändigt |
| `js/ritningar.js` | Spara, öppna, exportera och importera ritningar |
| `js/lager.js` | Skala av lager |
| `lib/` | three.js r128 och OrbitControls (MIT-licens) |
| `stomkalkyl-enfil.html` | Hela appen i en fil |

Skripten delar variabler och laddas i den ordning som står i `index.html`.

## Observera

- Priserna är riktpriser. Kontrollera på byggmax.se innan du beställer.
- Mängderna är ungefärliga. Kontrollera bjälklag, balkar och takstolar mot konstruktionsritning.
- Elinstallation får bara göras av behörig elinstallatör.
