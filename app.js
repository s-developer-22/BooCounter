(() => {
  'use strict';

  const DEFAULT_STATE = Object.freeze({
    players: { a1: 'Matteo', a2: 'Alessio', b1: 'Martina', b2: 'Giulia' },
    hands: []
  });

  const DB_NAME = 'counter-burraco-db';
  const DB_VERSION = 1;
  const STORE = 'app';
  const STATE_KEY = 'current-state';
  const FALLBACK_KEY = 'counter-burraco-state-v2';

  let state = cloneDefault();
  let editingIndex = null;
  let confirmAction = null;
  let lastFocusedElement = null;
  let toastTimer = null;
  let historyIndex = 0;
  let historyHintTimer = null;
  let historyScrollTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    playerNameA1: $('#playerNameA1'),
    playerNameA2: $('#playerNameA2'),
    playerNameB1: $('#playerNameB1'),
    playerNameB2: $('#playerNameB2'),
    sheetTeamA1: $('#sheetTeamA1'),
    sheetTeamA2: $('#sheetTeamA2'),
    sheetTeamB1: $('#sheetTeamB1'),
    sheetTeamB2: $('#sheetTeamB2'),
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
    signBaseA: $('#signBaseA'),
    signCardsA: $('#signCardsA'),
    signBaseB: $('#signBaseB'),
    signCardsB: $('#signCardsB'),
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

  const signedFields = [
    [els.baseA, els.signBaseA],
    [els.cardsA, els.signCardsA],
    [els.baseB, els.signBaseB],
    [els.cardsB, els.signCardsB]
  ];

  function cloneDefault() {
    return { players: { ...DEFAULT_STATE.players }, hands: [] };
  }

  function cleanName(value) {
    const name = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
    return name || 'Giocatore';
  }

  function safeInt(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(-99999, Math.min(99999, Math.trunc(n)));
  }

  function normalizeMagnitude(value) {
    const digits = String(value ?? '').replace(/[^\d]/g, '').slice(0, 5);
    if (!digits) return 0;
    return Math.min(99999, Number(digits));
  }

  function readSignedField(input, toggle) {
    const magnitude = normalizeMagnitude(input.value);
    const sign = toggle.dataset.sign === '-1' ? -1 : 1;
    return magnitude * sign;
  }

  function setSignedField(input, toggle, value) {
    const n = safeInt(value);
    toggle.dataset.sign = n < 0 ? '-1' : '1';
    toggle.textContent = n < 0 ? '−' : '+';
    toggle.setAttribute('aria-pressed', n < 0 ? 'true' : 'false');
    input.value = String(Math.abs(n));
  }

  function sanitizeMagnitudeInput(input) {
    const magnitude = normalizeMagnitude(input.value);
    input.value = String(magnitude);
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
      hands: hands.map((hand) => ({
        baseA: safeInt(hand?.baseA),
        cardsA: safeInt(hand?.cardsA),
        baseB: safeInt(hand?.baseB),
        cardsB: safeInt(hand?.cardsB)
      }))
    };
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
      ? `${state.players.a1} e ${state.players.a2}`
      : `${state.players.b1} e ${state.players.b2}`;
  }

  function renderNames() {
    els.playerNameA1.textContent = state.players.a1;
    els.playerNameA2.textContent = state.players.a2;
    els.playerNameB1.textContent = state.players.b1;
    els.playerNameB2.textContent = state.players.b2;

    els.sheetTeamA1.textContent = state.players.a1;
    els.sheetTeamA2.textContent = state.players.a2;
    els.sheetTeamB1.textContent = state.players.b1;
    els.sheetTeamB2.textContent = state.players.b2;
  }

  function render() {
    renderNames();

    const score = totals();

    els.scoreA.textContent = score.a;
    els.scoreB.textContent = score.b;

    els.scoreSideA.classList.toggle('leading', score.a > score.b);
    els.scoreSideB.classList.toggle('leading', score.b > score.a);

    if (score.a === score.b) {
      els.leadText.textContent = 'Partita in parità';
    } else {
      const leader = score.a > score.b ? teamLabel('a') : teamLabel('b');
      const delta = Math.abs(score.a - score.b);
      els.leadText.textContent = `${leader} avanti di ${delta}`;
    }

    const count = state.hands.length;
    els.handCount.textContent = `${count} ${count === 1 ? 'giocata' : 'giocate'}`;

    renderHistory();
  }

  function renderHistory() {
    const count = state.hands.length;

    if (!count) {
      historyIndex = 0;
      els.historyList.innerHTML = `
        <div class="empty-state">
          <p>Nessuna mano inserita.</p>
        </div>`;
      return;
    }

    historyIndex = Math.max(0, Math.min(historyIndex, count - 1));

    const fragment = document.createDocumentFragment();

    state.hands.forEach((hand, index) => {
      const page = document.createElement('section');
      page.className = 'history-page';
      page.dataset.historyIndex = String(index);

      const scoreA = totalForHand(hand, 'a');
      const scoreB = totalForHand(hand, 'b');
      const hasPrevious = index > 0;
      const hasNext = index < count - 1;

      page.innerHTML = `
        <div class="history-row">
          <span class="round-number">${index + 1}</span>

          <div class="hand-cell">
            <b>${scoreA}</b>
            <small>${hand.baseA} + ${hand.cardsA}</small>
          </div>

          <div class="hand-cell">
            <b>${scoreB}</b>
            <small>${hand.baseB} + ${hand.cardsB}</small>
          </div>

          <div class="history-side-controls">
            <div class="row-actions">
              <button class="icon-btn" type="button" data-edit-hand="${index}" aria-label="Modifica mano ${index + 1}">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 17.3V21h3.7L18.6 10.1l-3.7-3.7L4 17.3Zm2 1.2 8.9-8.9 1 1-8.9 8.9H6v-1Zm13.7-11.2a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1 1 3.7 3.7 1-1Z"/></svg>
              </button>
              <button class="icon-btn icon-btn--danger" type="button" data-delete-hand="${index}" aria-label="Elimina mano ${index + 1}">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3h8l1 2h4v2H3V5h4l1-2Zm-2 6h12l-1 12H7L6 9Zm3 2 .5 8h1L10 11H9Zm5 0-.5 8h1L15 11h-1Z"/></svg>
              </button>
            </div>

            ${count > 1 ? `
              <div class="history-nav is-hinting" aria-hidden="true">
                <span class="history-arrow history-arrow--up ${hasPrevious ? 'is-available' : ''}">
                  <svg viewBox="0 0 24 24"><path d="m7 14 5-5 5 5H7Z"/></svg>
                </span>

                <span class="history-arrow history-arrow--down ${hasNext ? 'is-available' : ''}">
                  <svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5H7Z"/></svg>
                </span>
              </div>
            ` : `<div class="history-nav" aria-hidden="true"></div>`}
          </div>
        </div>
      `;

      fragment.appendChild(page);
    });

    els.historyList.replaceChildren(fragment);

    requestAnimationFrame(() => {
      const page = els.historyList.querySelector(`[data-history-index="${historyIndex}"]`);
      if (page) els.historyList.scrollTop = page.offsetTop;
    });

    if (count > 1) {
      clearTimeout(historyHintTimer);
      historyHintTimer = setTimeout(() => {
        els.historyList.querySelectorAll('.history-nav').forEach((nav) => {
          nav.classList.remove('is-hinting');
        });
      }, 2800);
    }
  }

  function updateHandPreview() {
    els.handTotalA.textContent =
      readSignedField(els.baseA, els.signBaseA) +
      readSignedField(els.cardsA, els.signCardsA);

    els.handTotalB.textContent =
      readSignedField(els.baseB, els.signBaseB) +
      readSignedField(els.cardsB, els.signCardsB);
  }

  function toggleSign(toggle) {
    const nextNegative = toggle.dataset.sign !== '-1';
    toggle.dataset.sign = nextNegative ? '-1' : '1';
    toggle.textContent = nextNegative ? '−' : '+';
    toggle.setAttribute('aria-pressed', nextNegative ? 'true' : 'false');
    updateHandPreview();
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

      setSignedField(els.baseA, els.signBaseA, 0);
      setSignedField(els.cardsA, els.signCardsA, 0);
      setSignedField(els.baseB, els.signBaseB, 0);
      setSignedField(els.cardsB, els.signCardsB, 0);
    } else {
      const hand = state.hands[editingIndex];
      if (!hand) return;

      els.handSheetTitle.textContent = `Modifica mano ${editingIndex + 1}`;
      els.confirmHandBtn.textContent = 'Salva modifica';

      setSignedField(els.baseA, els.signBaseA, hand.baseA);
      setSignedField(els.cardsA, els.signCardsA, hand.cardsA);
      setSignedField(els.baseB, els.signBaseB, hand.baseB);
      setSignedField(els.cardsB, els.signCardsB, hand.cardsB);
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
    }, 1500);
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
    } catch (_) {}

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
    } catch (_) {}

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
        historyIndex = 0;
        closeSheets();
        await persistAndRender('Nuova partita pronta');
      }
    });
  });

  els.sheetScrim.addEventListener('click', closeSheets);

  $$('[data-close-sheet]').forEach((button) => {
    button.addEventListener('click', closeSheets);
  });

  signedFields.forEach(([input, toggle]) => {
    toggle.setAttribute('aria-pressed', 'false');

    toggle.addEventListener('click', () => toggleSign(toggle));

    input.addEventListener('input', () => {
      sanitizeMagnitudeInput(input);
      updateHandPreview();
    });

    input.addEventListener('focus', () => {
      requestAnimationFrame(() => input.select());
    });
  });

  els.handForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const hand = {
      baseA: readSignedField(els.baseA, els.signBaseA),
      cardsA: readSignedField(els.cardsA, els.signCardsA),
      baseB: readSignedField(els.baseB, els.signBaseB),
      cardsB: readSignedField(els.cardsB, els.signCardsB)
    };

    if (editingIndex === null) {
      state.hands.push(hand);
      historyIndex = state.hands.length - 1;
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
          historyIndex = Math.max(0, Math.min(index - 1, state.hands.length - 1));
          closeSheets();
          await persistAndRender('Mano eliminata');
        }
      });
    }
  });

  els.historyList.addEventListener('touchend', (event) => {
    if (
      historySwipeStartY === null ||
      historySwipeStartX === null ||
      !event.changedTouches.length
    ) return;

    const endY = event.changedTouches[0].clientY;
    const endX = event.changedTouches[0].clientX;
    const deltaY = endY - historySwipeStartY;
    const deltaX = endX - historySwipeStartX;

    historySwipeStartY = null;
    historySwipeStartX = null;

    if (Math.abs(deltaY) < 28 || Math.abs(deltaY) <= Math.abs(deltaX)) return;

    moveHistory(deltaY < 0 ? 1 : -1);
  }, { passive: true });

  els.historyList.addEventListener('scroll', () => {
    if (state.hands.length <= 1) return;

    clearTimeout(historyScrollTimer);

    historyScrollTimer = setTimeout(() => {
      const pages = [...els.historyList.querySelectorAll('.history-page')];
      if (!pages.length) return;

      const top = els.historyList.scrollTop;
      let nearestIndex = historyIndex;
      let nearestDistance = Infinity;

      pages.forEach((page, index) => {
        const distance = Math.abs(page.offsetTop - top);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex !== historyIndex) {
        historyIndex = nearestIndex;
        renderHistory();
      }
    }, 70);
  }, { passive: true });

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
