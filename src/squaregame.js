import { sharedObjects } from "./shared/squareSharedObjects.js";
import {
    initializeGiveUpBtn,
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

document.addEventListener("DOMContentLoaded", () => {
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
            initializeGiveUpBtn();
            initializeSearchBox();
            initializeSearch();
            initializeShareBtn();
        })
        .then(() => {
            fetch("data/categories.json")
                .then((res) => res.json())
                .then((data) => {
                    sharedObjects.cats = getCats(data);
                    console.log(sharedObjects.cats);
                });
        });
});
