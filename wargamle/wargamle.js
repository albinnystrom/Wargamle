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
import { isNavalDate } from "./utils/constants.js";

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("dailyToggle");
  const savedState = localStorage.getItem("wgrdle_toggle_state");
  toggle.checked = savedState !== "off";

  const saved = localStorage.getItem("wgrdle_selected_date");
  const date = saved ? new Date(saved) : new Date();
  sharedObjects.naval = isNavalDate();
  const jsonUrl = sharedObjects.naval
    ? "data/navalunits.json"
    : "data/units.json";

  fetch(jsonUrl)
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
