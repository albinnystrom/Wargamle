export function normalize(value, key) {
    if (value === "N/A") {
        return ["optics", "size"].includes(key) ? "0" : null;
    }
    return value;
}

export function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize("NFD") // decompose accents
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/-/g, " ") // treat dashes as spaces
        .trim();
}

export function flatten(unit) {
    return {
        ...unit,
        ...{
            weapon1: unit.weapon1,
            weapon2: unit.weapon2,
            weapon3: unit.weapon3,
        },
    };
}

export function abbreviateCategories(catArray) {
    const map = {
        Mechanized: "MEC",
        Motorized: "MOT",
        Marine: "MAR",
        Airborne: "AIR",
        Armored: "ARM",
        Support: "SUP",
    };
    return (catArray || []).map((c) => map[c] || c).join(", ");
}

export function parseGuess(guessVal) {
    return !isNaN(Number(guessVal)) ? Number(guessVal) : guessVal;
}
