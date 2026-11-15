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
2. Windows: dubbelklicka på `start.bat`. Mac/Linux: kör `./start.sh`. Webbläsaren öppnas av sig själv. Om en gammal server redan är igång väljer den nästa lediga port. Första gången installeras en osynlig webbläsare (cirka 150 MB), vilket tar någon minut.
3. Appen öppnas på http://localhost:8080. Knappen **Hämta live-priser från Byggmax** visas ovanför inköpslistan. Hämtningen tar någon minut, och sedan uppdateras priserna automatiskt varje timme.

Live-priser hämtas för virke och limträ (kr/m, butiken som Byggmax väljer åt dig). Övriga rader har riktpriser du kan ändra för hand. Utan server (till exempel `index.html` direkt eller GitHub Pages) fungerar allt utom live-knappen.

## Konton och sparade ritningar på servern

Med servern igång öppnas först `login.html`. Skapa ett konto eller logga in, så sparas dina ritningar på servern (mappen `data/`) och kan öppnas från vilken webbläsare som helst som når servern. Via "Fortsätt utan att logga in" sparas ritningar bara i den webbläsaren, som förut.

- Lösenord sparas som hash (scrypt), aldrig i klartext. Inloggningen gäller i 30 dagar.
- Servern lyssnar bara på din egen dator (`127.0.0.1`). Vill du nå den från mobilen i samma nät, starta med `HOST=0.0.0.0 node server.js` (Windows: `set HOST=0.0.0.0` först). Använd bara det i ett nät du litar på, eftersom anslutningen inte är krypterad (HTTP).
- Säkerhetskopiera mappen `data/` om du vill behålla ritningarna.

## Administratör

Det **första kontot** som skapas blir administratör. (Finns redan konton utan admin blir det äldsta kontot admin när servern startar.) Admin:
- ser alla användares ritningar i appens lista som `användare/ritning`, och kan öppna, ändra, spara och ta bort dem
- har en sida `admin.html` (länk "Admin" i appen) där man kan göra andra till admin, sätta nytt lösenord åt någon och ta bort konton
- kan inte ta bort sig själv eller sin egen adminrätt

## Nå appen från andra nät (publik adress)

Dubbelklicka på `start-publik.bat` (Mac/Linux: `./start-publik.sh`). Det startar servern och en gratis Cloudflare-tunnel, som ger en publik `https://…trycloudflare.com`-adress. Den fungerar från vilken dator eller mobil som helst, i vilket nät som helst.

- Datorn med servern måste vara på och skriptet igång. Adressen byts varje gång du startar om tunneln.
- Första gången: installera tunneln med `winget install Cloudflare.cloudflared` (Windows).
- I publikt läge är nya konton stängda: bara det första kontot (admin) kan skapas fritt, därefter skapar admin användare på `admin.html`. Priser från Byggmax kräver inloggning. Sätt `ALLOW_REGISTER=1` om du ändå vill ha öppen registrering.
- Inloggningen skickas krypterat (HTTPS) via tunneln. Använd ett långt lösenord på adminkontot.
- Vill du ha en fast adress som alltid är uppe utan din dator kan servern läggas på en molntjänst (till exempel en liten VPS eller Fly.io/Render med en disk för mappen `data/`).

## Delning, offert, alternativ, butikslista, säkerhetskopia och mobilapp

- **Dela ritning:** spara ritningen, välj den i listan och tryck *Dela länk*. Länken (`/?delad=…`) visar ritningen skrivskyddad utan konto, och ändringar du sparar syns direkt för den som har länken. *Stoppa delning* gör länken oanvändbar.
- **Offert (PDF):** under *Offert (PDF till kund)* fyller du i namn, kund, projekt, arbetskostnad och påslag på material. Loggan (valfri) sparas i webbläsaren.
- **Jämför alternativ:** tryck *Spara nuvarande som alternativ*, ändra ritningen och se skillnaden i kronor per del. Upp till 4 alternativ sparas med ritningen.
- **Inköpslista per butik:** välj butik per rad, kryssa av medan du handlar och se vad som är kvar att betala. Sparas med ritningen.
- **Säkerhetskopia:** servern kopierar `data/` till `data/backup/ÅÅÅÅ-MM-DD/` en gång per dygn och sparar 14 dagar.
- **Installera som app:** öppna adressen på mobilen och välj *Lägg till på hemskärmen*. Kräver HTTPS (publik adress) eller `localhost`.

## Fast gratisadress (Tailscale Funnel)

Ger en adress som `https://din-dator.ditt-nät.ts.net` som aldrig ändras. Datorn måste vara på och servern igång.

Gör en gång:
1. Installera Tailscale från https://tailscale.com/download och logga in (gratis konto).
2. Öppna https://login.tailscale.com/admin/dns och slå på **MagicDNS** och **HTTPS Certificates**.
3. Första gången du kör `start-fast.bat` visar Tailscale en länk som slår på **Funnel** för datorn. Öppna länken och godkänn.

Därefter räcker det att dubbelklicka på `start-fast.bat` (Mac/Linux: `./start-fast.sh`). Adressen skrivs ut i fönstret. Inställningarna för publikt läge (inloggning krävs för priser, stängd registrering efter första kontot) är samma som i `start-publik.bat`. Stäng av delningen med `tailscale funnel reset`.

## Egen domän (till exempel stomkalkyl.se)

Ger en riktig adress som `https://stomkalkyl.se`. Datorn måste vara på medan appen används.

Gör en gång:
1. **Köp domänen** hos en registrar, till exempel Loopia, Namecheap eller Porkbun (cirka 100–150 kr/år för .se). Kolla att namnet är ledigt på internetstiftelsen.se.
2. **Lägg domänen hos Cloudflare (gratis):** skapa konto på cloudflare.com, välj *Add a domain* och skriv in domänen. Cloudflare visar två namnservrar. Skriv in dem hos registraren där domänen är köpt (ställ in "namnservrar"). Det kan ta några timmar innan det slår igenom.
3. Installera tunneln: `winget install Cloudflare.cloudflared`.
4. Kör `setup-doman.bat` och skriv in adressen. Logga in hos Cloudflare när sidan öppnas.

Därefter startar du appen med `start-doman.bat` (Mac/Linux: `./start-doman.sh`). Samma skydd som i publikt läge gäller.

Obs: `stomkal.kyl.se` skulle kräva att du äger domänen `kyl.se`. Det gör du troligen inte, så välj en egen, till exempel `stomkalkyl.se`.

## Jämför priser mellan butiker

Under *Inköpslista per butik* finns knappen **Jämför priser mellan butiker**. Servern slår upp virke och limträ (kr/m) hos Byggmax, Beijer (beijerbygg.se/privat) och XL-BYGG Stenvalls i Kiruna med den osynliga webbläsaren. XL-BYGG läses från kategorisidorna *Plank & Reglar* och *Virke övrigt*, där priserna står i sidans text, visar billigast per rad och vad allt kostar hos varje butik. *Välj billigaste butik och pris per rad* fyller i butik och pris åt dig. Hämtningen tar flera minuter första gången (svaren sparas i en timme) och kräver att servern körs och att du är inloggad.

Butikernas sidor ser olika ut och kan ändras, så träffarna är bäst-möjligt. Rader som en butik saknar visas med "–". Kontrollera alltid priset i butiken innan du köper.

## Fler live-priser, egna priser och prishistorik

- **Fler varor med live-pris:** förutom virke och limträ hämtas nu isolering (kr/m²), ångspärr, vindpapp, takpapp, takplåt, gips-, vindskydds- och golvskivor samt fasadpanel. Priset räknas om till radens enhet (till exempel pris per paket delat med antal m² i namnet). Skruv och beslag säljs i förpackningar som varierar mycket och har kvar riktpriser. Ett pris som är mer än fem gånger för högt eller lågt jämfört med riktpriset avvisas som en feltolkning. Jämförelsen mellan butiker gäller samma varor (XL-BYGG läses bara för virke).
- **Egna priser per butik:** skriv in ett pris på en rad och tryck på ★ bredvid det. Appen kommer ihåg det för raden och butiken, markerar fältet och använder det före riktpris och live-pris. Allt finns under *Mina priser (per butik)*. Med konto följer de dig till andra enheter, annars sparas de i webbläsaren.
- **Prishistorik:** varje hämtat pris sparas på servern (`data/prishistorik.json`). Under *Prishistorik* ser du först och senaste pris, förändring i procent och en liten kurva per material och butik.
- **Prisvarning:** när du trycker Spara noteras priserna i kalkylen. När live-priserna sedan hämtas (även den automatiska hämtningen varje timme) visas en rad som "Kalkylen är 8 % dyrare nu" om skillnaden är minst 2 %.

## Admin: live-priser

Bara administratören ser vilka material som har live-pris. På `admin.html` finns fliken **Live-priser** med alla material och butiker, status (*Live-pris*, *Hittades inte*, *Ingen live-koppling*, *Eget pris*), senaste pris, förändring och en liten kurva. Du kan filtrera på status och butik. Listan fylls på varje gång någon hämtar live-priser eller jämför butiker. Panelen *Prishistorik* i appen och själva uppgifterna (`/api/prishistorik`) är nu bara tillgängliga för admin.

## Dra i handtag för att ändra storlek

I 3D-modellen finns orangea handtag (kulor) som du drar i:
- **Altan:** ena änden (startar längs väggen och förkortar/förlänger), andra änden (längd) och yttre kanten (djup).
- **Balkong:** båda ändar (längd) och yttre kanten (djup).
- **Garage, förråd, gäststuga och carport:** kulan på kortsidan ändrar längden, kulan på långsidan ändrar bredden. Byggnadens hörn ligger kvar även om den är roterad.
- **Vingar (L-, T-, X- och U-form):** kulorna ändrar vingens längd och bredd.

Måtten (i rutorna för Längd, Djup och så vidare) följer med, och värdet visas medan du drar. Rotation i 3D är avstängd på mobil, så handtagen används på dator eller surfplatta med "Rotera 3D" påslaget.
