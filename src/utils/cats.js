import { getDateSeed, randInt } from "./randomgen.js";
import { sharedObjects } from "../shared/squareSharedObjects.js";
import { parseGuess } from "./formatting.js";

const saved = localStorage.getItem("wgrdle_selected_date");
const date = saved ? new Date(saved) : new Date();

let dailyMode = false;

/* -------------------- RNG helper -------------------- */

function createRNG(baseSeed) {
    let seed = baseSeed;

    return (max) => {
        let val;
        if (dailyMode) {
            val = randInt(seed, max);
            seed += 1e5;
        } else {
            val = Math.floor(Math.random() * max);
        }
        return val;
    };
}

/* -------------------- Category -------------------- */

class Category {
    constructor(json, baseSeed) {
        const nextIdx = createRNG(baseSeed);

        this.name = json.name;
        this.type = json.type;
        this.stat = json.stat;
        const vals = json.vals;

        this.op = json.ops[nextIdx(json.ops.length)];

        /* ---------- interval ---------- */
        if (this.op === "interval") {
            this.lower = vals[nextIdx(vals.length - 1)];
            this.upper = vals[nextIdx(vals.length)];

            let guard = 0;
            while (this.upper < this.lower && guard++ < 50) {
                this.upper = vals[nextIdx(vals.length)];
            }

            this.inCat = (u) => {
                const guessVal = parseGuess(u[this.stat]);
                return this.lower <= guessVal && guessVal <= this.upper;
            };

            this.toString = () =>
                `${this.lower} <= ${this.stat} <= ${this.upper}`;
        } else if (this.op === "union") {
            /* ---------- union ---------- */
            this.first = vals[nextIdx(vals.length)];
            this.second = vals[nextIdx(vals.length)];

            let guard = 0;
            while (this.first === this.second && guard++ < 50) {
                this.second = vals[nextIdx(vals.length)];
            }

            this.inCat = (u) => {
                const guessVal = parseGuess(u[this.stat]);
                return guessVal === this.first || guessVal === this.second;
            };

            this.toString = () =>
                `${this.stat}: ${this.first} or ${this.second}`;
        } else if (this.op === "gtlt") {
            /* ---------- greater / less ---------- */
            if (nextIdx(2)) {
                this.op = "lt";
                this.compval = vals[nextIdx(vals.length - 1) + 1];
                this.inCat = (u) => parseGuess(u[this.stat]) < this.compval;
                this.toString = () => `${this.stat} < ${this.compval}`;
            } else {
                this.op = "gt";
                this.compval = vals[nextIdx(vals.length - 1)];
                this.inCat = (u) => parseGuess(u[this.stat]) > this.compval;
                this.toString = () => `${this.stat} > ${this.compval}`;
            }
        } else if (this.op === "single") {
            /* ---------- single ---------- */
            this.val = vals[nextIdx(vals.length)];
            this.inCat = (u) => parseGuess(u[this.stat]) === this.val;
            this.toString = () => `${this.stat} == ${this.val}`;
        }
    }

    isIn(unit) {
        return this.inCat(unit);
    }
}

/* -------------------- Generator -------------------- */

export function getCats(cats) {
    return genCats(cats);
}

function genCats(cats) {
    dailyMode = document.getElementById("dailyToggle").checked;

    const catPicks = [];
    let offset = 1e5;
    let attempts = 0;

    while (catPicks.length < 6) {
        attempts++;

        if (attempts > 1000) {
            catPicks.length = 0;
            attempts = 0;
        }

        const baseSeed = getDateSeed(date) + offset;
        const cat = new Category(
            cats[randInt(baseSeed, cats.length)],
            baseSeed
        );

        offset += 1e5;

        /* unique name */
        if (catPicks.some((c) => c.name === cat.name)) continue;

        /* at least 5 units */
        const catUnits = sharedObjects.units.filter((u) => cat.isIn(u));
        if (catUnits.length < 5) continue;

        /* column overlap rules */
        if (catPicks.length >= 3) {
            const cols = catPicks.slice(0, 3);
            const ok = cols.every((c) => {
                const overlap = sharedObjects.units.filter(
                    (u) => c.isIn(u) && catUnits.includes(u)
                ).length;
                return overlap >= 5 && overlap <= 30;
            });
            if (!ok) continue;
        }

        catPicks.push(cat);
    }

    /* debug output */
    for (let i = 0; i < 3; i++) {
        for (let j = 3; j < 6; j++) {
            console.log(
                `${catPicks[i].toString()} AND ${catPicks[j].toString()}`
            );
            console.log(
                sharedObjects.units
                    .filter((u) => catPicks[i].isIn(u) && catPicks[j].isIn(u))
                    .map((u) => u.name)
            );
        }
    }

    return catPicks;
}
