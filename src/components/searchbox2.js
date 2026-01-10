import { normalizeString } from "../utils/formatting.js";
import { sharedObjects } from "../shared/squareSharedObjects.js";
import { filterUnits } from "../utils/filter.js";
import { guessmap } from "../utils/constants.js";

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

function updateDrowndown(units, input, autoCompL) {
    autoCompL.innerHTML = "";
    sharedObjects.highlightedIndex = -1;
    currentSuggestions = units;
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
            const newdiv = document.createElement("div");
            newdiv.textContent = match.name;
            newdiv.style.textAlign = "center";
            const idx = Number(input.dataset.idx);
            if (
                sharedObjects.correctUnits[idx].find(
                    (u) => u.name === match.name && u.country === match.country
                )
            ) {
                newdiv.classList.add("match");
                sharedObjects.guessedUnits.push(match.name, match.country);
            } else {
                newdiv.classList.add("fail");
                sharedObjects.wrongGuesses[index].push(match);
            }
            input.replaceWith(newdiv);
            input.value = match.name;
            autoCompL.innerHTML = "";
            autoCompL.classList.add("hidden");
            sharedObjects.selectedUnit = match;
            sharedObjects.guesses++;
            sharedObjects.guessCounter.textContent = `${sharedObjects.guesses}/9`;
            if (sharedObjects.guesses >= 9) {
                endGame();
            }
        });
        autoCompL.appendChild(div);
    });
}

export function endGame() {
    const square = document.getElementById("gameSquare");

    for (const key in guessmap) {
        const oldDiv = square.children[guessmap[key]];
        let higihLightname = "";
        if (oldDiv.children[0].classList.contains("match")) {
            higihLightname = oldDiv.textContent;
        }
        const lst = document.createElement("div");
        lst.classList.add("squareList");
        lst.classList.add("neutral");

        sharedObjects.wrongGuesses[key].forEach((g) =>
            sharedObjects.correctUnits[key].push(g)
        );
        sharedObjects.correctUnits[key].forEach((match) => {
            const div = document.createElement("li");
            const country = sharedObjects.units.find(
                (u) => u.name === match.name && u.country === match.country
            ).country;
            const flagImg = document.createElement("img");
            const countryFile = country.toLowerCase().replace(/\s+/g, "_");
            flagImg.src = `images/flags/${countryFile}.webp`;
            flagImg.classList.add("flagIcon");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = match.name;
            nameSpan.style.whiteSpace = "pre-line";

            div.appendChild(flagImg);
            div.appendChild(nameSpan);

            if (match.name === higihLightname) {
                div.classList.add("match");
            } else if (sharedObjects.wrongGuesses[key].includes(match)) {
                div.classList.add("fail");

                const row = Math.floor(key / 3);
                const col = key % 3;

                const rowcat = sharedObjects.cats[row + 3];
                const colcat = sharedObjects.cats[col];

                const inrow = rowcat.units.find(
                    (u) => u.name === match.name && u.country === match.country
                );
                const incol = colcat.units.find(
                    (u) => u.name === match.name && u.country === match.country
                );

                if (!inrow && !incol) {
                    nameSpan.textContent = `\n${match.name}\n 
                    ${colcat.stat} = \n${match[colcat.stat]}\n
                    ${rowcat.stat} = \n${match[rowcat.stat]}\n`;
                } else if (!incol) {
                    nameSpan.textContent = `\n${match.name}\n, 
                    ${colcat.stat} = \n${match[colcat.stat]},`;
                } else if (!inrow) {
                    nameSpan.textContent = `\n${match.name}\n, 
                    ${rowcat.stat} = \n${match[rowcat.stat]},`;
                }
            }
            div.classList.add("autocomplete-item");
            lst.appendChild(div);
        });
        oldDiv.replaceWith(lst);
    }
}

export function initializeSearchBox(input) {
    const autoCompL =
        input.parentElement.querySelectorAll("#autocompleteList")[0];
    input.addEventListener("keydown", (e) => {
        autoCompL.classList.remove("hidden");
        const items = autoCompL.querySelectorAll(".autocomplete-item");

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
                (sharedObjects.highlightedIndex - 1 + items.length) %
                items.length;
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
                const match =
                    currentSuggestions[sharedObjects.highlightedIndex];
                const newdiv = document.createElement("div");
                newdiv.textContent = match.name;
                newdiv.style.textAlign = "center";
                const idx = Number(input.dataset.idx);
                if (
                    sharedObjects.correctUnits[idx].find(
                        (u) =>
                            u.name === match.name && u.country === match.country
                    )
                ) {
                    newdiv.classList.add("match");
                    sharedObjects.guessedUnits.push(match.name, match.country);
                } else {
                    newdiv.classList.add("fail");
                    sharedObjects.wrongGuesses[index].push(match);
                }
                input.replaceWith(newdiv);
                input.value = match.name;
                sharedObjects.selectedUnit = match; // ✅ ensure correct unit is stored
                autoCompL.innerHTML = "";
                sharedObjects.highlightedIndex = -1;
                autoCompL.classList.add("hidden");
                sharedObjects.guesses++;
                sharedObjects.guessCounter.textContent = `${sharedObjects.guesses}/9`;
                if (sharedObjects.guesses >= 9) {
                    endGame();
                }
            }
        }
    });

    input.addEventListener("click", () => {
        autoCompL.classList.add("hidden");
        updateDrowndown(filterUnits(sharedObjects.units), input, autoCompL);
    });

    input.addEventListener("input", () => {
        const query = input.value.toLowerCase().trim();
        autoCompL.innerHTML = "";
        sharedObjects.highlightedIndex = -1;

        const filteredUnits = filterUnits(sharedObjects.units);
        updateDrowndown(
            filteredUnits
                .map((u) => ({
                    unit: u,
                    score: getMatchScore(u.name, query),
                }))
                .filter((entry) => entry.score > 0)
                .sort((a, b) => b.score - a.score)
                .map((entry) => entry.unit),
            input,
            autoCompL
        );
    });
    document.addEventListener("click", (e) => {
        autoCompL.classList.remove("hidden");
        if (!input.contains(e.target)) {
            autoCompL.classList.add("hidden");
            autoCompL.innerHTML = "";
        }
    });
}
