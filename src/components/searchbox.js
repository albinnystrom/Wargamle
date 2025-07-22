import { normalizeString } from "../utils/formatting.js";
import { sharedObjects } from "../shared/sharedObjects.js";
import { filterUnits } from "../utils/filter.js";

let currentSuggestions = [];

function updateHighlight(items) {
  sharedObjects.selectedUnit = items.forEach((item, i) => {
    item.style.backgroundColor =
      i === sharedObjects.highlightedIndex ? "#e0eaff" : "";
  });
}

function getMatchScore(unitName, query) {
  const name = normalizeString(unitName);
  const q = normalizeString(query);

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (name.includes(q)) return 80;
  const nameWords = name.split(/\s+/);
  const queryWords = q.split(/\s+/);
  if (queryWords.every((qw) => nameWords.some((nw) => nw.startsWith(qw))))
    return 70;

  return 0;
}

export function initializeSearchBox() {
  sharedObjects.input.addEventListener("keydown", (e) => {
    const items = sharedObjects.list.querySelectorAll(".autocomplete-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      sharedObjects.highlightedIndex =
        (sharedObjects.highlightedIndex + 1) % items.length;
      updateHighlight(
        items,
        sharedObjects.highlightedIndex,
        sharedObjects.selectedUnit
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      sharedObjects.highlightedIndex =
        (sharedObjects.highlightedIndex - 1 + items.length) % items.length;
      updateHighlight(
        items,
        sharedObjects.highlightedIndex,
        sharedObjects.selectedUnit
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (
        sharedObjects.highlightedIndex >= 0 &&
        currentSuggestions[sharedObjects.highlightedIndex]
      ) {
        const match = currentSuggestions[sharedObjects.highlightedIndex];
        sharedObjects.input.value = match.name;
        sharedObjects.selectedUnit = match; // ✅ ensure correct unit is stored
        sharedObjects.list.innerHTML = "";
        sharedObjects.highlightedIndex = -1;
      }
      document.getElementById("searchBtn").click();
    }
  });

  sharedObjects.input.addEventListener("input", () => {
    const query = sharedObjects.input.value.toLowerCase().trim();
    sharedObjects.list.innerHTML = "";
    sharedObjects.highlightedIndex = -1;

    if (query.length === 0) {
      currentSuggestions = [];
      return;
    }
    const filteredUnits = filterUnits(sharedObjects.units);
    currentSuggestions = filteredUnits
      .map((u) => ({
        unit: u,
        score: getMatchScore(u.name, query),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.unit);

    currentSuggestions.forEach((match, index) => {
      const div = document.createElement("autocomplete-item");

      const flagImg = document.createElement("img");
      const countryFile = match.country.toLowerCase().replace(/\s+/g, "_");
      flagImg.src = `images/flags/${countryFile}.webp`;
      flagImg.classList.add("flagIcon");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = match.name;

      div.appendChild(flagImg);
      div.appendChild(nameSpan);

      div.dataset.index = index;
      div.classList.add("autocomplete-item");
      div.addEventListener("mousedown", () => {
        sharedObjects.input.value = match.name;
        sharedObjects.list.innerHTML = "";
        sharedObjects.selectedUnit = match; // ✅ store exact match
      });
      sharedObjects.list.appendChild(div);
    });
  });
  document.addEventListener("click", (e) => {
    if (!sharedObjects.input.contains(e.target))
      sharedObjects.list.innerHTML = "";
  });
}
