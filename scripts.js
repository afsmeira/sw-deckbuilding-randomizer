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
  reinforcements: {
    label: 'Rebel & Empire - Reinforcements Expansion',
    standalone: false,
    parentProduct: 'base',
    factions: [],
    galaxyDeck: null,
  },
};

const GAME_MODES = {
  '1v1': {
    label: '1v1',
    requiresProducts: [],
    allowedFactions: null,
  },
  '2v2': {
    label: '2v2',
    requiresProducts: ['base', 'cloneWars'],
    allowedFactions: null,
  },
  '2v2-reinforcements': {
    label: '2v2 w/ reinforcements',
    requiresProducts: ['base', 'reinforcements'],
    allowedFactions: ['Galactic Empire', 'Rebel Alliance'],
  },
  '3p': {
    label: '3-Player Free-for-All',
    requiresProducts: ['mandalorian'],
    allowedFactions: null,
  },
  '1v1-reinforcements': {
    label: '1v1 w/ reinforcements',
    requiresProducts: ['base', 'reinforcements'],
    allowedFactions: ['Galactic Empire', 'Rebel Alliance'],
  },
  '1v1-custom': {
    label: '1v1 custom',
    requiresProducts: ['base', 'reinforcements'],
    allowedFactions: ['Galactic Empire', 'Rebel Alliance'],
  },
  '1v1-campaign': {
    label: '1v1 campaign',
    requiresProducts: ['base', 'reinforcements'],
    allowedFactions: ['Galactic Empire', 'Rebel Alliance'],
  },
};

const checkboxes = {
  base:           document.getElementById('cb-base'),
  cloneWars:      document.getElementById('cb-clone-wars'),
  mandalorian:    document.getElementById('cb-mandalorian'),
  reinforcements: document.getElementById('cb-reinforcements'),
};

const errorMsg          = document.getElementById('error-msg');
const resultsSection    = document.getElementById('results-section');
const standardLayout    = document.getElementById('standard-layout');
const twoVTwoLayout     = document.getElementById('two-v-two-layout');
const playerCardsEl     = document.querySelector('.player-cards');
const cardP3            = document.getElementById('card-p3');

const modeLabel1v1              = document.getElementById('mode-label-1v1');
const modeLabel1v1Reinforcements = document.getElementById('mode-label-1v1-reinforcements');
const modeLabel1v1Custom        = document.getElementById('mode-label-1v1-custom');
const modeLabel1v1Campaign      = document.getElementById('mode-label-1v1-campaign');
const modeLabel2v2              = document.getElementById('mode-label-2v2');
const modeLabel2v2Reinforcements = document.getElementById('mode-label-2v2-reinforcements');
const modeLabel3p               = document.getElementById('mode-label-3p');

const campaignLogSection       = document.getElementById('campaign-log-section');
const campaignListView         = document.getElementById('campaign-list-view');
const campaignDetailView       = document.getElementById('campaign-detail-view');
const campaignList             = document.getElementById('campaign-list');
const campaignDetailTitle      = document.getElementById('campaign-detail-title');
const createNewCampaignBtn     = document.getElementById('create-new-campaign-btn');
const backToListBtn            = document.getElementById('back-to-list-btn');

let currentCampaignKey = null;

function getChecked() {
  return Object.fromEntries(
    Object.entries(checkboxes).map(([k, el]) => [k, el.checked])
  );
}

function canEnableMode(modeKey, checked) {
  const mode = GAME_MODES[modeKey];
  if (!mode) return false;

  if (mode.requiresProducts.length === 0) return true;
  return mode.requiresProducts.every(p => checked[p]);
}

function updateGameModeOptions() {
  const checked = getChecked();
  const modeLabels = {
    '1v1': modeLabel1v1,
    '1v1-reinforcements': modeLabel1v1Reinforcements,
    '1v1-custom': modeLabel1v1Custom,
    '1v1-campaign': modeLabel1v1Campaign,
    '2v2': modeLabel2v2,
    '2v2-reinforcements': modeLabel2v2Reinforcements,
    '3p': modeLabel3p,
  };

  const currentSelectedMode = document.querySelector('input[name="game-mode"]:checked').value;
  let shouldResetMode = false;

  Object.entries(modeLabels).forEach(([modeKey, label]) => {
    const canEnable = canEnableMode(modeKey, checked);
    if (canEnable) {
      label.classList.remove('disabled');
    } else {
      label.classList.add('disabled');
      if (currentSelectedMode === modeKey) {
        shouldResetMode = true;
      }
    }
  });

  if (shouldResetMode) {
    document.querySelector('input[name="game-mode"][value="1v1"]').checked = true;
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
  const gameMode = GAME_MODES[mode];

  // Build faction pool from checked products
  let factionPool = Object.entries(PRODUCTS)
    .filter(([key]) => checked[key])
    .flatMap(([, p]) => p.factions);

  // Filter factions if game mode restricts them
  if (gameMode.allowedFactions) {
    factionPool = factionPool.filter(f => gameMode.allowedFactions.includes(f.name));
  }

  const shuffledFactions = shuffle(factionPool);

  if (mode === '2v2' || mode === '2v2-reinforcements') {
    const isReinforcements = mode === '2v2-reinforcements';

    if (isReinforcements) {
      // For 2v2 w/ reinforcements: only randomize team assignments, use same for both regions
      const empireObj = { name: 'Galactic Empire', cssClass: 'faction-empire' };
      const rebelObj = { name: 'Rebel Alliance', cssClass: 'faction-rebel' };

      // Randomly assign which team gets Empire vs Rebel
      const assignmentA = Math.random() < 0.5 ? empireObj : rebelObj;
      const assignmentB = assignmentA.name === 'Galactic Empire' ? rebelObj : empireObj;

      setCard(document.getElementById('card-2v2-a1'), document.getElementById('faction-2v2-a1'), assignmentA);
      setCard(document.getElementById('card-2v2-a2'), document.getElementById('faction-2v2-a2'), assignmentA);
      setCard(document.getElementById('card-2v2-b1'), document.getElementById('faction-2v2-b1'), assignmentB);
      setCard(document.getElementById('card-2v2-b2'), document.getElementById('faction-2v2-b2'), assignmentB);

      // Use base game galaxy deck for both regions
      const galaxyDeck = PRODUCTS.base.galaxyDeck;
      document.getElementById('galaxy-deck-r1').textContent = galaxyDeck;
      document.getElementById('galaxy-deck-r2').textContent = galaxyDeck;
    } else {
      // Standard 2v2: Pick 4 factions and randomize galaxy decks
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
    }

    standardLayout.style.display = 'none';
    twoVTwoLayout.style.display  = 'grid';

  } else {
    const is3p = mode === '3p';
    const [f1, f2, f3] = shuffledFactions;

    // Pick one galaxy deck from checked standalone products
    const galaxyPool = Object.entries(PRODUCTS)
      .filter(([key, p]) => checked[key] && p.galaxyDeck && key !== 'reinforcements')
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

// Campaign log management
const CAMPAIGNS_STORAGE_KEY = 'swg-campaigns';

function getCampaigns() {
  const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveCampaigns(campaigns) {
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
}

function getCampaignKey(name, date) {
  return `${name}__${date}`;
}

function renderCampaignList() {
  const campaigns = getCampaigns();
  campaignList.innerHTML = '';

  if (Object.keys(campaigns).length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'campaign-list-empty';
    emptyMessage.textContent = 'No campaigns yet. Create one to get started!';
    campaignList.appendChild(emptyMessage);
    return;
  }

  // Sort campaigns by date (newest first)
  const sortedCampaigns = Object.entries(campaigns).sort((a, b) => {
    return new Date(b[1].date) - new Date(a[1].date);
  });

  sortedCampaigns.forEach(([key, campaign]) => {
    const li = document.createElement('li');
    li.className = 'campaign-list-item';

    const dateTime = campaign.timestamp ? new Date(campaign.timestamp) : new Date(campaign.date);
    const dateStr = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateDisplay = `${dateStr} at ${timeStr}`;

    const info = document.createElement('div');
    info.className = 'campaign-list-item-info';
    info.innerHTML = `
      <div class="campaign-list-item-name">${campaign.name}</div>
      <div class="campaign-list-item-date">${dateDisplay}</div>
    `;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'campaign-list-item-delete';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete campaign "${campaign.name}"?`)) {
        const campaigns = getCampaigns();
        delete campaigns[key];
        saveCampaigns(campaigns);
        renderCampaignList();
      }
    });

    li.appendChild(info);
    li.appendChild(deleteBtn);

    li.addEventListener('click', () => {
      currentCampaignKey = key;
      showCampaignDetail(key, campaign);
    });

    campaignList.appendChild(li);
  });
}

function showCampaignDetail(key, campaign) {
  currentCampaignKey = key;
  campaignDetailTitle.textContent = campaign.name;
  campaignListView.style.display = 'none';
  campaignDetailView.style.display = 'flex';
  renderCampaignDetails(campaign);
}

function renderCampaignDetails(campaign) {
  // Render Rebels sections
  renderCardList('rebels', 'removed-cards', campaign.rebels['removed-cards'] || [], false);
  renderCardList('rebels', 'removed-starter-cards', campaign.rebels['removed-starter-cards'] || [], true);
  renderCardList('rebels', 'added-starter-cards', campaign.rebels['added-starter-cards'] || [], true);
  renderCardList('rebels', 'removed-galaxy-cards', campaign.rebels['removed-galaxy-cards'] || [], true);
  renderCardList('rebels', 'added-galaxy-cards', campaign.rebels['added-galaxy-cards'] || [], true);
  // Render Empire sections
  renderCardList('empire', 'removed-cards', campaign.empire['removed-cards'] || [], false);
  renderCardList('empire', 'removed-starter-cards', campaign.empire['removed-starter-cards'] || [], true);
  renderCardList('empire', 'added-starter-cards', campaign.empire['added-starter-cards'] || [], true);
  renderCardList('empire', 'removed-galaxy-cards', campaign.empire['removed-galaxy-cards'] || [], true);
  renderCardList('empire', 'added-galaxy-cards', campaign.empire['added-galaxy-cards'] || [], true);
  // Render Force Track
  renderForceTrack(campaign.forceTrack);
}

function renderForceTrack(forceTrack) {
  ['game1', 'game2', 'game3', 'game4'].forEach(game => {
    const selectedValue = forceTrack[game];
    if (selectedValue) {
      const radio = document.querySelector(`input[name="force-${game}"][value="${selectedValue}"]`);
      if (radio) {
        radio.checked = true;
      }
    } else {
      document.querySelectorAll(`input[name="force-${game}"]`).forEach(r => r.checked = false);
    }
  });
}

function updateForceTrack(game, value) {
  const campaigns = getCampaigns();
  const campaign = campaigns[currentCampaignKey];

  if (!campaign.forceTrack) {
    campaign.forceTrack = {};
  }

  campaign.forceTrack[game] = value;
  saveCampaigns(campaigns);
}

function renderCardList(faction, subsection, cards, withQuantity) {
  const listEl = document.querySelector(`.campaign-card-list[data-faction="${faction}"][data-subsection="${subsection}"]`);
  listEl.innerHTML = '';

  if (!cards || cards.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'campaign-card-list-empty';
    emptyMessage.textContent = 'No cards added';
    listEl.appendChild(emptyMessage);
    return;
  }

  cards.forEach((card, index) => {
    const li = document.createElement('li');
    li.className = 'campaign-card-list-item';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'campaign-card-list-item-name';
    nameDiv.textContent = withQuantity ? card.name : card;

    li.appendChild(nameDiv);

    if (withQuantity) {
      const quantityDiv = document.createElement('div');
      quantityDiv.className = 'campaign-card-list-item-quantity';

      const label = document.createElement('span');
      label.className = 'campaign-card-list-item-quantity-label';
      label.textContent = 'Qty:';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'campaign-card-list-item-quantity-input';
      input.value = card.quantity || 1;
      input.min = '1';
      input.addEventListener('change', () => {
        updateCardQuantity(faction, subsection, index, parseInt(input.value) || 1);
      });

      quantityDiv.appendChild(label);
      quantityDiv.appendChild(input);
      li.appendChild(quantityDiv);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'campaign-card-list-item-delete';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => {
      deleteCardFromList(faction, subsection, index);
    });

    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

function addCardToList(faction, subsection, withQuantity) {
  const cardName = prompt('Enter card name:');
  if (!cardName || !cardName.trim()) {
    return;
  }

  const campaigns = getCampaigns();
  const campaign = campaigns[currentCampaignKey];

  if (!campaign[faction][subsection]) {
    campaign[faction][subsection] = [];
  }

  if (withQuantity) {
    campaign[faction][subsection].push({ name: cardName.trim(), quantity: 1 });
  } else {
    campaign[faction][subsection].push(cardName.trim());
  }

  saveCampaigns(campaigns);
  renderCardList(faction, subsection, campaign[faction][subsection], withQuantity);
}

function updateCardQuantity(faction, subsection, index, quantity) {
  const campaigns = getCampaigns();
  const campaign = campaigns[currentCampaignKey];

  if (campaign[faction][subsection] && campaign[faction][subsection][index]) {
    campaign[faction][subsection][index].quantity = quantity;
    saveCampaigns(campaigns);
  }
}

function deleteCardFromList(faction, subsection, index) {
  const campaigns = getCampaigns();
  const campaign = campaigns[currentCampaignKey];

  if (campaign[faction][subsection]) {
    campaign[faction][subsection].splice(index, 1);
    saveCampaigns(campaigns);
    // Check if this subsection uses quantities
    const listEl = document.querySelector(`.campaign-card-list[data-faction="${faction}"][data-subsection="${subsection}"]`);
    const withQuantity = listEl.classList.contains('campaign-card-list-with-quantity');
    renderCardList(faction, subsection, campaign[faction][subsection], withQuantity);
  }
}

function showCampaignList() {
  campaignListView.style.display = 'flex';
  campaignDetailView.style.display = 'none';
  renderCampaignList();
}

function createNewCampaign() {
  const name = prompt('Enter campaign name:');
  if (!name || !name.trim()) {
    return;
  }

  const campaigns = getCampaigns();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timestamp = now.toISOString();
  const key = getCampaignKey(name.trim(), dateStr);

  if (campaigns[key]) {
    alert('A campaign with this name already exists today');
    return;
  }

  campaigns[key] = {
    name: name.trim(),
    date: dateStr,
    timestamp,
    rebels: {
      'removed-cards': [],
      'removed-starter-cards': [],
      'added-starter-cards': [],
      'removed-galaxy-cards': [],
      'added-galaxy-cards': [],
    },
    empire: {
      'removed-cards': [],
      'removed-starter-cards': [],
      'added-starter-cards': [],
      'removed-galaxy-cards': [],
      'added-galaxy-cards': [],
    },
    forceTrack: {
      game1: null,
      game2: null,
      game3: null,
      game4: null,
    },
  };

  saveCampaigns(campaigns);
  showCampaignDetail(key, campaigns[key]);
}

createNewCampaignBtn.addEventListener('click', createNewCampaign);
backToListBtn.addEventListener('click', showCampaignList);

// Faction section toggle
function toggleFactionSection(faction) {
  const section = document.querySelector(`.faction-section[data-faction="${faction}"]`);
  section.classList.toggle('collapsed');
}

// Tab navigation
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('tab-active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('tab-active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('tab-active');
    button.classList.add('tab-active');

    // Render campaign list when switching to campaign log tab
    if (tabName === 'campaign-log') {
      renderCampaignList();
    }
  });
});
