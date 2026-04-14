const PRODUCTS = {
  base: {
    label: 'Base Game',
    standalone: true,
    factions: [
      { name: 'Galactic Empire',  cssClass: 'faction-empire' },
      { name: 'Rebel Alliance',   cssClass: 'faction-rebel'  },
    ],
    galaxyDeck: 'Base Game galaxy deck',
  },
  cloneWars: {
    label: 'Clone Wars Edition',
    standalone: true,
    factions: [
      { name: 'Galactic Republic',        cssClass: 'faction-republic'   },
      { name: 'Separatist Confederacy',   cssClass: 'faction-separatist' },
    ],
    galaxyDeck: 'Clone Wars galaxy deck',
  },
  mandalorian: {
    label: 'Mandalorian Faction Pack',
    standalone: false,
    factions: [
      { name: 'Mandalorian', cssClass: 'faction-mandalorian' },
    ],
    galaxyDeck: null,
    galaxyDeck3p: 'Mandalorian 3-player galaxy deck',
  },
};

const checkboxes = {
  base:        document.getElementById('cb-base'),
  cloneWars:   document.getElementById('cb-clone-wars'),
  mandalorian: document.getElementById('cb-mandalorian'),
};

const errorMsg          = document.getElementById('error-msg');
const resultsSection    = document.getElementById('results-section');
const standardLayout    = document.getElementById('standard-layout');
const twoVTwoLayout     = document.getElementById('two-v-two-layout');
const playerCardsEl     = document.querySelector('.player-cards');
const cardP3            = document.getElementById('card-p3');

const modeLabel1v1      = document.getElementById('mode-label-1v1');
const modeLabel2v2      = document.getElementById('mode-label-2v2');
const modeLabel3p       = document.getElementById('mode-label-3p');

function getChecked() {
  return Object.fromEntries(
    Object.entries(checkboxes).map(([k, el]) => [k, el.checked])
  );
}

function updateGameModeOptions() {
  const checked = getChecked();
  const can3p  = checked.mandalorian;
  const can2v2 = checked.base && checked.cloneWars;

  // Enable/disable 3p
  if (can3p) {
    modeLabel3p.classList.remove('disabled');
  } else {
    modeLabel3p.classList.add('disabled');
    if (document.querySelector('input[name="game-mode"]:checked').value === '3p') {
      document.querySelector('input[name="game-mode"][value="1v1"]').checked = true;
    }
  }

  // Enable/disable 2v2
  if (can2v2) {
    modeLabel2v2.classList.remove('disabled');
  } else {
    modeLabel2v2.classList.add('disabled');
    if (document.querySelector('input[name="game-mode"]:checked').value === '2v2') {
      document.querySelector('input[name="game-mode"][value="1v1"]').checked = true;
    }
  }
}

Object.values(checkboxes).forEach(cb => cb.addEventListener('change', updateGameModeOptions));
updateGameModeOptions();

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setCard(cardEl, factionNameEl, faction) {
  cardEl.className = 'player-card ' + faction.cssClass;
  factionNameEl.textContent = faction.name;
}

function randomize() {
  const checked = getChecked();

  // Validate: need at least one standalone product
  const hasStandalone = Object.entries(PRODUCTS).some(
    ([key, p]) => p.standalone && checked[key]
  );

  if (!hasStandalone) {
    errorMsg.classList.add('visible');
    resultsSection.classList.remove('visible', 'revealed');
    return;
  }
  errorMsg.classList.remove('visible');

  const mode = document.querySelector('input[name="game-mode"]:checked').value;

  // Build faction pool from checked products
  const factionPool = Object.entries(PRODUCTS)
    .filter(([key]) => checked[key])
    .flatMap(([, p]) => p.factions);

  const shuffledFactions = shuffle(factionPool);

  if (mode === '2v2') {
    // Pick 4 factions
    const [a1, a2, b1, b2] = shuffledFactions;

    // Assign galaxy decks: shuffle [base, cloneWars] and assign one per region
    const galaxyDecks = shuffle([
      PRODUCTS.base.galaxyDeck,
      PRODUCTS.cloneWars.galaxyDeck,
    ]);

    setCard(document.getElementById('card-2v2-a1'), document.getElementById('faction-2v2-a1'), a1);
    setCard(document.getElementById('card-2v2-a2'), document.getElementById('faction-2v2-a2'), a2);
    setCard(document.getElementById('card-2v2-b1'), document.getElementById('faction-2v2-b1'), b1);
    setCard(document.getElementById('card-2v2-b2'), document.getElementById('faction-2v2-b2'), b2);

    document.getElementById('galaxy-deck-r1').textContent = galaxyDecks[0];
    document.getElementById('galaxy-deck-r2').textContent = galaxyDecks[1];

    standardLayout.style.display = 'none';
    twoVTwoLayout.style.display  = 'grid';

  } else {
    const is3p = mode === '3p';
    const [f1, f2, f3] = shuffledFactions;

    // Pick one galaxy deck from checked standalone products
    const galaxyPool = Object.entries(PRODUCTS)
      .filter(([key, p]) => checked[key] && p.galaxyDeck)
      .map(([, p]) => p.galaxyDeck);

    let galaxyText = galaxyPool[Math.floor(Math.random() * galaxyPool.length)];
    if (is3p) galaxyText += ' + ' + PRODUCTS.mandalorian.galaxyDeck3p;

    document.getElementById('p1-faction').textContent = f1.name;
    document.getElementById('card-p1').className = 'player-card ' + f1.cssClass;

    document.getElementById('p2-faction').textContent = f2.name;
    document.getElementById('card-p2').className = 'player-card ' + f2.cssClass;

    if (is3p) {
      document.getElementById('p3-faction').textContent = f3.name;
      document.getElementById('card-p3').className = 'player-card ' + f3.cssClass;
      playerCardsEl.classList.add('three-players');
    } else {
      playerCardsEl.classList.remove('three-players');
    }

    document.getElementById('galaxy-deck').textContent = galaxyText;

    standardLayout.style.display = 'block';
    twoVTwoLayout.style.display  = 'none';
  }

  // Reveal results with transition
  resultsSection.classList.remove('revealed');
  resultsSection.classList.add('visible');
  void resultsSection.offsetWidth;
  resultsSection.classList.add('revealed');
}

document.getElementById('randomize-btn').addEventListener('click', randomize);
