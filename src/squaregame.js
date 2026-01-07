import { sharedObjects } from "./shared/squareSharedObjects.js";
import {
    squaregameInitializeGiveUpBtn,
    initializeSearch,
    initializeShareBtn,
} from "./components/buttons.js";
import { flatten } from "./utils/formatting.js";
import { initializeSearchBox } from "./components/searchbox.js";
import { pickTarget } from "./utils/randomgen.js";
import { initializeDatePicker } from "./components/datePicker.js";
import { initializeTable } from "./components/resultTable.js";
import { isNavalDate } from "./utils/constants.js";
import { getCats } from "./utils/cats.js";
import { populateGrid } from "./components/grid.js";

document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById("popup");
    if (!localStorage.getItem("popupclosed")) {
        popup.classList.add("active");
    }
    const closePopup = document.getElementById("closePopup");

    closePopup.onclick = () => {
        popup.classList.remove("active");
        localStorage.setItem("popupclosed", true);
    };

    const toggle = document.getElementById("dailyToggle");
    const savedState = localStorage.getItem("wgrdle_toggle_state");
    toggle.checked = savedState !== "off";

    const saved = localStorage.getItem("wgrdle_selected_date");
    const date = saved ? new Date(saved) : new Date();

    fetch("data/units.json")
        .then((res) => res.json())
        .then((data) => {
            sharedObjects.units = data.filter((u) => u && u.name);

            initializeDatePicker();
            squaregameInitializeGiveUpBtn();
            initializeShareBtn();
        })
        .then(() => {
            fetch("data/categories.json")
                .then((res) => res.json())
                .then((data) => {
                    sharedObjects.cats = getCats(data);
                })
                .then(() => {
                    populateGrid();
                });
        });
});
