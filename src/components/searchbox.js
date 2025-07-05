import { normalizeString } from "../utils/formatting.js";
import { sharedObjects } from "../shared/sharedObjects.js";

let currentSuggestions = [];

function updateHighlight(items) {
  sharedObjects.selectedUnit = items.forEach((item, i) => {
    item.style.backgroundColor =
      i === sharedObjects.highlightedIndex ? "#e0eaff" : "";
  });
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

    const queryWords = normalizeString(query).split(/\s+/);
    currentSuggestions = sharedObjects.units
      .filter((u) => {
        const unitWords = normalizeString(u.name).split(/\s+/);
        return queryWords.every((q) => unitWords.some((w) => w.startsWith(q)));
      })
      .slice(0, 10);

    currentSuggestions.forEach((match, index) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.gap = "0.5rem";
      div.style.padding = "0.5rem";
      div.style.cursor = "pointer";

      const flagImg = document.createElement("img");
      const countryFile = match.country.toLowerCase().replace(/\s+/g, "_");
      flagImg.src = `images/flags/${countryFile}.webp`;
      flagImg.alt = match.country;
      flagImg.style.width = "20px";
      flagImg.style.height = "14px";
      flagImg.style.objectFit = "cover";
      flagImg.style.border = "1px solid #ccc";
      flagImg.style.borderRadius = "2px";

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
