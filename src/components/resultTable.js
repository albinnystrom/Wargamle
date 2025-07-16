import { sharedObjects } from "../shared/sharedObjects.js";
import { skipKeys, catTooltips, summaryVals } from "../utils/constants.js";
import { compareVals, getClose } from "../utils/closeness.js";
import { abbreviateCategories } from "../utils/formatting.js";

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

export function updateSummaryVals(td, key, guessVal, isClose) {
  guessVal = !isNaN(Number(guessVal)) ? Number(guessVal) : guessVal;

  // Return if not dynamic summaryval
  if (!(key in summaryVals)) {
    return;
  }

  // Already matched. Skip.
  if (td.classList.contains("match")) {
    return;
  }

  if (isClose) {
    td.classList.add("close");
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
    if (isClose) {
      td.textContent = `In ${sharedObjects.targetUnit.coalition.join(" or ")}`;
    }
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

  console.log(rng);

  //lower bound
  if (
    (compareVals(key, rng[0], summaryVals[key][0]) || //if bigger than current
      summaryVals[key][0] == "?") && //or not yet filled
    (!compareVals(key, guessVal, sharedObjects.targetUnit[key]) || isClose) //and not bigger than target
  ) {
    console.log("updated lower");
    summaryVals[key][0] = rng[0];
  }

  //upper bound
  if (
    (compareVals(key, summaryVals[key][1], rng[1]) || //if smaller than current
      summaryVals[key][1] == "?") && //or not yet filled
    (compareVals(key, guessVal, sharedObjects.targetUnit[key]) || isClose) //and (smaller than target or isClose)
  ) {
    console.log("updated upper");
    summaryVals[key][1] = rng[1];
  }

  //If is close and range is adjacent, correct value can be derived.
  if (
    td.classList.contains("close") &&
    getClose(key, summaryVals[key][0]).includes(summaryVals[key][1])
  ) {
    console.log("if1");
    td.textContent = `${sharedObjects.targetUnit[key]}`;
    td.classList.add("match");
    return;
  }
  if (summaryVals[key][0] === summaryVals[key][1]) {
    //If both bounds ==, correct value found
    td.textContent = `${sharedObjects.targetUnit[key]}`;
    td.classList.add("match");
    return;
  }

  //If nothing else, update values
  td.textContent = `${summaryVals[key][0]} - ${summaryVals[key][1]}`;
}
