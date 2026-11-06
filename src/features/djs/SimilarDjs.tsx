import type { ReactElement } from "react";

import styles from "./DjMatches.module.css";
import type { DjMatchT } from "./djs.types";
import { getDjMatchNote } from "./utils/getDjMatchNote";
import { getDjPath } from "./utils/getDjPath";

export type SimilarDjsPropsT = {
  /** DJs with a name like the typed one. At least one. */
  djs: DjMatchT[];
};

/**
 * DJs with a similar name, in the picked city or with no city, so "Rush" is checked
 * against "DJ Rush" before a second entry is made. Each links to their page in a new
 * tab, so the form keeps what was typed.
 */
export const SimilarDjs = ({ djs }: SimilarDjsPropsT): ReactElement => (
  <section className={styles.wrapper} aria-labelledby="similar-djs-heading">
    <h2 className={styles.heading} id="similar-djs-heading">
      Already on Peer Review?
    </h2>
    <p>These DJs have a similar name. Check yours is not one of them.</p>
    <ul className={styles.list}>
      {djs.map((dj) => (
        <li className={styles.item} key={dj.shortId}>
          <span className={styles.details}>
            <span>
              <a href={getDjPath(dj)} target="_blank" rel="noopener noreferrer">
                {dj.name}
              </a>{" "}
              <span className={styles.note}>(opens in a new tab)</span>
            </span>
            <span className={styles.note}>{getDjMatchNote(dj)}</span>
          </span>
        </li>
      ))}
    </ul>
  </section>
);
