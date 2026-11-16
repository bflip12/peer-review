import type { ReactElement } from "react";

import styles from "./DetailsFallback.module.css";

/**
 * Holds a venue page's place while the venue loads: blocks the size of the name, the
 * city, and a section of rows, so the page does not move when it arrives.
 */
export const DetailsFallback = (): ReactElement => (
  <div className={styles.wrapper} aria-hidden="true">
    <div className={styles.title} />
    <div className={styles.line} />
    <div className={styles.rows}>
      <div className={styles.line} />
      <div className={styles.line} />
    </div>
  </div>
);
