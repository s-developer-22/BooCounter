# BooScore! — PWA v2.0.0

BooScore! è una PWA mobile-first per segnare i punti di una partita di Burraco, utilizzabile anche offline.

## Funzioni
- 2 squadre da 2 giocatori
- nomi modificabili tramite le matite nei riquadri squadra
- inserimento BASE + CARTE per entrambe le squadre
- valori positivi o negativi con controlli `− / +`
- massimo 4 cifre per ciascun campo BASE/CARTE, senza zeri iniziali
- totale mano e totale partita automatici
- Home con punteggi, stato partita, ultima mano e accesso alla cronologia
- pagina `Cronologia mani` con totale, ultima mano, numero di mani giocate ed elenco dinamico
- modifica ed eliminazione di ogni mano tramite pannello dedicato
- persistenza locale con IndexedDB (fallback localStorage)
- funzionamento offline tramite Service Worker
- viewport fisso: nessuno scroll della pagina; eventuale scroll resta confinato all’elenco della cronologia
- nessun account o server

## Struttura GitHub
Carica i file direttamente nella root del repository:

- index.html
- styles.css
- app.js
- manifest.webmanifest
- sw.js
- .nojekyll
- favicon.svg
- apple-touch-icon.png
- icon-192.png
- icon-512.png
- icon-maskable-512.png
- icon-source-1024.png

## Pubblicazione su GitHub Pages
1. Carica/sostituisci i file nella root del repository.
2. Apri **Settings → Pages**.
3. In **Build and deployment** scegli `Deploy from a branch`.
4. Seleziona `main` e `/ (root)`.
5. Salva e attendi la pubblicazione.

## Installazione su iPhone
1. Apri l’URL GitHub Pages in Safari almeno una volta con connessione.
2. Tocca **Condividi**.
3. Seleziona **Aggiungi alla schermata Home**.
4. Avvia `BooScore!` dalla Home.

## Nota aggiornamenti
Il redesign BooScore! usa il cache name `booscore-v2.0.0` in `sw.js`. Per release future incrementare il valore del cache name.
