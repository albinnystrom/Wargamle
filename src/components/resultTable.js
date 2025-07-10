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

  // If already close, check if only one possible value. If so mark as correct.
  if (td.classList.contains("close")) {
    if (isClose) {
      const lims = getClose(key, guessVal);
      if (summaryVals[key][0] == lims[1]) {
        td.textContent = summaryVals[key][0];
        td.classList.add("match");
        return;
      }
      if (summaryVals[key][1] == lims[0]) {
        td.textContent = summaryVals[key][1];
        td.classList.add("match");
        return;
      }
    }

    // Check if excludes other part of interval
    if (summaryVals[key][0] == guessVal) {
      td.textContent = summaryVals[key][1];
      td.classList.add("match");
      return;
    }
    if (summaryVals[key][1] == guessVal) {
      td.textContent = summaryVals[key][0];
      td.classList.add("match");
      return;
    }
    return;
  }

  // Update with interval if close
  if (isClose) {
    summaryVals[key] = getClose(key, guessVal);
    td.textContent = summaryVals[key].join(" - ");
    return;
  }

  if (
    (compareVals(key, guessVal, summaryVals[key][0]) ||
      summaryVals[key][0] == "?") &&
    !compareVals(key, guessVal, sharedObjects.targetUnit[key])
  ) {
    summaryVals[key][0] = guessVal;
  }
  if (
    (!compareVals(key, guessVal, summaryVals[key][1]) ||
      summaryVals[key][1] == "?") &&
    compareVals(key, guessVal, sharedObjects.targetUnit[key])
  ) {
    summaryVals[key][1] = guessVal;
  }

  td.textContent = `${summaryVals[key][0]} - ${summaryVals[key][1]}`;
}
