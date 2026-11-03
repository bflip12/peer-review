import { describe, expect, it } from "vitest";

import {
  foldName,
  loadGeonames,
  parseAdmin1Names,
  parseCountryLanguages
} from "./geonames.ts";

// One line of cities1000.txt, with the 19 tab-separated GeoNames columns.
const cityLine = ({
  id = "2886242",
  name = "Köln",
  asciiName = "Koeln",
  featureCode = "PPLA2",
  countryCode = "DE",
  admin1Code = "07",
  population = "1024621",
  timezone = "Europe/Berlin"
} = {}): string =>
  [
    id,
    name,
    asciiName,
    "Cologne,Koeln",
    "50.93333",
    "6.95",
    "P",
    featureCode,
    countryCode,
    "",
    admin1Code,
    "",
    "",
    "",
    population,
    "",
    "53",
    timezone,
    "2024-08-27"
  ].join("\t");

// One line of alternateNamesV2.txt, with its 10 columns.
const nameLine = ({
  cityId = "2886242",
  language = "en",
  name = "Cologne",
  isColloquial = "",
  isHistoric = ""
} = {}): string =>
  ["1599780", cityId, language, name, "1", "", isColloquial, isHistoric, "", ""].join(
    "\t"
  );

const ADMIN1 = "DE.07\tNorth Rhine-Westphalia\tNorth Rhine-Westphalia\t2861876\n";
const COUNTRIES = [
  "#ISO\tISO3\tISO-Numeric\tfips\tCountry\tCapital\tArea\tPopulation\tContinent\ttld\tCurrencyCode\tCurrencyName\tPhone\tPostal Code Format\tPostal Code Regex\tLanguages\tgeonameid\tneighbours\tEquivalentFipsCode",
  "DE\tDEU\t276\tGM\tGermany\tBerlin\t357021\t82927922\tEU\t.de\tEUR\tEuro\t49\t#####\t^(\\d{5})$\tde\t2921044\tCH,PL\t",
  "CH\tCHE\t756\tSZ\tSwitzerland\tBern\t41290\t8516543\tEU\t.ch\tCHF\tFranc\t41\t####\t^(\\d{4})$\tde-CH,fr-CH,it-CH,rm\t2658434\tDE\t"
].join("\n");

const load = (cities: string[], names: string[] = []) =>
  loadGeonames({
    cityLines: cities,
    admin1Text: ADMIN1,
    countryText: COUNTRIES,
    alternateNameLines: names
  });

describe("parseAdmin1Names", () => {
  it("maps country and admin1 code to the region name", () => {
    const result = parseAdmin1Names(ADMIN1);

    expect(result.get("DE.07")).toBe("North Rhine-Westphalia");
  });
});

describe("parseCountryLanguages", () => {
  it("maps each country to its language codes without the region part", () => {
    const result = parseCountryLanguages(COUNTRIES);

    expect(result.get("CH")).toEqual(new Set(["de", "fr", "it", "rm"]));
  });

  it("skips comment lines", () => {
    const result = parseCountryLanguages(COUNTRIES);

    expect([...result.keys()]).toEqual(["DE", "CH"]);
  });
});

describe("foldName", () => {
  it("lowercases and strips accents", () => {
    expect(foldName("Köln")).toBe("koln");
  });
});

describe("loadGeonames", () => {
  it("reads a city with its region name", async () => {
    const result = await load([cityLine()]);

    expect(result.cities).toEqual([
      {
        id: 2886242,
        name: "Köln",
        asciiName: "Koeln",
        countryCode: "DE",
        admin1Name: "North Rhine-Westphalia",
        population: 1024621,
        timezone: "Europe/Berlin"
      }
    ]);
  });

  it("leaves the region empty when GeoNames has no name for its code", async () => {
    const result = await load([cityLine({ admin1Code: "00" })]);

    expect(result.cities[0].admin1Name).toBeNull();
  });

  it.each(["PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLA5", "PPLC", "PPLG", "PPLL"])(
    "keeps a %s entry",
    async (featureCode) => {
      const result = await load([cityLine({ featureCode })]);

      expect(result.cities).toHaveLength(1);
    }
  );

  it.each(["PPLX", "PPLH", "PPLQ", "PPLW", "PPLCH"])(
    "leaves out a %s entry",
    async (featureCode) => {
      const result = await load([cityLine({ featureCode })]);

      expect(result.cities).toEqual([]);
    }
  );

  it("keeps English names and names in the city's country languages", async () => {
    const result = await load(
      [cityLine()],
      [
        nameLine({ language: "en", name: "Cologne" }),
        nameLine({ language: "de", name: "Stadt Köln" })
      ]
    );

    expect(result.names).toEqual([
      { cityId: 2886242, language: "en", name: "Cologne" },
      { cityId: 2886242, language: "de", name: "Stadt Köln" }
    ]);
  });

  it("leaves out names in other languages and names with no language", async () => {
    const result = await load(
      [cityLine()],
      [
        nameLine({ language: "fr", name: "Cologne-sur-Rhin" }),
        nameLine({ language: "", name: "Colonia Agrippinensis" }),
        nameLine({ language: "link", name: "https://en.wikipedia.org/wiki/Cologne" })
      ]
    );

    expect(result.names).toEqual([]);
  });

  it("leaves out historic and colloquial names", async () => {
    const result = await load(
      [cityLine()],
      [
        nameLine({ name: "Old Cologne", isHistoric: "1" }),
        nameLine({ name: "Cologne Town", isColloquial: "1" })
      ]
    );

    expect(result.names).toEqual([]);
  });

  it("leaves out names that match the main or ASCII name once folded", async () => {
    const result = await load(
      [cityLine()],
      [
        nameLine({ language: "de", name: "Köln" }),
        nameLine({ language: "de", name: "KOELN" }),
        nameLine({ language: "en", name: "Koln" })
      ]
    );

    expect(result.names).toEqual([]);
  });

  it("leaves out names with no letter or digit", async () => {
    const result = await load([cityLine()], [nameLine({ name: " \u200b " })]);

    expect(result.names).toEqual([]);
  });

  it("keeps one copy of a name repeated in the same language", async () => {
    const result = await load([cityLine()], [nameLine(), nameLine()]);

    expect(result.names).toHaveLength(1);
  });

  it("leaves out names of cities it did not keep", async () => {
    const result = await load([cityLine({ featureCode: "PPLX" })], [nameLine()]);

    expect(result.names).toEqual([]);
  });

  it("refuses a city line with the wrong number of columns", async () => {
    await expect(load(["2886242\tKöln"])).rejects.toThrow(
      "cities1000.txt line 1 has 2 columns, expected 19"
    );
  });

  it("refuses a city with no timezone", async () => {
    await expect(load([cityLine({ timezone: "" })])).rejects.toThrow(
      "City 2886242 has no timezone"
    );
  });
});
