(() => {
  'use strict';

  const DEFAULT_STATE = Object.freeze({
    players: {
      a1: 'Matteo',
      a2: 'Alessio',
      b1: 'Martina',
      b2: 'Giulia'
    },
    hands: []
  });

  const DB_NAME = 'counter-burraco-db';
  const DB_VERSION = 1;
  const STORE = 'app';
  const STATE_KEY = 'current-state';
  const FALLBACK_KEY = 'counter-burraco-state-v1';

  let state = cloneDefault();
  let editingIndex = null;
  let confirmAction = null;
  let lastFocusedElement = null;
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    teamNameA: $('#teamNameA'),
    teamNameB: $('#teamNameB'),
    historyHeadA: $('#historyHeadA'),
    historyHeadB: $('#historyHeadB'),
    sheetTeamA: $('#sheetTeamA'),
    sheetTeamB: $('#sheetTeamB'),
    scoreA: $('#scoreA'),
    scoreB: $('#scoreB'),
    scoreSideA: $('#scoreSideA'),
    scoreSideB: $('#scoreSideB'),
    leadText: $('#leadText'),
    handCount: $('#handCount'),
    historyList: $('#historyList'),
    addHandBtn: $('#addHandBtn'),
    editPlayersBtn: $('#editPlayersBtn'),
    newGameBtn: $('#newGameBtn'),
    sheetLayer: $('#sheetLayer'),
    sheetScrim: $('#sheetScrim'),
    handSheet: $('#handSheet'),
    playersSheet: $('#playersSheet'),
    confirmSheet: $('#confirmSheet'),
    handSheetTitle: $('#handSheetTitle'),
    confirmHandBtn: $('#confirmHandBtn'),
    handForm: $('#handForm'),
    playersForm: $('#playersForm'),
    baseA: $('#baseA'),
    cardsA: $('#cardsA'),
    baseB: $('#baseB'),
    cardsB: $('#cardsB'),
    handTotalA: $('#handTotalA'),
    handTotalB: $('#handTotalB'),
    playerA1: $('#playerA1'),
    playerA2: $('#playerA2'),
    playerB1: $('#playerB1'),
    playerB2: $('#playerB2'),
    confirmKicker: $('#confirmKicker'),
    confirmTitle: $('#confirmTitle'),
    confirmText: $('#confirmText'),
    confirmDangerBtn: $('#confirmDangerBtn'),
    toast: $('#toast')
  };

  function cloneDefault() {
    return {
      players: { ...DEFAULT_STATE.players },
      hands: []
    };
  }

  function cleanName(value) {
    const name = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
    return name || 'Giocatore';
  }

  function integerFromInput(input) {
    const raw = Number(input.value);
    if (!Number.isFinite(raw)) return 0;
    return Math.max(-99999, Math.min(99999, Math.trunc(raw)));
  }

  function normalizeState(value) {
    if (!value || typeof value !== 'object') return cloneDefault();

    const p = value.players || {};
    const hands = Array.isArray(value.hands) ? value.hands.slice(-200) : [];

    return {
      players: {
        a1: cleanName(p.a1 ?? DEFAULT_STATE.players.a1),
        a2: cleanName(p.a2 ?? DEFAULT_STATE.players.a2),
        b1: cleanName(p.b1 ?? DEFAULT_STATE.players.b1),
        b2: cleanName(p.b2 ?? DEFAULT_STATE.players.b2)
      },
      hands: hands.map((hand) => {
        const baseA = safeInt(hand?.baseA);
        const cardsA = safeInt(hand?.cardsA);
        const baseB = safeInt(hand?.baseB);
        const cardsB = safeInt(hand?.cardsB);
        return { baseA, cardsA, baseB, cardsB };
      })
    };
  }

  function safeInt(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(-99999, Math.min(99999, Math.trunc(n)));
  }

  function totalForHand(hand, side) {
    return side === 'a'
      ? hand.baseA + hand.cardsA
      : hand.baseB + hand.cardsB;
  }

  function totals() {
    let a = 0;
    let b = 0;

    for (const hand of state.hands) {
      a += totalForHand(hand, 'a');
      b += totalForHand(hand, 'b');
    }
    return { a, b };
  }

  function teamLabel(side) {
    return side === 'a'
      ? `${state.players.a1} · ${state.players.a2}`
      : `${state.players.b1} · ${state.players.b2}`;
  }

  function render() {
    const nameA = teamLabel('a');
    const nameB = teamLabel('b');

    els.teamNameA.textContent = nameA;
    els.teamNameB.textContent = nameB;
    els.historyHeadA.textContent = nameA;
    els.historyHeadB.textContent = nameB;
    els.sheetTeamA.textContent = nameA;
    els.sheetTeamB.textContent = nameB;

    const score = totals();
    els.scoreA.textContent = score.a;
    els.scoreB.textContent = score.b;

    els.scoreSideA.classList.toggle('leading', score.a > score.b);
    els.scoreSideB.classList.toggle('leading', score.b > score.a);

    if (score.a === score.b) {
      els.leadText.textContent = 'Partita in parità';
    } else {
      const leader = score.a > score.b ? nameA : nameB;
      const delta = Math.abs(score.a - score.b);
      els.leadText.textContent = `${leader} avanti di ${delta}`;
    }

    const count = state.hands.length;
    els.handCount.textContent = `${count} ${count === 1 ? 'giocata' : 'giocate'}`;
    renderHistory();
  }

  function renderHistory() {
    if (!state.hands.length) {
      els.historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-symbol" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <p>Nessuna mano inserita.</p>
        </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    state.hands.forEach((hand, index) => {
      const row = document.createElement('div');
      row.className = 'history-row';

      const scoreA = totalForHand(hand, 'a');
      const scoreB = totalForHand(hand, 'b');

      row.innerHTML = `
        <span class="round-number">${index + 1}</span>
        <div class="hand-cell">
          <b>${scoreA}</b><small>${hand.baseA} + ${hand.cardsA}</small>
        </div>
        <div class="hand-cell">
          <b>${scoreB}</b><small>${hand.baseB} + ${hand.cardsB}</small>
        </div>
        <div class="row-actions">
          <button class="icon-btn" type="button" data-edit-hand="${index}" aria-label="Modifica mano ${index + 1}">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 17.3V21h3.7L18.6 10.1l-3.7-3.7L4 17.3Zm2 1.2 8.9-8.9 1 1-8.9 8.9H6v-1Zm13.7-11.2a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1 1 3.7 3.7 1-1Z"/></svg>
          </button>
          <button class="icon-btn icon-btn--danger" type="button" data-delete-hand="${index}" aria-label="Elimina mano ${index + 1}">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3h8l1 2h4v2H3V5h4l1-2Zm-2 6h12l-1 12H7L6 9Zm3 2 .5 8h1L10 11H9Zm5 0-.5 8h1L15 11h-1Z"/></svg>
          </button>
        </div>`;

      fragment.appendChild(row);
    });

    els.historyList.replaceChildren(fragment);
    els.historyList.scrollTop = els.historyList.scrollHeight;
  }

  function updateHandPreview() {
    els.handTotalA.textContent = integerFromInput(els.baseA) + integerFromInput(els.cardsA);
    els.handTotalB.textContent = integerFromInput(els.baseB) + integerFromInput(els.cardsB);
  }

  function openSheet(sheet) {
    lastFocusedElement = document.activeElement;
    els.sheetLayer.hidden = false;
    for (const current of [els.handSheet, els.playersSheet, els.confirmSheet]) {
      current.hidden = current !== sheet;
    }
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const focusTarget = sheet.querySelector('input, button:not([data-close-sheet])');
      focusTarget?.focus({ preventScroll: true });
    });
  }

  function closeSheets() {
    els.sheetLayer.hidden = true;
    els.handSheet.hidden = true;
    els.playersSheet.hidden = true;
    els.confirmSheet.hidden = true;
    document.body.style.overflow = '';
    confirmAction = null;
    lastFocusedElement?.focus?.({ preventScroll: true });
    lastFocusedElement = null;
  }

  function openHandSheet(index = null) {
    editingIndex = Number.isInteger(index) ? index : null;

    if (editingIndex === null) {
      els.handSheetTitle.textContent = 'Nuova mano';
      els.confirmHandBtn.textContent = 'Conferma mano';
      els.baseA.value = '0';
      els.cardsA.value = '0';
      els.baseB.value = '0';
      els.cardsB.value = '0';
    } else {
      const hand = state.hands[editingIndex];
      if (!hand) return;
      els.handSheetTitle.textContent = `Modifica mano ${editingIndex + 1}`;
      els.confirmHandBtn.textContent = 'Salva modifica';
      els.baseA.value = hand.baseA;
      els.cardsA.value = hand.cardsA;
      els.baseB.value = hand.baseB;
      els.cardsB.value = hand.cardsB;
    }

    updateHandPreview();
    openSheet(els.handSheet);
  }

  function openPlayersSheet() {
    els.playerA1.value = state.players.a1;
    els.playerA2.value = state.players.a2;
    els.playerB1.value = state.players.b1;
    els.playerB2.value = state.players.b2;
    openSheet(els.playersSheet);
  }

  function openConfirmation({ kicker, title, text, buttonText, action }) {
    els.confirmKicker.textContent = kicker;
    els.confirmTitle.textContent = title;
    els.confirmText.textContent = text;
    els.confirmDangerBtn.textContent = buttonText;
    confirmAction = action;
    openSheet(els.confirmSheet);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 1800);
  }

  async function persistAndRender(message) {
    render();
    await saveState(state);
    if (message) showToast(message);
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB non disponibile'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Errore IndexedDB'));
    });
  }

  async function loadState() {
    try {
      const db = await openDb();
      const value = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(STATE_KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      if (value) return normalizeState(value);
    } catch (_) {
      // Fallback below.
    }

    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (raw) return normalizeState(JSON.parse(raw));
    } catch (_) {}

    return cloneDefault();
  }

  async function saveState(value) {
    const normalized = normalizeState(value);

    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(normalized, STATE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      db.close();
      return;
    } catch (_) {
      // Fallback below.
    }

    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(normalized));
    } catch (_) {}
  }

  els.addHandBtn.addEventListener('click', () => openHandSheet());
  els.editPlayersBtn.addEventListener('click', openPlayersSheet);

  els.newGameBtn.addEventListener('click', () => {
    openConfirmation({
      kicker: 'Nuova partita',
      title: 'Azzerare i punteggi?',
      text: 'Tutte le mani della partita corrente verranno eliminate. I nomi dei giocatori resteranno invariati.',
      buttonText: 'Azzera',
      action: async () => {
        state.hands = [];
        closeSheets();
        await persistAndRender('Nuova partita pronta');
      }
    });
  });

  els.sheetScrim.addEventListener('click', closeSheets);
  $$('[data-close-sheet]').forEach((button) => button.addEventListener('click', closeSheets));

  for (const input of [els.baseA, els.cardsA, els.baseB, els.cardsB]) {
    input.addEventListener('input', updateHandPreview);
    input.addEventListener('focus', () => input.select());
  }

  els.handForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const hand = {
      baseA: integerFromInput(els.baseA),
      cardsA: integerFromInput(els.cardsA),
      baseB: integerFromInput(els.baseB),
      cardsB: integerFromInput(els.cardsB)
    };

    if (editingIndex === null) {
      state.hands.push(hand);
      closeSheets();
      await persistAndRender('Mano aggiunta');
    } else {
      state.hands[editingIndex] = hand;
      closeSheets();
      await persistAndRender('Mano aggiornata');
    }

    editingIndex = null;
  });

  els.playersForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    state.players = {
      a1: cleanName(els.playerA1.value),
      a2: cleanName(els.playerA2.value),
      b1: cleanName(els.playerB1.value),
      b2: cleanName(els.playerB2.value)
    };

    closeSheets();
    await persistAndRender('Giocatori aggiornati');
  });

  els.historyList.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-hand]');
    if (editButton) {
      openHandSheet(Number(editButton.dataset.editHand));
      return;
    }

    const deleteButton = event.target.closest('[data-delete-hand]');
    if (deleteButton) {
      const index = Number(deleteButton.dataset.deleteHand);
      if (!Number.isInteger(index) || !state.hands[index]) return;

      openConfirmation({
        kicker: 'Elimina mano',
        title: `Eliminare la mano ${index + 1}?`,
        text: 'Il punteggio totale verrà ricalcolato automaticamente.',
        buttonText: 'Elimina',
        action: async () => {
          state.hands.splice(index, 1);
          closeSheets();
          await persistAndRender('Mano eliminata');
        }
      });
    }
  });

  els.confirmDangerBtn.addEventListener('click', async () => {
    const action = confirmAction;
    if (typeof action === 'function') await action();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.sheetLayer.hidden) closeSheets();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveState(state);
  });

  window.addEventListener('pagehide', () => {
    saveState(state);
  });

  async function init() {
    state = await loadState();
    render();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }, { once: true });
    }
  }

  init();
})();
