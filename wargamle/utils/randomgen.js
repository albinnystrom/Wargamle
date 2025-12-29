import {
  subDays,
  isBefore,
  parseISO,
  differenceInYears,
} from "https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm";
import { firstTarget, firstDate } from "./constants.js";
import { sharedObjects } from "../shared/sharedObjects.js";

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

    // Christmas easter egg: on Dec 24 == Leopard 2. It was gonna be halfway into 2027
    // before Leopard 2 came up naturally - so here's a little gift for Razzman :-)
    if (date.getMonth() === 11 && date.getDate() == 24) {
      const infoBox = document.getElementById("infoBox");
      infoBox.className = "success-box";
      infoBox.textContent = `	༼ つ ◕_◕ ༽つ GIVE NAVAL GAME ༼ つ ◕_◕ ༽つ`;
      infoBox.style.display = "block";
      document.body.style.backgroundImage =
        "url('images/navalbackground.webp')";
      return units.find((unit) => unit.name === "Leopard 2");
    }

    if (sharedObjects.naval) {
      const infoBox = document.getElementById("infoBox");
      infoBox.className = "success-box";
      infoBox.textContent = `Yesterday was a joke.
Today the boats are real
(◕‿◕✿)`;
      infoBox.style.display = "block";
      document.body.style.backgroundImage =
        "url('images/navalbackground.webp')";
      return units.find((unit) => unit.name === "PO-HANG");
    }
    // Use old system if before cut-off date
    if (isBefore(date, firstDate)) {
      const seed = getDateSeed(date);
      const rng = mulberry32(seed);
      return units[Math.floor(rng() * units.length)];
    }

    // Generates new unit like above, but makes sure no repeats within a year.
    let previousTargets = localStorage.getItem("wgrdle_previous_targets");
    previousTargets = JSON.parse(previousTargets);
    if (!previousTargets) {
      previousTargets = firstTarget;
    }

    return getUnitFromDate(units, date, previousTargets, true);
  } else {
    return units[Math.floor(Math.random() * units.length)];
  }
}

function getUnitFromDate(units, date, previousTargets, store) {
  const storageKey = "wgrdle_previous_targets";

  const dateStr = date.toISOString().split("T")[0];
  if (dateStr in previousTargets) {
    return units[previousTargets[dateStr].idx];
  }

  const prevDay = subDays(date, 1);
  if (!(prevDay.toISOString().split("T")[0] in previousTargets)) {
    getUnitFromDate(units, prevDay, previousTargets, false);
  }

  // Removes entries more than a year from the date
  if (store) {
    previousTargets = Object.fromEntries(
      Object.entries(previousTargets).filter(([key]) => {
        const keyDate = parseISO(key);
        return differenceInYears(date, keyDate) < 1;
      })
    );
  }

  let seed = getDateSeed(date);
  let rng = mulberry32(seed);
  let idx = Math.floor(rng() * units.length);
  let unit = units[idx];
  let loop = 0;
  while (
    Object.values(previousTargets).some(
      (entry) => entry.name === unit.name && entry.date != dateStr
    ) &&
    loop < 10
  ) {
    loop++;
    seed += 1e5;
    rng = mulberry32(seed);
    idx = Math.floor(rng() * units.length);
    unit = units[idx];
  }

  previousTargets[date.toISOString().split("T")[0]] = {
    idx: idx,
    name: unit.name,
    dateStr: dateStr,
  };
  if (store) {
    localStorage.setItem(storageKey, JSON.stringify(previousTargets));
  }
  return unit;
}
