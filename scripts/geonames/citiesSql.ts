import type { GeonamesT } from "./geonames.ts";

const ROWS_PER_STATEMENT = 1000;

/** A SQL text literal. Migrations run with standard_conforming_strings on, so only quotes need doubling. */
export const sqlText = (value: string | null): string => {
  if (value === null) {
    return "null";
  }
  if (value.includes("\u0000")) {
    throw new Error(`Text with a NUL character: ${value.split("\u0000")[0]}`);
  }
  return `'${value.replaceAll("'", "''")}'`;
};

const inserts = (table: string, columns: string[], rows: string[]): string[] => {
  const statements: string[] = [];
  for (let start = 0; start < rows.length; start += ROWS_PER_STATEMENT) {
    const chunk = rows.slice(start, start + ROWS_PER_STATEMENT);
    statements.push(
      `insert into public.${table} (${columns.join(", ")}) values\n${chunk.join(",\n")};`
    );
  }
  return statements;
};

/** The seed migration: a comment line per entry of `header`, then the inserts. */
export const buildCitiesSql = (
  { cities, names }: GeonamesT,
  header: string[]
): string => {
  const cityRows = cities.map(
    (city) =>
      `(${city.id}, ${sqlText(city.name)}, ${sqlText(city.asciiName)}, ` +
      `${sqlText(city.countryCode)}, ${sqlText(city.admin1Name)}, ${city.population}, ` +
      `${sqlText(city.timezone)})`
  );
  const nameRows = names.map(
    (name) => `(${name.cityId}, ${sqlText(name.language)}, ${sqlText(name.name)})`
  );
  return [
    ...header.map((line) => `-- ${line}`),
    "",
    ...inserts(
      "cities",
      [
        "id",
        "name",
        "ascii_name",
        "country_code",
        "admin1_name",
        "population",
        "timezone"
      ],
      cityRows
    ),
    ...inserts("city_names", ["city_id", "language", "name"], nameRows),
    ""
  ].join("\n");
};
