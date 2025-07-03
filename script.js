let units = [];
let targetUnit = null;
let flatTarget = null;
let highlightedIndex = -1;
let currentSuggestions = [];
let selectedUnit = null;
let constValue = null;

function getDateSeed(date) {
  return Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const savedDate = localStorage.getItem('wgrdle_selected_date');
  const picker = document.getElementById('datePicker');

  if (savedDate) {
    picker.value = savedDate;
  } else {
    const today = new Date().toISOString().split('T')[0];
    picker.value = today;
  }
});

document.getElementById('datePicker').addEventListener('change', () => {
  const dailyToggle = document.getElementById('dailyToggle');
  const dateValue = document.getElementById('datePicker').value;

  if (dailyToggle.checked) {
    localStorage.setItem('wgrdle_selected_date', dateValue);
    location.reload();
  }
});


const closenessSets = {
  autonomy: ['60', '75', '90', '105', '120', '135', '150', '160', '165', '180', '195', '200', '230', '240', '250', '270', '280', '300', '320', '350', '360', '370', '390', '400', '410', '420', '425', '430', '435', '440', '450', '460', '470', '480', '500', '510', '520', '530', '540', '550', '560', '570', '575', '600', '630', '640', '650', '660', '680', '685', '700', '710', '720', '750', '785', '790', '800', '850', '900', '930', '950', '1000', '1100', '1200', '1600', '2000'],
  strength: ['2', '3', '4', '5', '6', '8', '10', '15', '100'],
  optics_ground: ['Bad', 'Poor', 'Medium', 'Good', 'Very good', 'Exceptional'],
  optics_air: ['10', '20', '40', '80', '120', '150', '170', '250', '300', '450', '900'],
  stealth: ['Poor', 'Medium', 'Good', 'Very good', 'Exceptional'],
  size: ['Very small', 'Small', 'Medium', 'Big', 'Very big'],
};

const skipKeys = new Set(['coalition', 'weapon1_type', 'weapon2_type', 'weapon3_type']);
const displayKeys = [];

function flatten(unit) {
  return {
    ...unit,
    ...{
      weapon1: unit.weapon1,
      weapon2: unit.weapon2,
      weapon3: unit.weapon3
    }
  };
}

function normalize(value, key) {
  if (value === 'N/A') {
    return ['optics_ground', 'optics_air', 'size'].includes(key) ? '0' : null;
  }
  return value;
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")            // decompose accents
    .replace(/[\u0300-\u036f]/g, "")  // remove diacritics
    .replace(/-/g, ' ')          // treat dashes as spaces
    .trim();
}

function abbreviateCategories(catArray) {
  const map = {
    Mechanized: 'MEC',
    Motorized: 'MOT',
    Marine: 'MAR',
    Airborne: 'AIR',
    Armored: 'ARM',
    Support: 'SUP'
  };
  return (catArray || []).map(c => map[c] || c).join(', ');
}

function isAdjacent(value, key) {
  const set = closenessSets[key];
  if (!set) return [];
  const idx = set.indexOf(value);
  return idx !== -1 ? [set[idx - 1], set[idx + 1]].filter(Boolean) : [];
}

function isClose(key, guessVal, targetVal, guessUnit, targetUnit) {
  if (key === 'name' || key === 'tab') return false;

  if (key === 'year') {
    return Math.abs(Number(guessVal) - Number(targetVal)) <= 1;
  }

  if (key == 'price') {
    if (Number(targetVal) <= 50) {
      return Math.abs(Number(guessVal) - Number(targetVal)) <= 5;
    }
    return Math.abs(Number(guessVal) - Number(targetVal)) <= 10;
  }

  if (key === 'country') {
    const gCoal = guessUnit.coalition || [];
    const tCoal = targetUnit.coalition || [];
    return gCoal.some(c => tCoal.includes(c));
  }

  if (key.startsWith('weapon') && !key.endsWith('_type')) {
    const typeKey = key + '_type';
    const gType = guessUnit[typeKey];
    const tType = targetUnit[typeKey];
    if (gType === 'N/A' || tType === 'N/A') {
      return gType === tType;
    }
    return gType === tType;
  }

  if (key === 'categories') {
    const guessSet = new Set(guessVal || []);
    const targetSet = new Set(targetVal || []);

    const isSubset = [...guessSet].every(x => targetSet.has(x));
    const isEqual = guessSet.size === targetSet.size && isSubset;

    return isSubset && !isEqual                  // no match
  }

  const normGuess = normalize(guessVal, key);
  const normTarget = normalize(targetVal, key);
  if (normGuess == null || normTarget == null) return false;

  const adjacent = isAdjacent(normTarget, key);
  return adjacent.includes(normGuess);
}

function getTooltip(key, guessVal, targetVal, guessUnit, targetUnit) {
  if (key == 'price') {
    return '+-5 if price <= 50, else +-10'
  }
  if (key.startsWith('weapon') && !key.endsWith('_type')) {
    const typeKey = key + '_type';
    const targetType = targetUnit[typeKey];
    return `Weapon is of type ${targetType}`;
  }

  if (key === 'categories') {
    return `Your categories are a subset of the correct ones`;
  }

  if (key == 'stealth' || key == 'size') {
    return 'The correct value is adjacent to your value'
  }

  if (key in closenessSets) {
    const set = closenessSets[key];
    const idx = set.indexOf(normalize(targetVal, key));
    const low = set[idx - 1];
    const high = set[idx + 1];
    const range = [low, key, high].filter(Boolean).join(' ≤ ');
    return `${range}`;
  }

  if (key === 'year') {
    return `${targetVal - 1} ≤ year ≤ ${+targetVal + 1}`;
  }

  if (key === 'country') {
    const common = (guessUnit.coalition || []).filter(c => (targetUnit.coalition || []).includes(c));
    return `Both belong to coalition: ${common.join(', ')}`;
  }

  return '';
}

function updateHighlight(items) {
  selectedUnit =
    items.forEach((item, i) => {
      item.style.backgroundColor = i === highlightedIndex ? '#e0eaff' : '';
    });
}


function parseValue(val) {
  if (typeof val === 'string') {
    if (val.includes('%')) return parseFloat(val) / 100;
    if (val.includes('km') || val.includes('m')) return parseFloat(val);
  }
  return typeof val === 'number' ? val : val;
}

function selectUnit(units) {
  const dailyMode = document.getElementById('dailyToggle').checked;
  let date;

  if (dailyMode) {
    const saved = localStorage.getItem('wgrdle_selected_date');
    date = saved ? new Date(saved) : new Date();
    const seed = getDateSeed(date);
    const rng = mulberry32(seed);
    return units[Math.floor(rng() * units.length)];
  } else {
    return units[Math.floor(Math.random() * units.length)];
  }
}



fetch('data/units.json')
  .then(res => res.json())
  .then(data => {
    units = data.filter(u => u && u.name);
    targetUnit = selectUnit(units);
    flatTarget = flatten(targetUnit);
    document.getElementById('newUnitBtn').addEventListener('click', () => {
      location.reload(); // easiest way to reset everything
    });

    document.getElementById('giveUpBtn').addEventListener('click', () => {
      const revealBox = document.getElementById('revealUnit');
      revealBox.textContent = `The unit was: ${targetUnit.name}`;
      revealBox.style.display = 'block';

      const revealTable = document.getElementById('revealTable');
      revealTable.innerHTML = '';

      // ✅ Add header row
      const headerRow = document.createElement('tr');
      for (const key of displayKeys) {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
      }
      revealTable.appendChild(headerRow);

      // ✅ Add value row
      const row = document.createElement('tr');
      for (const key of displayKeys) {
        const td = document.createElement('td');
        const val = flatTarget[key];
        td.textContent = Array.isArray(val) ? abbreviateCategories(val) : val;
        td.classList.add('match');
        row.appendChild(td);
      }
      revealTable.appendChild(row);
      revealTable.style.display = 'table';

    });


    // document.getElementById('title').textContent = `Match stats with ${targetUnit.name}`;

    const table = document.getElementById('resultsTable');

    // Set display keys dynamically
    for (const key in flatTarget) {
      if (!skipKeys.has(key)) displayKeys.push(key);
    }

    const headerRow = document.createElement('tr');
    for (const key of displayKeys) {
      const th = document.createElement('th');
      th.textContent = key;
      headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
  });

document.getElementById('searchBtn').addEventListener('click', function () {
  const query = document.getElementById('unitInput').value.toLowerCase();
  let unit = null;
  if (selectedUnit && selectedUnit.name.toLowerCase() === query) {
    unit = selectedUnit;
  } else {
    unit = units.find(u => u && u.name && u.name.toLowerCase() === query);
  }

  if (!unit) return;

  const flatUnit = flatten(unit);
  const row = document.createElement('tr');
  const table = document.getElementById('resultsTable');

  for (const key of displayKeys) {
    const td = document.createElement('td');
    const guessVal = flatUnit[key];
    const targetVal = flatTarget[key];

    if (key === 'categories') {
      td.textContent = abbreviateCategories(guessVal);
    } else {
      td.textContent = Array.isArray(guessVal) ? guessVal.join(', ') : guessVal;
    }


    let isExactMatch = guessVal === targetVal;

    if (key === 'categories') {
      const normalize = arr => [...new Set((arr || []).map(s => s.trim().toLowerCase()))].sort();
      const normGuess = normalize(guessVal);
      const normTarget = normalize(targetVal);
      isExactMatch = normGuess.length === normTarget.length &&
        normGuess.every((val, i) => val === normTarget[i]);
    }

    if (isExactMatch) {
      td.classList.add('match');
    } else if (
      isClose(key, guessVal, targetVal, flatUnit, flatTarget)
    ) {
      td.classList.add('close', 'tooltip');
      td.setAttribute('data-tooltip', getTooltip(key, guessVal, targetVal, flatUnit, flatTarget));
    }


    row.appendChild(td);

    input.value = '';
    selectedUnit = null;
    highlightedIndex = -1;
    list.innerHTML = '';
  }

  const header = table.querySelector('tr');
  table.insertBefore(row, header.nextSibling);

  if (flatUnit.name === flatTarget.name) {
    const revealBox = document.getElementById('revealUnit');
    revealBox.className = 'success-box';
    revealBox.textContent = `Correct! The unit is ${targetUnit.name}`;
    revealBox.style.display = 'block';
  }

});

// Autocomplete dropdown
const input = document.getElementById('unitInput');
const list = document.getElementById('autocompleteList');

input.addEventListener('input', () => {
  const query = input.value.toLowerCase().trim();
  list.innerHTML = '';
  highlightedIndex = -1;

  if (query.length === 0) {
    currentSuggestions = [];
    return;
  }

  const queryWords = normalizeString(query).split(/\s+/);
  currentSuggestions = units
    .filter(u => {
      const unitWords = normalizeString(u.name).split(/\s+/);
      return queryWords.every(q => unitWords.some(w => w.startsWith(q)));
    })
    .slice(0, 10);

  currentSuggestions.forEach((match, index) => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '0.5rem';
    div.style.padding = '0.5rem';
    div.style.cursor = 'pointer';

    const flagImg = document.createElement('img');
    const countryFile = match.country.toLowerCase().replace(/\s+/g, '_');
    flagImg.src = `images/flags/${countryFile}.webp`;
    flagImg.alt = match.country;
    flagImg.style.width = '20px';
    flagImg.style.height = '14px';
    flagImg.style.objectFit = 'cover';
    flagImg.style.border = '1px solid #ccc';
    flagImg.style.borderRadius = '2px';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = match.name;

    div.appendChild(flagImg);
    div.appendChild(nameSpan);

    div.dataset.index = index;
    div.classList.add('autocomplete-item');
    div.addEventListener('mousedown', () => {
      input.value = match.name;
      list.innerHTML = '';
      selectedUnit = match; // ✅ store exact match
    });
    list.appendChild(div);
  });
});

input.addEventListener('keydown', (e) => {
  const items = list.querySelectorAll('.autocomplete-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (items.length === 0) return;
    highlightedIndex = (highlightedIndex + 1) % items.length;
    updateHighlight(items);
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (items.length === 0) return;
    highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
    updateHighlight(items);
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex >= 0 && currentSuggestions[highlightedIndex]) {
      const match = currentSuggestions[highlightedIndex];
      input.value = match.name;
      selectedUnit = match; // ✅ ensure correct unit is stored
      list.innerHTML = '';
      highlightedIndex = -1;
    }
    document.getElementById('searchBtn').click();
  }
});


document.addEventListener('click', (e) => {
  if (!input.contains(e.target)) list.innerHTML = '';
});




document.getElementById('dailyToggle').addEventListener('change', () => {
  if (!document.getElementById('dailyToggle').checked) {
    localStorage.removeItem('wgrdle_selected_date');
  }
  location.reload();
});



