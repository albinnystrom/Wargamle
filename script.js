let units = [];
let targetUnit = null;
let flatTarget = null;

// percent thresholds, relative to the target value (e.g. 0.1 = 10%)
const closenessPercent = {
  cost: 0.1,         // ±10%
  speed: 0.1,
  year: 0.05,        // ±5%
  accuracy: 0.05,
  range: 0.1,
  he: 0.15,
  availability: 0.1,
};


fetch('data/units.json')
  .then(res => res.json())
  .then(data => {
    units = data.filter(u => u && u.name);
    targetUnit = units[Math.floor(Math.random() * units.length)];
    flatTarget = { ...targetUnit, ...targetUnit.weapon };
    delete flatTarget.weapon;

    document.getElementById('title').textContent = `Match stats with ${targetUnit.name}`;

    const table = document.getElementById('resultsTable');
    const headerRow = document.createElement('tr');
    for (const key in flatTarget) {
      const th = document.createElement('th');
      th.textContent = key;
      headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
  });

document.getElementById('searchBtn').addEventListener('click', function () {
  const query = document.getElementById('unitInput').value.toLowerCase();
  const unit = units.find(u => u && u.name && u.name.toLowerCase() === query);

  if (unit) {
    const flatUnit = { ...unit, ...unit.weapon };
    delete flatUnit.weapon;

    const row = document.createElement('tr');
    const table = document.getElementById('resultsTable');

    for (const key in flatTarget) {
      const td = document.createElement('td');
      const guessVal = flatUnit[key];
      const targetVal = flatTarget[key];

      td.textContent = guessVal;

      // Clean comparison
      const parsedGuess = parseValue(guessVal);
      const parsedTarget = parseValue(targetVal);

      if (parsedGuess === parsedTarget) {
        td.classList.add('match');
      } else if (
        typeof parsedGuess === 'number' &&
        typeof parsedTarget === 'number' &&
        isClose(key, parsedGuess, parsedTarget)
      ) {
        td.classList.add('close');
      }

      row.appendChild(td);
    }

    table.appendChild(row);
  }
});

const input = document.getElementById('unitInput');
const list = document.getElementById('autocompleteList');

input.addEventListener('input', () => {
  const query = input.value.toLowerCase().trim();
  list.innerHTML = '';

  if (query.length === 0) return;

  const queryWords = query.split(/[\s-]+/);  // space or dash

  const matches = units
    .filter(u => {
      if (!u || !u.name) return false;
      const unitWords = u.name.toLowerCase().split(/[\s-]+/);  // space or dash

      return queryWords.every(qWord =>
        unitWords.some(unitWord => unitWord.startsWith(qWord))
      );
    })
    .slice(0, 10); // max suggestions

  for (const match of matches) {
    const div = document.createElement('div');
    div.textContent = match.name;
    div.style.padding = '0.3em';
    div.style.cursor = 'pointer';
    div.addEventListener('mousedown', () => {
      input.value = match.name;
      list.innerHTML = '';
    });
    list.appendChild(div);
  }
});

// hide on outside click
document.addEventListener('click', (e) => {
  if (!input.contains(e.target)) list.innerHTML = '';
});


// parse value, converting "45%" -> 0.45 and "1050 m" -> 1050
function parseValue(val) {
  if (typeof val === 'string') {
    if (val.includes('%')) {
      return parseFloat(val) / 100;
    }
    if (val.includes('m')) {
      return parseFloat(val);
    }
  }
  return typeof val === 'number' ? val : val;
}

function isClose(key, guess, target) {
  const percent = closenessPercent[key];
  if (percent === undefined || target === 0) return false;
  const diffRatio = Math.abs(guess - target) / target;
  return diffRatio <= percent;
}

