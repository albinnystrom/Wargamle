import { sharedObjects } from "../shared/sharedObjects.js";
import { skipKeys } from "../utils/constants.js";

export function initializeTable() {
  const table = document.getElementById("resultsTable");

  // Set display keys dynamically
  for (const key in sharedObjects.flatTarget) {
    if (!skipKeys.has(key)) sharedObjects.displayKeys.push(key);
  }

  const headerRow = document.createElement("tr");
  for (const key of sharedObjects.displayKeys) {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);
}
