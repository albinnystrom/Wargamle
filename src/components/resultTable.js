import { sharedObjects } from "../shared/sharedObjects.js";
import {
  skipKeys,
  catTooltips,
  summaryVals,
  coalitionToCountry,
} from "../utils/constants.js";
import { compareVals, getClose } from "../utils/closeness.js";
import { abbreviateCategories } from "../utils/formatting.js";

const guessedCountries = [];

function countryKnown(td, key, coals) {
  if (coals.length == 1) {
    const onlyOne =
      coalitionToCountry[coals[0]].filter((c) => !guessedCountries.includes(c))
        .length == 1;
    if (onlyOne) {
      td.classList.add("match");
      td.textContent = sharedObjects.targetUnit[key];
    }
  }
}

export function initializeTable() {
  const table = document.getElementById("resultsTable");

  // Set display keys dynamically
  for (const key in sharedObjects.flatTarget) {
    if (!skipKeys.has(key)) sharedObjects.displayKeys.push(key);
  }

  const headerRow = document.createElement("tr");
  const guessRow = document.createElement("tr");
  for (const key of sharedObjects.displayKeys) {
    const th = document.createElement("th");
    const td = document.createElement("td");

    th.textContent = key;
    th.classList.add("tooltip");
    th.setAttribute("data-tooltip", catTooltips[key]);
    td.textContent = "?";

    headerRow.appendChild(th);
    guessRow.appendChild(td);

    td.addEventListener("click", function () {
      if (
        sharedObjects.gotHint &&
        !td.classList.contains("match") &&
        key != "name"
      ) {
        sharedObjects.gotHint = false;
        td.textContent = sharedObjects.targetUnit[key];
        td.classList.add("match");
        document.getElementById("infoBox").style.display = "none";
      }
    });
  }
  table.appendChild(guessRow);
  table.appendChild(headerRow);
}

export function updateSummaryVals(td, key, guessUnit, isClose) {
  let guessVal = guessUnit[key];
  guessVal = !isNaN(Number(guessVal)) ? Number(guessVal) : guessVal;

  // Return if not dynamic summaryval
  if (!(key in summaryVals)) {
    return;
  }

  // Already matched. Skip.
  if (td.classList.contains("match")) {
    return;
  }

  // Categories and country handled separately
  if (key == "categories") {
    if (isClose) {
      guessVal.forEach((x) => {
        const abr = abbreviateCategories([x]);
        if (!summaryVals[key].includes(abr)) {
          summaryVals[key].push(abr);
        }
      });
      td.textContent = `${[summaryVals[key].join(", ")]}`;
    }
    return;
  }

  if (key == "country") {
    guessedCountries.push(guessVal);
    const coal = guessUnit["coalition"];
    let next = null;
    if (td.classList.contains("close")) {
      const prev = td.textContent.replace("In ", "").split(" or ");
      if (isClose) {
        next = prev.filter((c) => coal.includes(c));
        td.textContent = `In ${next.join(" or ")}`;
      } else {
        next = prev.filter((c) => !coal.includes(c));
        td.textContent = `In ${next.join(" or ")}`;
        console.log("here");
      }

      countryKnown(td, key, next);
      return;
    }
    next = coal;
    //First time, just add coals
    if (isClose) {
      td.textContent = `In ${next.join(" or ")}`;
    }
    countryKnown(td, key, next);
    return;
  }
  let rng = null;
  if (isClose) {
    rng = getClose(key, guessVal);
  } else {
    let lwr = getClose(key, getClose(key, guessVal)[1])[1];
    let upr = getClose(key, getClose(key, guessVal)[0])[0];
    rng = [lwr, upr];
  }

  //lower bound
  if (
    (compareVals(key, rng[0], summaryVals[key][0]) || //if bigger than current
      summaryVals[key][0] == "?") && //or not yet filled
    (!compareVals(key, guessVal, sharedObjects.targetUnit[key]) || isClose) //and not bigger than target
  ) {
    summaryVals[key][0] = rng[0];
  }

  //upper bound
  if (
    (compareVals(key, summaryVals[key][1], rng[1]) || //if smaller than current
      summaryVals[key][1] == "?") && //or not yet filled
    (compareVals(key, guessVal, sharedObjects.targetUnit[key]) || isClose) //and (smaller than target or isClose)
  ) {
    summaryVals[key][1] = rng[1];
  }

  let isMatch = false;
  //If upper bound is lowest possible and vice verca
  if (
    (!isMatch &&
      getClose(key, summaryVals[key][0])[1] == summaryVals[key][0]) ||
    getClose(key, summaryVals[key][1])[0] == summaryVals[key][1]
  ) {
    isMatch = true;
  }
  if (
    !isMatch &&
    td.classList.contains("close") &&
    getClose(key, summaryVals[key][0]).includes(summaryVals[key][1])
  ) {
    //If is close and range is adjacent, correct value can be derived.
    isMatch = true;
  }
  //If both bounds ==, correct value found
  if (!isMatch && summaryVals[key][0] === summaryVals[key][1]) {
    isMatch = true;
  }

  if (isMatch) {
    td.textContent = `${sharedObjects.targetUnit[key]}`;
    td.classList.add("match");
    return;
  }

  //If nothing else, update values
  td.textContent = `${summaryVals[key][0]} - ${summaryVals[key][1]}`;
}
