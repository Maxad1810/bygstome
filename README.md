# bygstome – Stomkalkyl

Materialberäkning för regelstomme med 3D-modell. Fyll i husets mått och få en inköpslista med mängder, riktpriser och totalsumma, och se huset i 3D.

## Kom igång

- **Lokalt:** öppna `index.html` i webbläsaren (allt ligger lokalt, även 3D-biblioteket, så det fungerar utan internet).
- **En enda fil:** `stomkalkyl-enfil.html` är hela appen i en fil.
- **På webben (GitHub Pages):** Settings → Pages → Deploy from a branch → `main`, mappen där `index.html` ligger.

## Funktioner

- Välj vad du ska bygga: hus, fristående garage och/eller altan. Bara det du väljer visas, beräknas, ritas och tas med i PDF:en

- Husformer: rektangel, L-, T-, X- och U-form (vingar går att dra i 3D)
- 1–3 våningar, olika antal per del av huset
- Golv, väggstomme, skivor, isolering, fasad med luftspalt (stående eller liggande panel)
- Tak med takstolar eller limträbalkar, papp, plåt, vindskivor, rännor, stuprör, snörasskydd
- Fönster och dörrar per våning som går att dra i 3D
- El invändigt: uttag, brytare, lamputtag i vägg och tak, elcentral, kablar längs väggarna
- Fasadfärg och takfärg att välja (syns i 3D och på PDF-fasaderna)
- Altan med räcke och trappa. Balkong på valfri våning med räcke och stödstolpar, som går att dra i 3D. Altan och balkong syns på planritning och på alla fasader i PDF:en. Den går att dra i 3D och viker sig runt husets hörn
- Riktpriser (inte live-priser) med länk per rad till byggmax.se, och totalsumma
- Varningar och tips (tumregler) vid tråkiga mått, öppningar, altan/balkong utan räcke, garage över hus m.m.
- Ångra och gör om (även Ctrl+Z / Ctrl+Y)
- Enkel 3D-läge för långsammare enheter
- Balkongdörr läggs till automatiskt när du väljer balkong
- Förenklad hållfasthetskontroll (Eurokod 5, tumregler) av bjälkar, bärlinor, reglar, balkong, altan, carport m.m. – ersätter inte konstruktör
- Kapningslista (minst spill), inköp per kategori/leverantör, delning som kod, bygglovskoll (grov vägledning)
- Tak över altanen (pergola eller fullt tak), ränndal vid takanslutning, förråd/gäststuga/carport som egna byggnader
- Väggsnitt (principsnitt) i PDF:en
- Skala av lager i 3D
- Spara flera ritningar i webbläsaren, samt exportera/importera som `.json`
- Fristående garage med platta på mark, sadeltak, port, sidodörr och fönster. Garagets öppningar är en lista där du lägger till valfritt antal fönster, dörrar och portar. Garaget och dess port, dörr och fönster går att dra i 3D, och både hus och garage går att rotera. Måtten på öppningen visas medan du drar
- PDF-ritning: översikt, situationsplan, planritningar med mått, fasader med måttkedjor, fönster-/dörrschema, elschema och materiallista
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
| `js/hallfast.js` | Förenklad hållfasthetskontroll |
| `js/extra.js` | Kapningslista, kategorier, dela som kod, bygglovskoll |
| `js/pdf2.js` | Extra PDF-sidor: kapningslista, kategorier, bygglov, väggsnitt |
| `js/pdf.js` | PDF-ritning (situationsplan, planer, fasader, scheman, materiallista) |
| `lib/` | three.js r128, OrbitControls och jsPDF (MIT-licens) |
| `stomkalkyl-enfil.html` | Hela appen i en fil |

Skripten delar variabler och laddas i den ordning som står i `index.html`.

## Observera

- Priserna är riktpriser. Kontrollera på byggmax.se innan du beställer.
- Mängderna är ungefärliga. Kontrollera bjälklag, balkar och takstolar mot konstruktionsritning.
- Elinstallation får bara göras av behörig elinstallatör.

## Köra på din egen dator (med live-priser)

1. Installera Node.js (nodejs.org, version 18 eller nyare).
2. Windows: dubbelklicka på `start.bat`. Mac/Linux: kör `./start.sh`. Första gången installeras en osynlig webbläsare (cirka 150 MB), vilket tar någon minut.
3. Appen öppnas på http://localhost:8080. Knappen **Hämta live-priser från Byggmax** visas ovanför inköpslistan. Hämtningen tar någon minut, och sedan uppdateras priserna automatiskt varje timme.

Live-priser hämtas för virke och limträ (kr/m, butiken som Byggmax väljer åt dig). Övriga rader har riktpriser du kan ändra för hand. Utan server (till exempel `index.html` direkt eller GitHub Pages) fungerar allt utom live-knappen.

## Konton och sparade ritningar på servern

Med servern igång öppnas först `login.html`. Skapa ett konto eller logga in, så sparas dina ritningar på servern (mappen `data/`) och kan öppnas från vilken webbläsare som helst som når servern. Via "Fortsätt utan att logga in" sparas ritningar bara i den webbläsaren, som förut.

- Lösenord sparas som hash (scrypt), aldrig i klartext. Inloggningen gäller i 30 dagar.
- Servern lyssnar bara på din egen dator (`127.0.0.1`). Vill du nå den från mobilen i samma nät, starta med `HOST=0.0.0.0 node server.js` (Windows: `set HOST=0.0.0.0` först). Använd bara det i ett nät du litar på, eftersom anslutningen inte är krypterad (HTTP).
- Säkerhetskopiera mappen `data/` om du vill behålla ritningarna.
