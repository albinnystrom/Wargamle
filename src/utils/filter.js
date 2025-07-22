import { notCoals, guessedCountries } from "../components/resultTable.js";
import { coalitionToCountry, summaryVals, closenessSets } from "./constants.js";
import { abbreviateCategories } from "./formatting.js";

export const notVals = {
  tab: [],
  weapon1: [],
  weapon1_type: [],
  weapon2: [],
  weapon2_type: [],
  weapon3: [],
  weapon3_type: [],
};

function isSubset(arrA, arrB, areEqual) {
  const setA = new Set(arrA);
  const setB = new Set(arrB);

  if (setA.size !== setB.size && areEqual) return false;

  for (let item of setA) {
    if (!setB.has(item)) return false;
  }

  return true;
}

function keyFilter(key, units) {
  const td = Array.from(
    document.getElementById("resultsTable").querySelector("tr").children
  ).filter((c) => c.dataset.key == key)[0];

  if (key == "country") {
    if (td.classList.contains("match")) {
      return units.filter((u) => u.country == td.textContent);
    }

    if (td.classList.contains("close")) {
      const coals = td.textContent.replace("In ", "").split(" or ");
      const possibleCountries = coals.reduce((acc, item) => {
        coalitionToCountry[item].forEach((c) => acc.push(c));
        return acc;
      }, []);
      return units.filter(
        (u) =>
          possibleCountries.includes(u.country) &&
          !guessedCountries.includes(u.country)
      );
    }

    // else
    const notCoalsCountries = notCoals.reduce((acc, item) => {
      coalitionToCountry[item].forEach((c) => acc.push(c));
      return acc;
    }, []);
    return units.filter(
      (u) =>
        !notCoalsCountries.includes(u.country) &&
        !guessedCountries.includes(u.country)
    );
  }

  if (key == "tab") {
    if (td.classList.contains("match")) {
      return units.filter((u) => u.tab == td.textContent);
    }
    console.log(notVals[key]);
    return units.filter((u) => !notVals[key].includes(u[key]));
  }

  if (key == "categories") {
    if (td.classList.contains("match")) {
      return units.filter((u) =>
        isSubset(
          td.textContent.split(", "),
          abbreviateCategories(u.categories).split(", "),
          true
        )
      );
    }
    if (td.classList.contains("close")) {
      return units.filter((u) =>
        isSubset(
          td.textContent.split(", "),
          abbreviateCategories(u.categories).split(", "),
          false
        )
      );
    }
    return units;
  }
  if (key.includes("weapon")) {
    if (td.classList.contains("match")) {
      return units.filter((u) => u[key] == td.textContent);
    }
    if (td.classList.contains("close")) {
      return units.filter((u) => u[key + "_type"] == td.textContent);
    }
    return units;
  }

  if (key in closenessSets) {
    console.log("closness");
    if (td.classList.contains("match")) {
      return units.filter((u) => u[key] == td.textContent);
    }
    const set = closenessSets[key];
    const lwr =
      summaryVals[key][0] != "?" ? set.indexOf(summaryVals[key][0]) : -1;
    const upr =
      summaryVals[key][1] != "?" ? set.indexOf(summaryVals[key][1]) : 1000;
    console.log(`lwr=${lwr}, upr=${upr}`);
    return units.filter(
      (u) => set.indexOf(u[key]) >= lwr && set.indexOf(u[key]) <= upr
    );
  }

  if (key == "year" || key == "speed") {
    if (td.classList.contains("match")) {
      return units.filter((u) => u[key] == td.textContent);
    }
    const lwr = summaryVals[key][0] != "?" ? Number(summaryVals[key][0]) : -1;
    const upr =
      summaryVals[key][1] != "?" ? Number(summaryVals[key][1]) : 10000;
    return units.filter((u) => Number(u[key]) >= lwr && Number(u[key]) <= upr);
  }
  return units;
}

export function filterUnits(units) {
  const keys = [];
  document.querySelectorAll("th").forEach((th) => {
    if (th.classList.contains("pressed")) {
      keys.push(th.textContent);
    }
  });
  for (const key of keys) {
    units = keyFilter(key, units);
  }
  return units;
}
