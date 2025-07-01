let units = [];
let targetUnit = null;
let flatTarget = null;

fetch('units.json')
  .then(res => res.json())
  .then(data => {
    units = data.filter(u => u && u.name); // remove nulls
    targetUnit = units[Math.floor(Math.random() * units.length)];
    flatTarget = { ...targetUnit, ...targetUnit.weapon };
    delete flatTarget.weapon;

    document.getElementById('title').textContent = `Match stats with ${targetUnit.name}`;

    // Add header row
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

    const table = document.getElementById('resultsTable');
    const row = document.createElement('tr');

    for (const key in flatTarget) {
      const td = document.createElement('td');
      const guessVal = flatUnit[key];
      const targetVal = flatTarget[key];
      td.textContent = guessVal;

      if (
        guessVal === targetVal ||
        (typeof guessVal === 'number' && typeof targetVal === 'number' && Math.abs(guessVal - targetVal) < 0.01)
      ) {
        td.classList.add('match');
      }

      row.appendChild(td);
    }

    table.appendChild(row);
  }
});
