# Counter Burraco — PWA v1.1

PWA mobile-first per segnare i punti di una partita di Burraco.

## Funzioni
- 2 squadre da 2 giocatori
- nomi modificabili
- nomi mostrati su due righe, senza punteggiatura
- inserimento BASE + CARTE per entrambe le squadre
- controllo dedicato `+ / −` per i valori negativi su iPhone
- totale mano e totale partita automatici
- storico della sola partita corrente
- storico con intestazioni `Squadra 1` e `Squadra 2`
- modifica ed eliminazione delle mani
- persistenza locale con IndexedDB (fallback localStorage)
- funzionamento offline tramite Service Worker
- nessun account, server o archivio delle partite terminate

## Struttura GitHub
Tutti i file sono già “sciolti”: non serve creare cartelle dal telefono.

Carica nella root del repository:

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

Puoi caricare anche README.md.

## Pubblicazione su GitHub Pages
1. Crea/apri il repository GitHub.
2. Carica tutti i file del pacchetto direttamente nella root.
3. Apri **Settings → Pages**.
4. In **Build and deployment** scegli `Deploy from a branch`.
5. Seleziona `main` e `/ (root)`.
6. Salva e attendi la pubblicazione.

## Installazione su iPhone
1. Apri l'URL GitHub Pages in Safari almeno una volta con connessione.
2. Tocca **Condividi**.
3. Seleziona **Aggiungi alla schermata Home**.
4. Avvia `Counter Burraco` dalla Home.

Dopo il primo caricamento l'app è disponibile anche offline.

## Nota aggiornamenti
Quando modifichi i file dell'app, incrementa `CACHE_NAME` in `sw.js`.
