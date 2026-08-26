# BooScore! v3.1.2 — nuova icona

Questo aggiornamento sostituisce esclusivamente l'icona PWA con la nuova versione approvata:
- sfondo beige chiaro pieno;
- quattro mascotte dei semi;
- coriandoli colorati;
- nessun bordo/sfondo nero nell'immagine sorgente.

## File da sostituire nella root di GitHub
Carica questi file tutti allo stesso livello di `index.html`:

- `apple-touch-icon.png`
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`
- `icon-source-1024.png`
- `sw.js`

Non sono necessarie cartelle e non serve modificare gli altri file della PWA.

## iPhone: visualizzare la nuova icona
L'icona Home può rimanere memorizzata da iOS anche dopo il deploy. Dopo aver aggiornato GitHub:
1. apri BooScore! in Safari una volta;
2. se l'icona Home non cambia, elimina solo il collegamento/app dalla schermata Home;
3. aggiungi nuovamente BooScore! tramite **Condividi → Aggiungi alla schermata Home**.

La cache del service worker è aggiornata a `booscore-v3.1.2`.
