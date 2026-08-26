# BooScore! — PWA v3.1.1

Release finale di rifinitura grafica allineata ai mockup approvati e ottimizzata per iPhone in modalità PWA standalone.

## Vincoli mantenuti senza modifiche
- sfondo esterno nero
- pannello applicazione chiaro
- angoli smussati esclusivamente nella parte superiore
- stessa impronta/formato mobile della PWA esistente
- pagina principale non scrollabile
- nessuna modifica alla logica principale di gioco e alla persistenza locale
- eventuale scorrimento confinato esclusivamente all’elenco della cronologia quando supera lo spazio disponibile

## Correzioni visuali v3.1.1
- tipografia UI convertita alla stack nativa iPhone (`-apple-system` / SF Pro) e alleggerita nei pesi
- gerarchie di testo ridimensionate e riallineate ai mockup
- margini interni delle card uniformati
- contenuti centrati verticalmente e orizzontalmente dove previsto
- spazi tra Squadra 1 / Squadra 2, scoreboard, stato partita e CTA ribilanciati
- punteggi ottimizzati fino a 4 cifre senza zeri iniziali
- frecce di navigazione ridisegnate con SVG controllato, non più con glifo tipografico
- Home: mascotte sotto i giocatori sostituite con due asset statici completi, senza arti tagliati
- Aggiungi mano: proporzioni di header, mascotte, card, campi, info e CTA riallineate al template approvato
- Cronologia: riepilogo, report, lista dinamica e empty state ridimensionati e riallineati
- Modifica mano: bottom sheet ridimensionato, card più ariose, Base e Carte su due righe, azioni allineate e contenute correttamente

## File da caricare su GitHub
Tutti i file vanno caricati direttamente nella root del repository. Non è necessaria alcuna cartella.

### Applicazione
- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`
- `favicon.svg`

### Mascotte
- `mascot-spade.png`
- `mascots-team1.png`
- `mascots-team2.png`
- `mascots-quartet.png`

`mascots-team1.png` e `mascots-team2.png` sono le coppie statiche complete usate nella Home. Evitano i precedenti ritagli degli arti delle mascotte singole.

### Icone PWA
- `apple-touch-icon.png`
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`
- `icon-source-1024.png`

## Cache PWA
Il Service Worker usa `booscore-v3.1.1`. I riferimenti a CSS e JavaScript includono inoltre la query `booscore-3.1.0`, così iPhone non dovrebbe riutilizzare la precedente grafica v3.0.1 dopo la pubblicazione.

Dopo il deploy su GitHub Pages, se l’icona già installata mostra ancora una versione precedente, chiudere completamente la PWA e riaprirla dopo che GitHub Pages ha terminato il deploy. In caso di cache iOS particolarmente persistente, rimuovere e aggiungere nuovamente la PWA alla Home una sola volta.


## v3.1.1 — micro-polish Home
- ridotto il peso tipografico dei nomi giocatori;
- ridotto il peso tipografico dei punteggi principali;
- matite di modifica giocatori rese più piccole e discrete;
- mascotte delle due squadre ingrandite mantenendo l’intera figura visibile.
