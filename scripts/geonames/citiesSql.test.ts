import { describe, expect, it } from "vitest";

import { buildCitiesSql, sqlText } from "./citiesSql.ts";
import type { CityNameT, CityT } from "./geonames.ts";

const city = (overrides: Partial<CityT> = {}): CityT => ({
  id: 2886242,
  name: "Köln",
  asciiName: "Koeln",
  countryCode: "DE",
  admin1Name: "North Rhine-Westphalia",
  population: 1024621,
  timezone: "Europe/Berlin",
  ...overrides
});

const cityName = (overrides: Partial<CityNameT> = {}): CityNameT => ({
  cityId: 2886242,
  language: "en",
  name: "Cologne",
  ...overrides
});

describe("sqlText", () => {
  it("quotes text and doubles single quotes", () => {
    expect(sqlText("L'Aquila")).toBe("'L''Aquila'");
  });

  it("writes null for a missing value", () => {
    expect(sqlText(null)).toBe("null");
  });

  it("keeps backslashes as they are", () => {
    expect(sqlText("a\\b")).toBe("'a\\b'");
  });

  it("refuses text with a NUL character", () => {
    expect(() => sqlText("a\u0000b")).toThrow("Text with a NUL character: a");
  });
});

describe("buildCitiesSql", () => {
  it("starts with the header comment", () => {
    const result = buildCitiesSql({ cities: [], names: [] }, ["Seeds cities."]);

    expect(result.startsWith("-- Seeds cities.\n")).toBe(true);
  });

  it("inserts each city", () => {
    const result = buildCitiesSql({ cities: [city()], names: [] }, []);

    expect(result).toContain(
      "insert into public.cities (id, name, ascii_name, country_code, admin1_name, population, timezone) values\n" +
        "(2886242, 'Köln', 'Koeln', 'DE', 'North Rhine-Westphalia', 1024621, 'Europe/Berlin');"
    );
  });

  it("inserts each name", () => {
    const result = buildCitiesSql({ cities: [city()], names: [cityName()] }, []);

    expect(result).toContain(
      "insert into public.city_names (city_id, language, name) values\n" +
        "(2886242, 'en', 'Cologne');"
    );
  });

  it("splits rows into statements of 1000", () => {
    const cities = Array.from({ length: 2001 }, (_, index) => city({ id: index + 1 }));

    const result = buildCitiesSql({ cities, names: [] }, []);

    expect(result.match(/insert into public\.cities/g)).toHaveLength(3);
  });

  it("writes no insert for an empty list", () => {
    const result = buildCitiesSql({ cities: [], names: [] }, []);

    expect(result).not.toContain("insert");
  });

  it("writes a null region as null", () => {
    const result = buildCitiesSql(
      { cities: [city({ admin1Name: null })], names: [] },
      []
    );

    expect(result).toContain("'DE', null, 1024621");
  });
});
