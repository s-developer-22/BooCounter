# Counter Burraco — PWA

PWA mobile-first per segnare i punti di una partita di Burraco.

## Funzioni
- 2 squadre da 2 giocatori
- nomi modificabili
- inserimento BASE + CARTE per ogni squadra
- totale mano e totale partita automatici
- storico della partita corrente
- modifica ed eliminazione delle mani
- persistenza locale con IndexedDB (fallback localStorage)
- funzionamento offline tramite Service Worker
- nessun account, server o archivio delle partite terminate

## Pubblicazione su GitHub Pages
1. Crea un repository GitHub, ad esempio `counter-burraco`.
2. Carica **tutti i file e le cartelle contenuti in questo pacchetto nella root del repository**.
3. In GitHub apri **Settings → Pages**.
4. In **Build and deployment** scegli `Deploy from a branch`.
5. Seleziona `main` e `/ (root)`, quindi salva.
6. Attendi la pubblicazione e apri l'URL GitHub Pages.

## Installazione su iPhone
1. Apri l'URL pubblicato in Safari almeno una volta con connessione.
2. Tocca **Condividi**.
3. Scegli **Aggiungi alla schermata Home**.
4. Apri `Counter Burraco` dalla Home.

Dopo il primo caricamento la PWA resta utilizzabile offline.

## Aggiornamenti futuri
Quando modifichi file dell'app, incrementa il valore `CACHE_NAME` in `sw.js`
(es. `counter-burraco-v1.0.1`) così i dispositivi scaricheranno la nuova build.
