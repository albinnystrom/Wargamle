import { normalize } from "./formatting.js";
import { closenessSets } from "./constants.js";

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

function isAdjacent(value, key) {
  const set = closenessSets[key];
  if (!set) return [];
  const idx = set.indexOf(value);
  return idx !== -1 ? [set[idx - 1], set[idx + 1]].filter(Boolean) : [];
}
