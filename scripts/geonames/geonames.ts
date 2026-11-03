// Reads the GeoNames export files into the rows of `cities` and `city_names` (ADR 0025).

/** A row of `cities`. */
export type CityT = {
  id: number;
  name: string;
  asciiName: string;
  countryCode: string;
  admin1Name: string | null;
  population: number;
  timezone: string;
};

/** A row of `city_names`: an English or local name besides the city's main name. */
export type CityNameT = { cityId: number; language: string; name: string };

export type GeonamesT = { cities: CityT[]; names: CityNameT[] };

type InputT = {
  cityLines: Iterable<string> | AsyncIterable<string>;
  admin1Text: string;
  countryText: string;
  alternateNameLines: Iterable<string> | AsyncIterable<string>;
};

// Populated places that are a town or city in their own right. Left out: PPLX (a section
// of a city, such as Kreuzberg), PPLH and PPLCH (historical), PPLQ (abandoned), PPLW
// (destroyed). A code not listed, including any GeoNames adds later, is left out.
const KEPT_FEATURE_CODES = new Set([
  "PPL",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
  "PPLA5",
  "PPLC",
  "PPLF",
  "PPLG",
  "PPLL",
  "PPLR",
  "PPLS",
  "STLMT"
]);

const CITY_COLUMNS = 19;
// GeoNames has a few names that are only spaces or invisible characters.
const HAS_LETTER = /[\p{L}\p{N}]/u;
const NAME_COLUMNS = 10;

/** Lowercase with accents removed, so names that differ only by those count as one. */
export const foldName = (name: string): string =>
  name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const dataLines = (text: string): string[] =>
  text.split("\n").filter((line) => line !== "" && !line.startsWith("#"));

/** Region names from admin1CodesASCII.txt, keyed by `<country>.<admin1 code>`. */
export const parseAdmin1Names = (text: string): Map<string, string> =>
  new Map(
    dataLines(text).map((line) => {
      const [code, name] = line.split("\t");
      return [code, name];
    })
  );

/** Language codes per country from countryInfo.txt, with region parts dropped (de-CH is de). */
export const parseCountryLanguages = (text: string): Map<string, Set<string>> =>
  new Map(
    dataLines(text).map((line) => {
      const columns = line.split("\t");
      const languages = columns[15]
        .split(",")
        .filter((code) => code !== "")
        .map((code) => code.split("-")[0].toLowerCase());
      return [columns[0], new Set(languages)];
    })
  );

const parseCity = (
  line: string,
  lineNumber: number,
  admin1Names: Map<string, string>
): CityT | null => {
  const columns = line.split("\t");
  if (columns.length !== CITY_COLUMNS) {
    throw new Error(
      `cities1000.txt line ${lineNumber} has ${columns.length} columns, expected ${CITY_COLUMNS}`
    );
  }
  const [id, name, asciiName] = columns;
  const featureCode = columns[7];
  const countryCode = columns[8];
  const timezone = columns[17];
  if (!KEPT_FEATURE_CODES.has(featureCode)) {
    return null;
  }
  if (timezone === "") {
    throw new Error(`City ${id} has no timezone`);
  }
  return {
    id: Number(id),
    name,
    asciiName,
    countryCode,
    admin1Name: admin1Names.get(`${countryCode}.${columns[10]}`) ?? null,
    population: Number(columns[14]),
    timezone
  };
};

/**
 * Reads cities1000.txt, admin1CodesASCII.txt, countryInfo.txt, and alternateNamesV2.txt.
 * Keeps the cities whose feature code is a town or city, and for each one the names in
 * English or one of its country's languages that are not historic or colloquial, have a letter or digit, and are not
 * the main or ASCII name with different case or accents.
 */
export const loadGeonames = async ({
  cityLines,
  admin1Text,
  countryText,
  alternateNameLines
}: InputT): Promise<GeonamesT> => {
  const admin1Names = parseAdmin1Names(admin1Text);
  const countryLanguages = parseCountryLanguages(countryText);

  const cities: CityT[] = [];
  const citiesById = new Map<number, { city: CityT; folded: Set<string> }>();
  let lineNumber = 0;
  for await (const line of cityLines) {
    lineNumber += 1;
    if (line === "") {
      continue;
    }
    const city = parseCity(line, lineNumber, admin1Names);
    if (city) {
      cities.push(city);
      citiesById.set(city.id, {
        city,
        folded: new Set([foldName(city.name), foldName(city.asciiName)])
      });
    }
  }

  const names: CityNameT[] = [];
  const seen = new Set<string>();
  for await (const line of alternateNameLines) {
    const columns = line.split("\t");
    if (columns.length !== NAME_COLUMNS) {
      continue;
    }
    const [, cityIdText, language, name, , , isColloquial, isHistoric] = columns;
    const entry = citiesById.get(Number(cityIdText));
    if (!entry || isColloquial === "1" || isHistoric === "1" || !HAS_LETTER.test(name)) {
      continue;
    }
    const isLocal = countryLanguages.get(entry.city.countryCode)?.has(language) ?? false;
    if (language !== "en" && !isLocal) {
      continue;
    }
    const key = `${entry.city.id}\t${language}\t${name}`;
    if (entry.folded.has(foldName(name)) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push({ cityId: entry.city.id, language, name });
  }

  return { cities, names };
};
