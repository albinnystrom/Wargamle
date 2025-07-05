import {
  normalize,
  abbreviateCategories,
  flatten,
} from "../utils/formatting.js";
import { isClose } from "../utils/closeness.js";
import { closenessSets } from "../utils/constants.js";
import { sharedObjects } from "../shared/sharedObjects.js";

function getTooltip(key, guessVal, guessUnit, targetUnit) {
  if (key == "price") {
    return "+-5 if price <= 50, else +-10";
  }
  if (key.startsWith("weapon") && !key.endsWith("_type")) {
    const typeKey = key + "_type";
    const targetType = targetUnit[typeKey];
    return `Weapon is of type ${targetType}`;
  }

  if (key === "categories") {
    return `Your categories are a subset of the correct ones`;
  }

  if (key in closenessSets) {
    const set = closenessSets[key];
    const idx = set.indexOf(normalize(guessVal, key));
    const low = set[idx - 1];
    const high = set[idx + 1];
    const range = [low, key, high].filter(Boolean).join(" ≤ ");
    return `${range}`;
  }

  if (key === "year") {
    return `${guessVal - 1} ≤ year ≤ ${+guessVal + 1}`;
  }

  if (key === "country") {
    const common = (guessUnit.coalition || []).filter((c) =>
      (targetUnit.coalition || []).includes(c)
    );
    return `Both belong to coalition: ${common.join(", ")}`;
  }

  return "";
}

export function initializeSearch() {
  document.getElementById("searchBtn").addEventListener("click", function () {
    const query = document.getElementById("unitInput").value.toLowerCase();
    let unit = null;
    if (
      sharedObjects.selectedUnit &&
      sharedObjects.selectedUnit.name.toLowerCase() === query
    ) {
      unit = sharedObjects.selectedUnit;
    } else {
      unit = sharedObjects.units.find(
        (u) => u && u.name && u.name.toLowerCase() === query
      );
    }

    if (!unit) return;

    const flatUnit = flatten(unit);
    const row = document.createElement("tr");
    const table = document.getElementById("resultsTable");

    for (const key of sharedObjects.displayKeys) {
      const td = document.createElement("td");
      const guessVal = flatUnit[key];
      const targetVal = sharedObjects.flatTarget[key];

      if (key === "categories") {
        td.textContent = abbreviateCategories(guessVal);
      } else {
        td.textContent = Array.isArray(guessVal)
          ? guessVal.join(", ")
          : guessVal;
      }

      let isExactMatch = guessVal === targetVal;

      if (key === "categories") {
        const normalize = (arr) =>
          [...new Set((arr || []).map((s) => s.trim().toLowerCase()))].sort();
        const normGuess = normalize(guessVal);
        const normTarget = normalize(targetVal);
        isExactMatch =
          normGuess.length === normTarget.length &&
          normGuess.every((val, i) => val === normTarget[i]);
      }

      if (isExactMatch) {
        td.classList.add("match");
      } else if (
        isClose(key, guessVal, targetVal, flatUnit, sharedObjects.flatTarget)
      ) {
        td.classList.add("close", "tooltip");
        td.setAttribute(
          "data-tooltip",
          getTooltip(key, guessVal, flatUnit, sharedObjects.flatTarget)
        );
      }

      row.appendChild(td);

      sharedObjects.input.value = "";
      sharedObjects.selectedUnit = null;
      sharedObjects.highlightedIndex = -1;
      sharedObjects.list.innerHTML = "";
    }

    const header = table.querySelector("tr");
    table.insertBefore(row, header.nextSibling);

    if (flatUnit.name === sharedObjects.flatTarget.name) {
      const revealBox = document.getElementById("revealUnit");
      revealBox.className = "success-box";
      revealBox.textContent = `Correct! The unit is ${sharedObjects.targetUnit.name}`;
      revealBox.style.display = "block";
    }
  });
}

document.getElementById("newUnitBtn").addEventListener("click", () => {
  location.reload();
});

export function initializeGiveUpBtn() {
  document.getElementById("giveUpBtn").addEventListener("click", () => {
    const revealBox = document.getElementById("revealUnit");
    revealBox.textContent = `The unit was: ${sharedObjects.targetUnit.name}`;
    revealBox.style.display = "block";

    const revealTable = document.getElementById("revealTable");
    revealTable.innerHTML = "";

    const headerRow = document.createElement("tr");
    for (const key of sharedObjects.displayKeys) {
      const th = document.createElement("th");
      th.textContent = key;
      headerRow.appendChild(th);
    }
    revealTable.appendChild(headerRow);

    const row = document.createElement("tr");
    for (const key of sharedObjects.displayKeys) {
      const td = document.createElement("td");
      const val = sharedObjects.flatTarget[key];
      td.textContent = Array.isArray(val) ? abbreviateCategories(val) : val;
      td.classList.add("match");
      row.appendChild(td);
    }
    revealTable.appendChild(row);
    revealTable.style.display = "table";
  });
}

document.getElementById("dailyToggle").addEventListener("change", () => {
  if (!document.getElementById("dailyToggle").checked) {
    localStorage.removeItem("wgrdle_selected_date");
  }
  location.reload();
});
