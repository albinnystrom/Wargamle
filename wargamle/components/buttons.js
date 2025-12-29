import {
  normalize,
  abbreviateCategories,
  flatten,
} from "../utils/formatting.js";
import { isClose, upOrDown } from "../utils/closeness.js";
import { closenessSets } from "../utils/constants.js";
import { sharedObjects } from "../shared/sharedObjects.js";
import { updateSummaryVals } from "./resultTable.js";
import { notVals } from "../utils/filter.js";

function getTooltip(key, guessVal, guessUnit, targetUnit) {
  if (key == "price") {
    const val = Number(guessVal);
    const low = val <= 50 ? val - 5 : val - 10;
    const high = val < 50 ? val + 5 : val + 10;
    return `${[low, key, high].join(" ≤ ")}`;
  }
  if (key.startsWith("weapon") && !key.endsWith("_type")) {
    const typeKey = key + "_type";
    const targetType = targetUnit[typeKey];
    return `Weapon is of type ${targetType}`;
  }

  if (key === "categories") {
    return `Your categories are a subset of the correct ones`;
  }

  if (key in closenessSets()) {
    const set = closenessSets()[key];
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
      const summaryRow =
        table.querySelector("tr").children[[...row.children].length];

      //Set text
      if (key === "categories") {
        td.textContent = abbreviateCategories(guessVal);
      } else {
        td.textContent = Array.isArray(guessVal)
          ? guessVal.join(", ")
          : guessVal;
      }

      //Determine match
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

      // Handle exact match
      if (isExactMatch) {
        td.classList.add("match");
        summaryRow.classList.add("match");
        summaryRow.textContent = td.textContent;

        // Handle close
      } else if (
        isClose(key, guessVal, targetVal, flatUnit, sharedObjects.flatTarget)
      ) {
        td.classList.add("close", "tooltip");
        td.setAttribute(
          "data-tooltip",
          getTooltip(key, guessVal, flatUnit, sharedObjects.flatTarget)
        );

        if (!summaryRow.classList.contains("match")) {
          summaryRow.classList.add("close");
          updateSummaryVals(summaryRow, key, flatUnit, true);
        }
        // Handle not close (give hint)
      } else {
        if (key in notVals) {
          notVals[key].push(guessVal);
        }
        td.textContent = upOrDown(key, guessVal, targetVal) + td.textContent;
        updateSummaryVals(summaryRow, key, flatUnit, false);
      }
      row.appendChild(td);

      sharedObjects.input.value = "";
      sharedObjects.selectedUnit = null;
      sharedObjects.highlightedIndex = -1;
      sharedObjects.list.innerHTML = "";
    }

    const header = table.querySelector("tr");
    table.insertBefore(row, header.nextSibling.nextSibling);

    const allMatch = [...row.children].every((td) =>
      td.classList.contains("match")
    );

    if (allMatch) {
      const infoBox = document.getElementById("infoBox");
      infoBox.className = "success-box";
      infoBox.textContent = `Correct! The unit is ${sharedObjects.targetUnit.name}`;

      //Christmas logic
      const saved = localStorage.getItem("wgrdle_selected_date");
      const date = saved ? new Date(saved) : new Date();
      if (date.getMonth() == 11 && date.getDate() == 24) {
        infoBox.textContent = `Correct! The unit is ${sharedObjects.targetUnit.name}. Merry Christmas :)`;
      }

      infoBox.style.display = "block";
      return;
    }

    if (sharedObjects.guesses === 5) {
      sharedObjects.guesses -= 4;
      sharedObjects.gotHint = true;
      const infoBox = document.getElementById("infoBox");
      infoBox.className = "success-box";
      infoBox.textContent = `Every five guesses you can reveal one category by clicking it in the top row.`;
      infoBox.style.display = "block";
    } else {
      sharedObjects.guesses++;
    }
  });
}

document.getElementById("newUnitBtn").addEventListener("click", () => {
  location.reload();
});

export function initializeGiveUpBtn() {
  document.getElementById("giveUpBtn").addEventListener("click", () => {
    const infoBox = document.getElementById("infoBox");
    infoBox.className = "reveal-box";
    infoBox.textContent = `The unit was: ${sharedObjects.targetUnit.name}`;
    infoBox.style.display = "block";

    const toprow = document
      .getElementById("resultsTable")
      .querySelector("tr").children;
    sharedObjects.displayKeys.forEach((key, index) => {
      const td = toprow[index];
      const val = sharedObjects.flatTarget[key];
      td.textContent = Array.isArray(val) ? abbreviateCategories(val) : val;
      if (!td.classList.contains("match") && !td.classList.contains("close")) {
        td.classList.add("fail");
      }
    });
  });
}

const toggle = document.getElementById("dailyToggle");
toggle.addEventListener("change", () => {
  localStorage.setItem("wgrdle_toggle_state", toggle.checked ? "on" : "off");

  if (!toggle.checked) {
    localStorage.removeItem("wgrdle_selected_date");
  }
  location.reload();
});

export function initializeShareBtn() {
  const btn = document.getElementById("shareBtn");
  btn.addEventListener("click", () => {
    const table = document.getElementById("resultsTable");
    const today = new Date(document.getElementById("datePicker").value);
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = today.toLocaleDateString(undefined, options);
    const headerLine = `WARGAMle ${formattedDate}`;
    const emojiHeader = "🌍 🗂️ 📅 💰 🏃 💪 ⛽ 📏 🔭 🕵️ 🔫 🧨 🎯 🧩";
    let tableString = headerLine + "\n" + emojiHeader + "\n";

    for (let i = 2; i < table.rows.length; i++) {
      const row = table.rows[i];
      let rowString = "";
      for (let j = 1; j < row.cells.length; j++) {
        const cell = row.cells[j];
        if (cell.classList.contains("match")) {
          rowString += "🟩 ";
        } else if (cell.classList.contains("close")) {
          rowString += "🟨 ";
        } else {
          rowString += "⬜ ";
        }
      }
      const label = row.cells[0].textContent.trim();
      rowString += " ||" + label + "||";
      tableString += rowString + "\n";
    }

    navigator.clipboard
      .writeText(tableString)
      .then(() => {
        console.log(`Copied to clipboard!\n${tableString}`);
      })
      .catch((err) => {
        console.error(`Clipboard write failed:\n${tableString}`, err);
      });

    btn.textContent = "Copied to clipboard";
  });
}
