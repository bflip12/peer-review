"use client";

import type { ReactElement } from "react";

import type { CityT } from "@/features/catalog/catalog.types";
import { useSearchResults } from "@/features/catalog/hooks/useSearchResults";

import styles from "./SimilarVenues.module.css";
import { getVenuePath } from "./utils/getVenuePath";
import type { SimilarVenueT } from "./venues.types";

// search_venues returns nothing under 2 characters.
const MIN_NAME_LENGTH = 2;

export type SimilarVenuesPropsT = {
  name: string;
  city: CityT | null;
};

/**
 * The duplicate check while a venue is being added: venues in the chosen city with a
 * name like the one typed, each linking to its page in a new tab so the form keeps what
 * was typed. Shows nothing until both a name and a city are set, or when nothing matches.
 */
export const SimilarVenues = ({
  name,
  city
}: SimilarVenuesPropsT): ReactElement | null => {
  const trimmed = name.trim();
  const searchUrl =
    city && [...trimmed].length >= MIN_NAME_LENGTH
      ? `/api/venues/similar?${new URLSearchParams({ q: trimmed, cityId: String(city.id) }).toString()}`
      : null;
  const { results } = useSearchResults<SimilarVenueT>(searchUrl);

  if (!city || results.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.wrapper}
      aria-labelledby="similar-venues-heading"
      aria-live="polite">
      <h2 className={styles.heading} id="similar-venues-heading">
        Already on Peer Review?
      </h2>
      <p>
        These venues in {city.name} have a similar name. Check yours is not one of them.
      </p>
      <ul className={styles.list}>
        {results.map((venue) => (
          <li key={venue.shortId}>
            <a
              href={getVenuePath({
                shortId: venue.shortId,
                name: venue.name,
                cityName: city.name
              })}
              target="_blank"
              rel="noopener noreferrer">
              {venue.name}
            </a>{" "}
            <span className={styles.note}>(opens in a new tab)</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
