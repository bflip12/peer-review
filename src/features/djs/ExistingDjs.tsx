import Link from "next/link";
import type { ReactElement } from "react";

import styles from "./DjMatches.module.css";
import type { DjMatchT } from "./djs.types";
import { getDjMatchNote } from "./utils/getDjMatchNote";
import { getDjPath } from "./utils/getDjPath";

export type ExistingDjsPropsT = {
  /** DJs with exactly the typed name. At least one. */
  djs: DjMatchT[];
};

/**
 * Shown when DJs with exactly the typed name are already on Peer Review: "There's
 * already a DJ called DJ Rush.", then each one with their city, link sites, and "Use
 * this DJ", then "Different person?" above the city field. "Use this DJ" opens the DJ's
 * page until lineups exist (Milestone 3), where it will pick the DJ.
 */
export const ExistingDjs = ({ djs }: ExistingDjsPropsT): ReactElement => {
  const [first] = djs;
  const heading =
    djs.length === 1
      ? `There's already a DJ called ${first.name}.`
      : `There are already ${djs.length} DJs called ${first.name}.`;

  return (
    <section className={styles.wrapper} aria-labelledby="existing-djs-heading">
      <h2 className={styles.heading} id="existing-djs-heading">
        {heading}
      </h2>
      <ul className={styles.list}>
        {djs.map((dj) => (
          <li className={styles.item} key={dj.shortId}>
            <span className={styles.details}>
              <span>{dj.name}</span>
              <span className={styles.note}>{getDjMatchNote(dj)}</span>
            </span>
            <Link
              className={styles.use}
              href={getDjPath(dj)}
              aria-label={`Use this DJ: ${dj.name}, ${getDjMatchNote(dj)}`}>
              Use this DJ
            </Link>
          </li>
        ))}
      </ul>
      <p className={styles.different}>
        <strong>Different person?</strong> Add where they&apos;re based, then add them as
        a new DJ.
      </p>
    </section>
  );
};
