export function getDateSeed(date) {
  return Number(
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(date.getDate()).padStart(2, "0")}`
  );
}

export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickTarget(units) {
  const dailyMode = document.getElementById("dailyToggle").checked;
  let date;

  if (dailyMode) {
    const saved = localStorage.getItem("wgrdle_selected_date");
    date = saved ? new Date(saved) : new Date();
    const seed = getDateSeed(date);
    const rng = mulberry32(seed);
    return units[Math.floor(rng() * units.length)];
  } else {
    return units[Math.floor(Math.random() * units.length)];
  }
}
