import { getDateSeed, randInt } from "./randomgen.js";
import { sharedObjects } from "../shared/squareSharedObjects.js";
import { parseGuess } from "./formatting.js";

const saved = localStorage.getItem("wgrdle_selected_date");
const date = saved ? new Date(saved) : new Date();
var dailyMode = null;

class Category {
    constructor(json) {
        this.name = json.name;
        this.type = json.type;
        this.stat = json.stat;
        const vals = json.vals;
        this.op = json.ops[getIdx(json.ops.length)];

        if (this.op === "interval") {
            this.lower = vals[getIdx(vals.length - 1)];
            this.upper = vals[getIdx(vals.length)];
            var seedadd = 1;
            while (this.upper < this.lower) {
                this.upper = vals[getIdx(vals.length, getDateSeed() + seedadd)];
                seedadd++;
            }
            this.inCat = (u) => {
                const guessVal = parseGuess(u[this.stat]);
                return this.lower <= guessVal && guessVal <= this.upper;
            };
            this.toString = () =>
                `${this.lower} <= ${this.stat} <= ${this.upper}`;
        } else if (this.op === "union") {
            this.first = vals[getIdx(vals.length)];
            this.second = vals[getIdx(vals.length)];
            var offset = 1;
            while (this.first === this.second) {
                offset++;
                this.second =
                    vals[getIdx(vals.length, getDateSeed(date) + offset)];
            }
            this.inCat = (u) => {
                const guessVal = parseGuess(u[this.stat]);
                return this.first === guessVal || this.second === guessVal;
            };
            this.toString = () =>
                `${this.stat}: ${this.first} or ${this.second}`;
        } else if (this.op === "gtlt") {
            if (getIdx(2)) {
                this.op = "lt";
                this.compval = vals[getIdx(vals.length - 1) + 1];
                this.inCat = (u) => {
                    const guessVal = parseGuess(u[this.stat]);
                    return guessVal < this.compval;
                };
                this.toString = () => `${this.stat} < ${this.compval}`;
            } else {
                this.op = "gt";
                this.compval = vals[getIdx(vals.length - 1)];
                this.inCat = (u) => {
                    const guessVal = parseGuess(u[this.stat]);
                    return this.compval < guessVal;
                };
                this.toString = () => `${this.stat} > ${this.compval}`;
            }
        } else if (this.op === "single") {
            this.val = vals[getIdx(vals.length)];
            this.inCat = (u) => {
                const guessVal = parseGuess(u[this.stat]);
                return this.val === guessVal;
            };
            this.toString = () => `${this.stat} == ${this.val}`;
        }
    }

    isIn(unit) {
        return this.inCat(unit);
    }
}

export function getCats(cats) {
    return genCats(cats);
}

function getIdx(max, seed = getDateSeed(date)) {
    if (dailyMode) {
        return randInt(seed, max);
    } else {
        return Math.floor(Math.random() * max);
    }
}

function genCats(cats) {
    dailyMode = document.getElementById("dailyToggle").checked;
    console.log(dailyMode);
    var catPicks = [];
    var idx = null;

    var offset = 0;
    var attempts = 0;
    while (catPicks.length < 6) {
        attempts++;
        if (attempts > 1000) {
            attempts = 0;
            catPicks = [];
        }
        const cat = new Category(
            cats[getIdx(cats.length, getDateSeed(date) + offset)]
        );
        //check unique type
        if (!catPicks.some((c) => c.name == cat.name)) {
            //check atleast 5 units for cat
            console.log(cat);
            const catUnits = sharedObjects.units.filter((u) => cat.isIn(u));
            if (catUnits.length >= 5) {
                //check if col, then more conditions
                if (catPicks.length >= 3) {
                    const cols = catPicks.slice(0, 3);
                    if (
                        cols.every((c) => {
                            const cUnits = sharedObjects.units.filter((u) =>
                                c.isIn(u)
                            );
                            return (
                                cUnits.filter((u) => catUnits.includes(u))
                                    .length >= 5
                            );
                        })
                    ) {
                        catPicks.push(cat);
                    } else {
                        console.log("too small!");
                    }
                } else {
                    catPicks.push(cat);
                }
            }
        }
        offset++;
    }
    return catPicks;
}
