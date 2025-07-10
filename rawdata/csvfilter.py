import csv
import json
import re

output = []


def coalition(country):
    coalitions = {
        "United Kingdom": ["Commonwealth"],
        "Canada": ["Commonwealth", "Norad"],
        "ANZAC": ["Commonwealth"],
        "West Germany": ["Eurocorps", "LANDJUT", "Duth-German Corps"],
        "France": ["Eurocorps"],
        "Norway": ["Scandinavia"],
        "Denmark": ["Scandinavia", "LANDJUT"],
        "Sweden": ["Scandinavia"],
        "Japan": ["Blue Dragons"],
        "South Korea": ["Blue Dragons"],
        "United States": ["NORAD"],
        "The Netherlands": ["Duth-German Corps"],
        "Poland": ["Eastern Bloc", "Baltic Front"],
        "Czechoslavakia": ["Eastern Bloc", "Entente"],
        "East Germany": ["Eastern Bloc"],
        "China": ["Red Dragons"],
        "North Korea": ["Red Dragons"],
        "Finland": ["Baltic Front"],
        "Yugoslavia": ["Entente"],
        "Soviet Union": [],
        "Israel": [],
        "Italy": [],
        "South Africa": [],
    }
    return coalitions[country]


def optics(grnd, air):
    optics = {
        "900": "Exceptional",
        "450": "Exceptional",
        "300": "Very good",
        "220": "Exceptional",
        "170": "Very good",
        "150": "Good",
        "120": "Good",
        "80": "Medium",
        "60": "Poor",
        "40": "Bad",
        "": "N/A",
    }
    return optics[air] if air in ["900", "450", "300", "150"] else optics[grnd]


def stealth(value):
    stealths = {
        "3": "Exceptional",
        "2.5": "Very good",
        "2": "Good",
        "1.75": "Good",
        "1.6": "Good",
        "1.5": "Medium",
        "1.25": "Medium",
        "1": "Poor",
    }
    return stealths[value] if value in stealths else "Poor"


def size(value):
    sizes = {
        "-0.2": "Very small",
        "-0.15": "Very small",
        "-0.1": "Small",
        "-0.05": "Small",
        "": "Medium",
        "0.05": "Big",
        "0.1": "Very big",
    }
    return sizes[value]


def get_name(s_name, d_name):
    # Split the debug name and remove the "Unit_" prefix
    d_parts = d_name.replace("Unit_", "").split("_")

    # Create all substrings from d_parts that might correspond to words or hyphenated parts in s_name
    d_candidates = set()
    for i in range(len(d_parts)):
        for j in range(i + 1, len(d_parts) + 1):
            joined = "_".join(d_parts[i:j])
            d_candidates.add(joined)

    # Sort by longest first to prioritize multi-word matches
    d_candidates = sorted(d_candidates, key=len, reverse=True)

    # Map from uppercase version (normalized) to original for replacement
    d_map = {}
    for phrase in d_candidates:
        d_map[phrase.upper()] = phrase.replace("_", " ")

    # For each candidate, try to replace the matching all-uppercase or hyphenated part in s_name
    def replace_match(match):
        word = match.group(0)
        key = word.upper()
        return d_map.get(key, word)

    # Match words or hyphenated combinations in s_name
    pattern = "|".join(re.escape(k.replace("_", "-")) for k in d_map)
    pattern += "|" + "|".join(re.escape(k.replace("_", " ")) for k in d_map)
    regex = re.compile(pattern, flags=re.IGNORECASE)

    result = regex.sub(replace_match, s_name)
    return result


with open("rawdata/wgrd.csv") as f1:
    with open("rawdata/wgrd2.csv") as f2:
        csv2 = csv.DictReader(f2)
        csv1 = csv.DictReader(f1)
        d = [d2 | d1 for d1, d2 in zip(list(csv1), list(csv2))]
        output = []
        for row in d:
            if row["Tab"] == "SHP":
                continue
            s_name = row["Unit"]
            d_name = row["ClassNameForDebug"]
            name = get_name(s_name, d_name)
            data = {
                "name": name,
                "country": row["Country"],
                "coalition": coalition(row["Country"]),
                "tab": row["Tab"],
                "year": row["Year"],
                "price": row["Price           (1 - 500)"],
                "speed": row["Speed              (23 km - 1100km)"].split(" ")[0],
                "strength": row["Strength"],
                "autonomy": row["Autonomy"],
                "size": size(row["Size Modifier                  (-0.2 - 0.1)"]),
                "optics": optics(
                    row["Optics Ground         (40 - 220)"],
                    row["Optics Air         (10 - 900)"],
                ),
                "stealth": stealth(row["Stealth"]),
                "weapon1_type": row["Weapon1 Type"],
                "weapon1": row["Weapon1Name"],
                "weapon2_type": row["Weapon2 Type"],
                "weapon2": row["Weapon2Name"],
                "weapon3_type": row["Weapon3 Type"],
                "weapon3": row["Weapon3Name"],
                "categories": row["Decks"].split("|"),
            }
            for k, v in data.items():
                if v == "":
                    data[k] = "N/A"
            output.append(data)

with open("out.json", "w") as f:
    json.dump(output, f)
