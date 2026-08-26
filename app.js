(() => {
  'use strict';

  const DEFAULT_STATE = Object.freeze({
    players: { a1: 'Matteo', a2: 'Alessio', b1: 'Martina', b2: 'Giulia' },
    hands: []
  });

  // Keep the original storage identifiers so existing users do not lose a saved match.
  const DB_NAME = 'counter-burraco-db';
  const DB_VERSION = 1;
  const STORE = 'app';
  const STATE_KEY = 'current-state';
  const FALLBACK_KEY = 'counter-burraco-state-v2';

  let state = cloneDefault();
  let editingIndex = null;
  let confirmAction = null;
  let currentModal = null;
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    homeView: $('#homeView'),
    handView: $('#handView'),
    historyView: $('#historyView'),
    playerNameA1: $('#playerNameA1'),
    playerNameA2: $('#playerNameA2'),
    playerNameB1: $('#playerNameB1'),
    playerNameB2: $('#playerNameB2'),
    scoreA: $('#scoreA'),
    scoreB: $('#scoreB'),
    scoreSideA: $('#scoreSideA'),
    scoreSideB: $('#scoreSideB'),
    leadText: $('#leadText'),
    homeHandCount: $('#homeHandCount'),
    homeLastHand: $('#homeLastHand'),
    addHandBtn: $('#addHandBtn'),
    openHistoryBtn: $('#openHistoryBtn'),
    newGameBtn: $('#newGameBtn'),
    handBackBtn: $('#handBackBtn'),
    cancelAddHandBtn: $('#cancelAddHandBtn'),
    historyBackBtn: $('#historyBackBtn'),
    addHandForm: $('#addHandForm'),
    addBaseA: $('#addBaseA'),
    addCardsA: $('#addCardsA'),
    addBaseB: $('#addBaseB'),
    addCardsB: $('#addCardsB'),
    historyScoreA: $('#historyScoreA'),
    historyScoreB: $('#historyScoreB'),
    historyLastHand: $('#historyLastHand'),
    historyHandCount: $('#historyHandCount'),
    historyList: $('#historyList'),
    modalLayer: $('#modalLayer'),
    modalScrim: $('#modalScrim'),
    playersSheet: $('#playersSheet'),
    editHandSheet: $('#editHandSheet'),
    confirmSheet: $('#confirmSheet'),
    playersForm: $('#playersForm'),
    playerA1: $('#playerA1'),
    playerA2: $('#playerA2'),
    playerB1: $('#playerB1'),
    playerB2: $('#playerB2'),
    editHandTitle: $('#editHandTitle'),
    editHandForm: $('#editHandForm'),
    editBaseA: $('#editBaseA'),
    editCardsA: $('#editCardsA'),
    editBaseB: $('#editBaseB'),
    editCardsB: $('#editCardsB'),
    deleteHandBtn: $('#deleteHandBtn'),
    confirmTitle: $('#confirmTitle'),
    confirmText: $('#confirmText'),
    confirmDangerBtn: $('#confirmDangerBtn'),
    toast: $('#toast')
  };

  const addFields = [
    signedConfig('addBaseA', 'addBaseAMinus', 'addBaseAPlus'),
    signedConfig('addCardsA', 'addCardsAMinus', 'addCardsAPlus'),
    signedConfig('addBaseB', 'addBaseBMinus', 'addBaseBPlus'),
    signedConfig('addCardsB', 'addCardsBMinus', 'addCardsBPlus')
  ];

  const editFields = [
    signedConfig('editBaseA', 'editBaseAMinus', 'editBaseAPlus'),
    signedConfig('editCardsA', 'editCardsAMinus', 'editCardsAPlus'),
    signedConfig('editBaseB', 'editBaseBMinus', 'editBaseBPlus'),
    signedConfig('editCardsB', 'editCardsBMinus', 'editCardsBPlus')
  ];

  function signedConfig(inputId, minusId, plusId) {
    return { input: $(`#${inputId}`), minus: $(`#${minusId}`), plus: $(`#${plusId}`) };
  }

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
    return Math.max(-9999, Math.min(9999, Math.trunc(n)));
  }

  function normalizeMagnitude(value) {
    const digits = String(value ?? '').replace(/[^\d]/g, '').slice(0, 4);
    if (!digits) return 0;
    return Math.min(9999, Number(digits));
  }

  function sanitizeMagnitudeInput(input) {
    const digits = String(input.value ?? '').replace(/[^\d]/g, '').slice(0, 4);
    input.value = digits ? String(Math.min(9999, Number(digits))) : '';
  }

  function setField(config, value) {
    const n = safeInt(value);
    config.input.dataset.sign = n < 0 ? '-1' : '1';
    config.input.value = String(Math.abs(n));
    syncSignButtons(config);
  }

  function setSign(config, sign) {
    config.input.dataset.sign = sign < 0 ? '-1' : '1';
    syncSignButtons(config);
  }

  function syncSignButtons(config) {
    const negative = config.input.dataset.sign === '-1';
    config.minus.classList.toggle('is-active', negative);
    config.plus.classList.toggle('is-active', !negative);
    config.minus.setAttribute('aria-pressed', negative ? 'true' : 'false');
    config.plus.setAttribute('aria-pressed', negative ? 'false' : 'true');
  }

  function readField(config) {
    const magnitude = normalizeMagnitude(config.input.value);
    return magnitude * (config.input.dataset.sign === '-1' ? -1 : 1);
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
    return side === 'a' ? hand.baseA + hand.cardsA : hand.baseB + hand.cardsB;
  }

  function totals() {
    return state.hands.reduce((acc, hand) => {
      acc.a += totalForHand(hand, 'a');
      acc.b += totalForHand(hand, 'b');
      return acc;
    }, { a: 0, b: 0 });
  }

  function signed(value) {
    return value > 0 ? `+${value}` : String(value);
  }

  function setNumericSize(element, value) {
    const digits = String(Math.abs(Number(value) || 0)).length + (Number(value) < 0 ? 1 : 0);
    element.classList.toggle('is-four', digits === 4);
    element.classList.toggle('is-five', digits >= 5);
  }

  function latestHandCopy() {
    const hand = state.hands.at(-1);
    if (!hand) return 'Nessuna mano giocata';
    const a = totalForHand(hand, 'a');
    const b = totalForHand(hand, 'b');
    if (a === b) return `Parità: ${signed(a)} ciascuno`;
    return a > b ? `Squadra 1 ha fatto ${signed(a)}` : `Squadra 2 ha fatto ${signed(b)}`;
  }

  function renderNames() {
    els.playerNameA1.textContent = state.players.a1;
    els.playerNameA2.textContent = state.players.a2;
    els.playerNameB1.textContent = state.players.b1;
    els.playerNameB2.textContent = state.players.b2;
  }

  function renderHome() {
    renderNames();
    const score = totals();
    els.scoreA.textContent = score.a;
    els.scoreB.textContent = score.b;
    setNumericSize(els.scoreA, score.a);
    setNumericSize(els.scoreB, score.b);
    els.scoreSideA.classList.toggle('leading', score.a > score.b);
    els.scoreSideB.classList.toggle('leading', score.b > score.a);

    if (score.a === score.b) {
      els.leadText.innerHTML = '<img src="./mascot-spade.png" alt=""><span class="lead-star">★</span><span>Partita in parità</span>';
    } else {
      const side = score.a > score.b ? 1 : 2;
      els.leadText.innerHTML = `<img src="./mascot-spade.png" alt=""><span class="lead-star">★</span><span>Squadra ${side} in vantaggio</span>`;
    }

    const count = state.hands.length;
    els.homeHandCount.textContent = `${count} ${count === 1 ? 'giocata' : 'giocate'}`;
    els.homeLastHand.textContent = latestHandCopy();
  }

  function renderHistory() {
    const score = totals();
    els.historyScoreA.textContent = score.a;
    els.historyScoreB.textContent = score.b;
    setNumericSize(els.historyScoreA, score.a);
    setNumericSize(els.historyScoreB, score.b);
    els.historyLastHand.textContent = latestHandCopy();
    els.historyHandCount.textContent = String(state.hands.length);

    if (!state.hands.length) {
      els.historyList.innerHTML = '<div class="history-empty">Nessuna mano giocata</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    state.hands.forEach((hand, index) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'history-row';
      row.dataset.editHand = String(index);
      row.setAttribute('aria-label', `Modifica mano ${index + 1}`);
      row.innerHTML = `
        <span class="round-number">${index + 1}</span>
        <span class="history-score history-score--one"><i class="dot dot--one"></i>${signed(totalForHand(hand, 'a'))}</span>
        <span class="history-score history-score--two"><i class="dot dot--two"></i>${totalForHand(hand, 'b')}</span>
        <span class="history-chevron" aria-hidden="true">›</span>`;
      fragment.appendChild(row);
    });
    els.historyList.replaceChildren(fragment);
  }

  function renderAll() {
    renderHome();
    renderHistory();
  }

  function showView(name) {
    const map = { home: els.homeView, hand: els.handView, history: els.historyView };
    Object.entries(map).forEach(([key, view]) => {
      const active = key === name;
      view.hidden = !active;
      view.classList.toggle('is-active', active);
      view.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    if (name === 'history' && state.hands.length) {
      requestAnimationFrame(() => { els.historyList.scrollTop = els.historyList.scrollHeight; });
    }
  }

  function resetAddForm() {
    addFields.forEach((field) => setField(field, 0));
  }

  function openAddHand() {
    resetAddForm();
    showView('hand');
  }

  function openPlayers() {
    els.playerA1.value = state.players.a1;
    els.playerA2.value = state.players.a2;
    els.playerB1.value = state.players.b1;
    els.playerB2.value = state.players.b2;
    openModal(els.playersSheet);
  }

  function openEditHand(index) {
    if (!Number.isInteger(index) || !state.hands[index]) return;
    editingIndex = index;
    const hand = state.hands[index];
    els.editHandTitle.textContent = `Modifica mano ${index + 1}`;
    setField(editFields[0], hand.baseA);
    setField(editFields[1], hand.cardsA);
    setField(editFields[2], hand.baseB);
    setField(editFields[3], hand.cardsB);
    openModal(els.editHandSheet);
  }

  function openConfirmation({ title, text, buttonText, action }) {
    confirmAction = action;
    els.confirmTitle.textContent = title;
    els.confirmText.textContent = text;
    els.confirmDangerBtn.textContent = buttonText;
    openModal(els.confirmSheet);
  }

  function openModal(sheet) {
    currentModal = sheet;
    els.modalLayer.hidden = false;
    [els.playersSheet, els.editHandSheet, els.confirmSheet].forEach((item) => { item.hidden = item !== sheet; });
    requestAnimationFrame(() => sheet.querySelector('input, button')?.focus({ preventScroll: true }));
  }

  function closeModal() {
    els.modalLayer.hidden = true;
    [els.playersSheet, els.editHandSheet, els.confirmSheet].forEach((item) => { item.hidden = true; });
    currentModal = null;
    confirmAction = null;
  }

  function bindSignedConfig(config) {
    config.input.dataset.sign = '1';
    syncSignButtons(config);
    config.minus.addEventListener('click', () => setSign(config, -1));
    config.plus.addEventListener('click', () => setSign(config, 1));
    config.input.addEventListener('input', () => sanitizeMagnitudeInput(config.input));
    config.input.addEventListener('blur', () => { if (config.input.value === '') config.input.value = '0'; });
    config.input.addEventListener('focus', () => requestAnimationFrame(() => config.input.select()));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 1500);
  }

  async function persistAndRender(message) {
    renderAll();
    await saveState(state);
    if (message) showToast(message);
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB non disponibile'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
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
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      db.close();
      return;
    } catch (_) {}
    try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(normalized)); } catch (_) {}
  }

  addFields.concat(editFields).forEach(bindSignedConfig);

  els.addHandBtn.addEventListener('click', openAddHand);
  els.handBackBtn.addEventListener('click', () => showView('home'));
  els.cancelAddHandBtn.addEventListener('click', () => showView('home'));
  els.openHistoryBtn.addEventListener('click', () => showView('history'));
  els.historyBackBtn.addEventListener('click', () => showView('home'));
  $$('[data-edit-players]').forEach((button) => button.addEventListener('click', openPlayers));

  els.addHandForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.hands.push({
      baseA: readField(addFields[0]),
      cardsA: readField(addFields[1]),
      baseB: readField(addFields[2]),
      cardsB: readField(addFields[3])
    });
    await persistAndRender('Mano aggiunta');
    showView('home');
  });

  els.playersForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.players = {
      a1: cleanName(els.playerA1.value),
      a2: cleanName(els.playerA2.value),
      b1: cleanName(els.playerB1.value),
      b2: cleanName(els.playerB2.value)
    };
    closeModal();
    await persistAndRender('Giocatori aggiornati');
  });

  els.historyList.addEventListener('click', (event) => {
    const row = event.target.closest('[data-edit-hand]');
    if (row) openEditHand(Number(row.dataset.editHand));
  });

  els.editHandForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!Number.isInteger(editingIndex) || !state.hands[editingIndex]) return;
    state.hands[editingIndex] = {
      baseA: readField(editFields[0]),
      cardsA: readField(editFields[1]),
      baseB: readField(editFields[2]),
      cardsB: readField(editFields[3])
    };
    closeModal();
    editingIndex = null;
    await persistAndRender('Mano aggiornata');
  });

  els.deleteHandBtn.addEventListener('click', () => {
    const index = editingIndex;
    if (!Number.isInteger(index) || !state.hands[index]) return;
    openConfirmation({
      title: `Eliminare la mano ${index + 1}?`,
      text: 'Il punteggio totale verrà ricalcolato automaticamente.',
      buttonText: 'Elimina',
      action: async () => {
        state.hands.splice(index, 1);
        editingIndex = null;
        closeModal();
        await persistAndRender('Mano eliminata');
      }
    });
  });

  els.newGameBtn.addEventListener('click', () => {
    openConfirmation({
      title: 'Nuova partita?',
      text: 'Tutte le mani della partita corrente verranno eliminate. I nomi dei giocatori resteranno invariati.',
      buttonText: 'Azzera',
      action: async () => {
        state.hands = [];
        closeModal();
        await persistAndRender('Nuova partita pronta');
        showView('home');
      }
    });
  });

  els.modalScrim.addEventListener('click', closeModal);
  $$('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
  els.confirmDangerBtn.addEventListener('click', async () => {
    const action = confirmAction;
    if (typeof action === 'function') await action();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.modalLayer.hidden) closeModal();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveState(state); });
  window.addEventListener('pagehide', () => saveState(state));

  async function init() {
    state = await loadState();
    renderAll();
    showView('home');
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}), { once: true });
    }
  }

  init();
})();
