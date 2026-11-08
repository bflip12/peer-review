import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getCityLabel } from "@/features/catalog/utils/getCityLabel";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { getCanEditVenue } from "./data/getCanEditVenue";
import { getVenue } from "./data/getVenue";
import { getVenuePath } from "./utils/getVenuePath";
import styles from "./VenueDetails.module.css";

export type VenueDetailsPropsT = {
  params: Promise<{ shortId: string; slug?: string }>;
};

/**
 * A venue's page: its name, city, links, and sound systems, with "Edit" for whoever may
 * edit it. A URL with a missing or outdated slug redirects to the current one
 * (`docs/DATA_MODEL.md`, URLs). Events and logs join the page in Milestone 4. Reads the
 * session, so it renders inside `<Suspense>`.
 */
export const VenueDetails = async ({
  params
}: VenueDetailsPropsT): Promise<ReactElement> => {
  const { shortId, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const [venue, userId] = await Promise.all([
    getVenue(supabase, shortId),
    getSignedInUserId(supabase)
  ]);
  if (!venue) {
    notFound();
  }
  const path = getVenuePath({
    shortId: venue.shortId,
    name: venue.name,
    cityName: venue.city.name
  });
  if (slug === undefined || `/venues/${shortId}/${decodeURIComponent(slug)}` !== path) {
    redirect(path);
  }
  const canEdit = userId
    ? await getCanEditVenue(supabase, { venueId: venue.id, userId })
    : false;
  const { name: cityName, region } = getCityLabel(venue.city);

  return (
    <article className={styles.wrapper}>
      <header className={styles.header}>
        <h1>{venue.name}</h1>
        <p className={styles.city}>
          {cityName} <span className={styles.region}>{region}</span>
        </p>
        {canEdit && (
          <Link className={styles.edit} href={`/venues/${venue.shortId}/edit`}>
            Edit venue
          </Link>
        )}
      </header>
      {venue.links.length > 0 && (
        <section className={styles.section} aria-labelledby="venue-links-heading">
          <h2 className={styles.label} id="venue-links-heading">
            Links
          </h2>
          <ul className={styles.list}>
            {venue.links.map((link) => (
              <li key={link.platformId}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {venue.soundSystems.length > 0 && (
        <section className={styles.section} aria-labelledby="venue-sound-heading">
          <h2 className={styles.label} id="venue-sound-heading">
            Sound system
          </h2>
          <ul className={styles.list}>
            {venue.soundSystems.map((soundSystem) => (
              <li key={soundSystem.id}>{soundSystem.name}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};
