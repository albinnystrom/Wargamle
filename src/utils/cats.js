import { getDateSeed, randInt } from "./randomgen.js";
import { sharedObjects } from "../shared/squareSharedObjects.js";
import { parseGuess } from "./formatting.js";
import { compareVals } from "./closeness.js";
import { closenessSets } from "./constants.js";
compareVals;

/* -------------------- Date / Mode -------------------- */

const saved = localStorage.getItem("wgrdle_selected_date");
const date = saved ? new Date(saved) : new Date();

/* -------------------- RNG -------------------- */

function createRNG(baseSeed, dailyMode) {
    let seed = baseSeed;

    return (max) => {
        if (!dailyMode) {
            return Math.floor(Math.random() * max);
        }
        const val = randInt(seed, max);
        seed += 1e5;
        return val;
    };
}

function jaccard(aSet, bSet) {
    let intersection = 0;
    for (const v of aSet) {
        if (bSet.has(v)) intersection++;
    }
    return intersection / (aSet.size + bSet.size - intersection);
}

/* -------------------- Category -------------------- */

class Category {
    constructor(json, rng) {
        this.name = json.name;
        this.type = json.type;
        this.stat = json.stat;
        this.scale = json.scale;

        const vals = json.vals;
        const op = json.ops[rng(json.ops.length)];
        this.op = op;

        if (this.op == "tf") {
            const tru = rng(2);
            const negation = tru ? "" : "not";
            if (tru) {
                this.inCat = (u) => {
                    return u[this.stat] === "TRUE";
                };
            } else {
                this.inCat = (u) => {
                    return u[this.stat] != "TRUE";
                };
            }
            this.toString = () => `Unit is ${negation} ${this.stat}`;
        }

        if (op === "interval") {
            do {
                const i = rng(vals.length - 1);
                const j = rng(vals.length - i - 1) + i + 1;

                this.lower = vals[i];
                this.upper = vals[j];
            } while (this.upper - this.lower < json.interval_size);

            if (this.scale === "ratio") {
                this.inCat = (u) => {
                    const v = parseGuess(u[this.stat]);
                    return this.lower <= v && v <= this.upper;
                };
            } else if (this.scale === "ordinal") {
                this.inCat = (u) => {
                    const v = closenessSets()[this.stat].indexOf(u[this.stat]);
                    const lwr = closenessSets()[this.stat].indexOf(this.lower);
                    const upr = closenessSets()[this.stat].indexOf(this.upper);
                    return lwr <= v && v <= upr;
                };
            } else {
                throw new Error(
                    `Category op: ${this.op} doesn't support scale ${this.scale})`
                );
            }

            this.toString = () =>
                `${this.lower} <= ${this.stat} <= ${this.upper}`;
        } else if (op === "union") {
            const i = rng(vals.length);
            let j = rng(vals.length - 1);
            if (j >= i) j++;

            this.first = vals[i];
            this.second = vals[j];

            this.inCat = (u) => {
                const v = parseGuess(u[this.stat]);
                return v === this.first || v === this.second;
            };

            this.toString = () =>
                `${this.stat}: ${this.first} or ${this.second}`;
        } else if (op === "gtlt") {
            if (rng(2)) {
                this.op = "lt";
                do {
                    this.compval = vals[rng(vals.length - 1) + 1];
                } while (this.compval - vals[0] < json.interval_size);
                if (this.scale === "ratio") {
                    this.inCat = (u) => parseGuess(u[this.stat]) < this.compval;
                } else if (this.scale === "ordinal") {
                    this.inCat = (u) => {
                        const stt = closenessSets()[this.stat].indexOf(
                            u[this.stat]
                        );
                        const cmp = closenessSets()[this.stat].indexOf(
                            this.compval
                        );
                        return stt < cmp;
                    };
                } else {
                    throw new Error(
                        `Category op: ${this.op} doesn't support scale ${this.scale})`
                    );
                }
                this.toString = () => `${this.stat} < ${this.compval}`;
            } else {
                this.op = "gt";
                do {
                    this.compval = vals[rng(vals.length - 1)];
                } while (
                    vals[vals.length - 1] - this.compval <
                    json.interval_size
                );
                if (this.scale === "ratio") {
                    this.inCat = (u) => parseGuess(u[this.stat]) > this.compval;
                } else if (this.scale === "ordinal") {
                    this.inCat = (u) => {
                        const stt = closenessSets()[this.stat].indexOf(
                            u[this.stat]
                        );
                        const cmp = closenessSets()[this.stat].indexOf(
                            this.compval
                        );
                        return stt > cmp;
                    };
                } else {
                    throw new Error(
                        `Category op: ${this.op} doesn't support scale ${this.scale})`
                    );
                }
                this.toString = () => `${this.stat} > ${this.compval}`;
            }
        } else if (op === "single") {
            this.val = vals[rng(vals.length)];
            this.inCat = (u) => parseGuess(u[this.stat]) === this.val;
            this.toString = () => `${this.stat} = ${this.val}`;
        }

        /* ---- Precompute units ---- */
        this.units = [];
        for (const u of sharedObjects.units) {
            if (this.inCat(u)) this.units.push(u);
        }
        this.unitSet = new Set(this.units);
    }

    overlap(other) {
        let count = 0;
        const small = this.units.length < other.units.length ? this : other;
        const bigSet = small === this ? other.unitSet : this.unitSet;

        for (const u of small.units) {
            if (bigSet.has(u)) count++;
        }
        return count;
    }
}

/* -------------------- Constraints -------------------- */

const MIN_UNITS = 1;
const COL_MIN = 4;
const COL_MAX = 15;
const MAX_ROW_SIMILARITY = 0.8;
const MAX_COL_SIMILARITY = 0.8;

/* -------------------- Generator -------------------- */

function overlapWindow(cat) {
    const n = cat.units.length;
    if (n <= 15) {
        return { min: 2, max: 15 };
    }
    return { min: 2, max: 12 };
}

function cellIsRestrictive(rowCat, colCat) {
    const intersection = rowCat.overlap(colCat);
    return (
        intersection > 0 &&
        intersection < rowCat.units.length &&
        intersection < colCat.units.length
    );
}

function isSolvable(picks) {
    // Build candidate lists for each cell
    const cells = [];

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const rowCat = picks[r + 3];
            const colCat = picks[c];

            const candidates = rowCat.units.filter((u) =>
                colCat.unitSet.has(u)
            );

            if (candidates.length === 0) return false;
            cells.push(candidates);
        }
    }

    // Order cells by fewest candidates (massive speedup)
    cells.sort((a, b) => a.length - b.length);

    // Backtracking search
    const used = new Set();

    function dfs(i) {
        if (i === cells.length) return true;

        for (const u of cells[i]) {
            if (used.has(u)) continue;
            used.add(u);
            if (dfs(i + 1)) return true;
            used.delete(u);
        }
        return false;
    }

    return dfs(0);
}

export function getCats(cats) {
    const dailyMode = document.getElementById("dailyToggle").checked;

    const baseSeed = getDateSeed(date);
    const rng = createRNG(baseSeed, dailyMode);

    const MAX_RESTARTS = 500;
    const MAX_TRIES_PER_SLOT = 500;

    for (let restart = 0; restart < MAX_RESTARTS; restart++) {
        const picks = [];
        const usedNames = new Set();

        for (let slot = 0; slot < 6; slot++) {
            let placed = false;

            for (let tries = 0; tries < MAX_TRIES_PER_SLOT; tries++) {
                const json = cats[rng(cats.length)];
                if (usedNames.has(json.name)) continue;

                const cat = new Category(json, rng);
                if (cat.units.length < MIN_UNITS) continue;

                //COLUMNS
                if (slot < 3) {
                    let ok = true;

                    for (const prev of picks) {
                        const sim = jaccard(cat.unitSet, prev.unitSet);
                        if (sim > MAX_COL_SIMILARITY) {
                            ok = false;
                            break;
                        }
                    }

                    if (!ok) continue;
                }

                //ROWS
                if (slot >= 3) {
                    let ok = true;

                    //possible units constraints
                    for (let i = 0; i < 3; i++) {
                        const { min, max } = overlapWindow(cat);
                        const ov = cat.overlap(picks[i]);

                        if (ov < min || ov > max) {
                            ok = false;
                            break;
                        }
                    }
                    if (!ok) continue;

                    //row diversity
                    const rowSets = picks.slice(0, 3).map((col) => {
                        const s = new Set();
                        for (const u of cat.units) {
                            if (col.unitSet.has(u)) s.add(u);
                        }
                        return s;
                    });

                    let diverse = true;
                    for (let i = 0; i < 3; i++) {
                        for (let j = i + 1; j < 3; j++) {
                            if (
                                jaccard(rowSets[i], rowSets[j]) >
                                MAX_ROW_SIMILARITY
                            ) {
                                diverse = false;
                                break;
                            }
                        }
                        if (!diverse) break;
                    }

                    if (!diverse) continue;
                }

                picks.push(cat);
                usedNames.add(cat.name);
                placed = true;
                break;
            }

            if (!placed) break;
        }

        if (picks.length === 6) {
            let valid = true;

            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const rowCat = picks[r + 3];
                    const colCat = picks[c];

                    if (!cellIsRestrictive(rowCat, colCat)) {
                        valid = false;
                        break;
                    }
                }
                if (!valid) break;
            }

            if (!valid) continue;

            if (!isSolvable(picks)) {
                console.log("Rejected unsolvable grid");
            }

            // Check for unnecessary ORs
            for (const p of picks) {
                if (p.op != "union") continue;

                const fst = sharedObjects.units.filter(
                    (u) => u[p.stat] === p.first
                );
                const snd = sharedObjects.units.filter(
                    (u) => u[p.stat] === p.second
                );

                if (fst.length === 0) {
                    p.toString = () => `${p.stat} = ${p.second}`;
                } else if (snd.length === 0) {
                    p.toString = () => `${p.stat} = ${p.first}`;
                }
            }

            // Populate correctUnits
            for (let i = 0; i < 9; i++) {
                const row = Math.floor(i / 3);
                const col = i % 3;
                sharedObjects.correctUnits[i] = sharedObjects.units.filter(
                    (u) =>
                        picks[row + 3].units.includes(u) &&
                        picks[col].units.includes(u)
                );
            }
            debugOutput(picks);
            return picks;
        }
    }

    throw new Error("Unable to generate valid categories");
}

/* -------------------- Debug -------------------- */

function debugOutput(catPicks) {
    for (let i = 0; i < 3; i++) {
        for (let j = 3; j < 6; j++) {
            console.log(
                `${catPicks[i].toString()} AND ${catPicks[j].toString()}`
            );
            console.log(
                catPicks[i].units
                    .filter((u) => catPicks[j].unitSet.has(u))
                    .map((u) => u.name)
            );
        }
    }
}
