import { getDateSeed, randInt } from "./randomgen.js";
import { sharedObjects } from "../shared/squareSharedObjects.js";
import { parseGuess } from "./formatting.js";

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

/* -------------------- Category -------------------- */

class Category {
    constructor(json, rng) {
        this.name = json.name;
        this.type = json.type;
        this.stat = json.stat;

        const vals = json.vals;
        const op = json.ops[rng(json.ops.length)];
        this.op = op;

        if (op === "interval") {
            const i = rng(vals.length - 1);
            const j = rng(vals.length - i - 1) + i + 1;

            this.lower = vals[i];
            this.upper = vals[j];

            this.inCat = (u) => {
                const v = parseGuess(u[this.stat]);
                return this.lower <= v && v <= this.upper;
            };

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
                this.compval = vals[rng(vals.length - 1) + 1];
                this.inCat = (u) => parseGuess(u[this.stat]) < this.compval;
                this.toString = () => `${this.stat} < ${this.compval}`;
            } else {
                this.op = "gt";
                this.compval = vals[rng(vals.length - 1)];
                this.inCat = (u) => parseGuess(u[this.stat]) > this.compval;
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

const MIN_UNITS = 5;
const COL_MIN = 3;
const COL_MAX = 12;

/* -------------------- Generator -------------------- */

export function getCats(cats) {
    const dailyMode = document.getElementById("dailyToggle").checked;

    const baseSeed = getDateSeed(date);
    const rng = createRNG(baseSeed, dailyMode);

    const MAX_RESTARTS = 50;
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

                if (slot >= 3) {
                    let ok = true;
                    for (let i = 0; i < 3; i++) {
                        const ov = cat.overlap(picks[i]);
                        if (ov < COL_MIN || ov > COL_MAX) {
                            ok = false;
                            break;
                        }
                    }
                    if (!ok) continue;
                }

                picks.push(cat);
                usedNames.add(cat.name);
                placed = true;
                break;
            }

            if (!placed) break;
        }

        if (picks.length === 6) {
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
                sharedObjects.correctUnits[i] = sharedObjects.units
                    .filter(
                        (u) =>
                            picks[row + 3].units.includes(u) &&
                            picks[col].units.includes(u)
                    )
                    .map((u) => u.name);
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
