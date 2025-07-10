import { normalize } from "./formatting.js";
import { closenessSets, ordinalCats } from "./constants.js";

function isAdjacent(value, key) {
  const set = closenessSets[key];
  if (!set) return [];
  const idx = set.indexOf(value);
  return idx !== -1 ? [set[idx - 1], set[idx + 1]].filter(Boolean) : [];
}

export function getClose(key, guessVal) {
  guessVal = !isNaN(Number(guessVal)) ? Number(guessVal) : guessVal;
  if (
    [
      "name",
      "country",
      "tab",
      "country",
      "weapon1",
      "weapon2",
      "weapon3",
    ].includes(key)
  )
    return false;

  if (key == "price") {
    return [
      guessVal <= 55 ? guessVal - 5 : guessVal - 10,
      guessVal <= 50 ? guessVal + 5 : guessVal + 10,
    ];
  }

  if (key == "year") {
    return [guessVal - 1, guessVal + 1];
  }
  console.log(key);
  const idx = closenessSets[key].indexOf(String(guessVal));

  const set = closenessSets[key];
  return [set[Math.max(0, idx - 1)], set[Math.min(set.length - 1, idx + 1)]];
}

export function isClose(key, guessVal, targetVal, guessUnit, targetUnit) {
  if (key === "name" || key === "tab") return false;

  if (key == "price") {
    if (Number(targetVal) <= 50) {
      return Math.abs(Number(guessVal) - Number(targetVal)) <= 5;
    }
    return Math.abs(Number(guessVal) - Number(targetVal)) <= 10;
  }

  if (key === "year") {
    return Math.abs(Number(guessVal) - Number(targetVal)) <= 1;
  }

  if (key === "country") {
    const gCoal = guessUnit.coalition || [];
    const tCoal = targetUnit.coalition || [];
    return gCoal.some((c) => tCoal.includes(c));
  }

  if (key.startsWith("weapon") && !key.endsWith("_type")) {
    const typeKey = key + "_type";
    const gType = guessUnit[typeKey];
    const tType = targetUnit[typeKey];
    if (gType === "N/A" || tType === "N/A") {
      return gType === tType;
    }
    return gType === tType;
  }

  if (key === "categories") {
    const guessSet = new Set(guessVal || []);
    const targetSet = new Set(targetVal || []);

    const isSubset = [...guessSet].every((x) => targetSet.has(x));
    const isEqual = guessSet.size === targetSet.size && isSubset;

    return isSubset && !isEqual;
  }

  // Key = optics || speed || strength || autonomy || size || stealth
  const normGuess = normalize(guessVal, key);
  const normTarget = normalize(targetVal, key);
  if (normGuess == null || normTarget == null) return false;

  const adjacent = isAdjacent(normTarget, key);
  return adjacent.includes(normGuess);
}

export function compareVals(key, a, b) {
  if (
    [
      "name",
      "categories",
      "country",
      "tab",
      "weapon1",
      "weapon2",
      "weapon3",
    ].includes(key)
  ) {
    return "";
  }

  a = a == "N/A" ? 0 : a;
  b = b == "N/A" ? 0 : b;

  if (["price", "year", "speed", "autonomy", "strength"].includes(key)) {
    return Number(a) - Number(b) > 0 ? true : false;
  } else {
    const x = closenessSets[key].indexOf(a);
    const y = closenessSets[key].indexOf(b);
    return x - y > 0 ? true : false;
  }
}

export function upOrDown(key, guessVal, targetVal) {
  const arrow = compareVals(key, guessVal, targetVal) ? "↓" : "↑";
  return ordinalCats.includes(key) ? arrow : "";
}
