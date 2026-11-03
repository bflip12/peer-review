// Writes the migration that seeds `cities` and `city_names` from GeoNames (ADR 0025).
// Usage: npm run db:cities -- supabase/migrations/<timestamp>_seed_cities.sql
// Create the file first with `npx supabase migration new seed_cities`. Needs `unzip`.
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { buildCitiesSql } from "./citiesSql.ts";
import { loadGeonames } from "./geonames.ts";

const BASE_URL = "https://download.geonames.org/export/dump";
const CACHE_DIR = join(tmpdir(), "peer-review-geonames");

const download = async (fileName: string): Promise<string> => {
  const path = join(CACHE_DIR, fileName);
  const response = await fetch(`${BASE_URL}/${fileName}`);
  if (!response.ok) {
    throw new Error(`GET ${fileName} returned ${response.status}`);
  }
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  return path;
};

// Lines of one file inside a zip, read as a stream. alternateNamesV2.txt is about 800 MB.
const zipLines = async function* (
  zipPath: string,
  entry: string
): AsyncGenerator<string> {
  const child = spawn("unzip", ["-p", zipPath, entry], {
    stdio: ["ignore", "pipe", "inherit"]
  });
  const exited = new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  yield* createInterface({ input: child.stdout, crlfDelay: Infinity });
  const code = await exited;
  if (code !== 0) {
    throw new Error(`unzip ${entry} exited with ${code}`);
  }
};

const main = async (): Promise<void> => {
  const outputPath = process.argv[2];
  if (!outputPath?.endsWith("_seed_cities.sql")) {
    throw new Error(
      "Pass the migration file: npm run db:cities -- supabase/migrations/<timestamp>_seed_cities.sql"
    );
  }
  await mkdir(CACHE_DIR, { recursive: true });
  const [citiesZip, namesZip, admin1Path, countryPath] = await Promise.all([
    download("cities1000.zip"),
    download("alternateNamesV2.zip"),
    download("admin1CodesASCII.txt"),
    download("countryInfo.txt")
  ]);

  const geonames = await loadGeonames({
    cityLines: zipLines(citiesZip, "cities1000.txt"),
    admin1Text: await readFile(admin1Path, "utf8"),
    countryText: await readFile(countryPath, "utf8"),
    alternateNameLines: zipLines(namesZip, "alternateNamesV2.txt")
  });

  const downloadedOn = new Date().toISOString().slice(0, 10);
  const sql = buildCitiesSql(geonames, [
    "Seeds cities and city_names from the GeoNames export (ADR 0025): cities1000,",
    "admin1CodesASCII, countryInfo, and alternateNamesV2, downloaded on",
    `${downloadedOn} from ${BASE_URL}.`,
    "GeoNames data is CC BY 4.0 (geonames.org), credited on the privacy page.",
    "Written by scripts/geonames/buildCitiesMigration.ts. Do not edit by hand.",
    `${geonames.cities.length} cities, ${geonames.names.length} other names.`
  ]);
  await writeFile(outputPath, sql);
  console.log(
    `Wrote ${geonames.cities.length} cities and ${geonames.names.length} names to ${outputPath}`
  );
};

await main();
