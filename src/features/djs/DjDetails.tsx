import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getCityLabel } from "@/features/catalog/utils/getCityLabel";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { getCanEditDj } from "./data/getCanEditDj";
import { getDj } from "./data/getDj";
import styles from "./DjDetails.module.css";
import { getDjPath } from "./utils/getDjPath";

export type DjDetailsPropsT = {
  params: Promise<{ shortId: string; slug?: string }>;
};

/**
 * A DJ's page: their name, where they're based under it (left out when not known), and
 * links, with "Edit" for whoever may edit them. A URL with a missing or outdated slug
 * redirects to the current one (`docs/DATA_MODEL.md`, URLs). Nights join the page in
 * Milestone 4. Reads the session, so it renders inside `<Suspense>`.
 */
export const DjDetails = async ({ params }: DjDetailsPropsT): Promise<ReactElement> => {
  const { shortId, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const [dj, userId] = await Promise.all([
    getDj(supabase, shortId),
    getSignedInUserId(supabase)
  ]);
  if (!dj) {
    notFound();
  }
  const path = getDjPath(dj);
  if (slug === undefined || `/djs/${shortId}/${decodeURIComponent(slug)}` !== path) {
    redirect(path);
  }
  const canEdit = userId
    ? await getCanEditDj(supabase, { artistId: dj.id, userId })
    : false;
  const city = dj.city ? getCityLabel(dj.city) : null;

  return (
    <article className={styles.wrapper}>
      <header className={styles.header}>
        <h1>{dj.name}</h1>
        {city && (
          <p className={styles.city}>
            {city.name} <span className={styles.region}>{city.region}</span>
          </p>
        )}
        {canEdit && (
          <Link className={styles.edit} href={`/djs/${dj.shortId}/edit`}>
            Edit DJ
          </Link>
        )}
      </header>
      {dj.links.length > 0 && (
        <section className={styles.section} aria-labelledby="dj-links-heading">
          <h2 className={styles.label} id="dj-links-heading">
            Links
          </h2>
          <ul className={styles.list}>
            {dj.links.map((link) => (
              <li key={link.platformId}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};
