import { sharedObjects } from "../shared/sharedObjects.js";
import { skipKeys } from "../utils/constants.js";

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
