import { sharedObjects } from "./shared/sharedObjects.js";
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

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("dailyToggle");
  const savedState = localStorage.getItem("wgrdle_toggle_state");
  toggle.checked = savedState !== "off";

  fetch("data/units.json")
    .then((res) => res.json())
    .then((data) => {
      sharedObjects.units = data.filter((u) => u && u.name);
      sharedObjects.targetUnit = pickTarget(sharedObjects.units);
      sharedObjects.flatTarget = flatten(sharedObjects.targetUnit);

      initializeTable();
      initializeDatePicker();
      initializeGiveUpBtn();
      initializeSearchBox();
      initializeSearch();
      initializeShareBtn();
    });
});
