import { sharedObjects } from "../shared/squareSharedObjects.js";
import { initializeSearchBox } from "./searchbox2.js";
import { guessmap } from "../utils/constants.js";

export function populateGrid() {
    const square = document.getElementById("gameSquare");
    sharedObjects.gamesquare = square;
    const catmap = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 8, 5: 12 };
    sharedObjects.guessCounter = square.children[0];
    square.children[0].textContent = `${sharedObjects.guesses}/9`;
    for (var key in catmap) {
        const cat = square.children[catmap[key]];
        cat.textContent = sharedObjects.cats[key].toString();
        cat.classList.add("category");
    }
    for (var key in guessmap) {
        const container = document.createElement("div");
        container.style.position = "relative";
        container.classList.add("neutral");

        const input = document.createElement("input");
        input.type = "text";
        input.id = `unitInput${key}`;
        input.placeholder = "Enter unit name...";
        input.autocomplete = "off";
        input.style.width = "120px";
        input.dataset.idx = key;

        const autocompleteList = document.createElement("div");
        autocompleteList.id = "autocompleteList";
        autocompleteList.classList.add("hidden");

        container.appendChild(input);
        container.appendChild(autocompleteList);

        initializeSearchBox(input);

        square.children[guessmap[key]].replaceWith(container);
    }
}
