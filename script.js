
let unitData = [];
let targetUnit = null;

document.addEventListener('alpine:init', () => {
  Alpine.data('wgrdleApp', () => ({
    guess: '',
    guesses: [],
    async init() {
      const res = await fetch('data/units.json');
      unitData = await res.json();

      // Deterministic "daily" unit based on date hash
      const day = new Date().toISOString().split('T')[0];
      const seed = day.split('-').reduce((a, b) => a + parseInt(b), 0);
      targetUnit = unitData[seed % unitData.length];
    },
    submitGuess() {
      const match = unitData.find(u => u.name.toLowerCase() === this.guess.toLowerCase());
      if (!match) return;

      const row = {};
      ['name', 'country', 'type', 'year', 'cost', 'strength'].forEach(stat => {
        const guessed = match[stat];
        const actual = targetUnit[stat];
        row[stat] = {
          value: guessed,
          match: guessed === actual ? 'green' :
                 (typeof actual === 'number' && Math.abs(guessed - actual) / actual <= 0.1 ? 'yellow' : 'gray')
        };
      });
      this.guesses.push(row);
      this.guess = '';
    }
  }));
});
