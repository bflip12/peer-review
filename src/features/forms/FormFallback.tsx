import type { ReactElement } from "react";

import styles from "./FormFallback.module.css";

export type FormFallbackPropsT = {
  fieldCount: number;
};

/**
 * Holds a form's place while the part of the page that reads the session or the query
 * loads: one block per field and one for the button, so the page does not move.
 */
export const FormFallback = ({ fieldCount }: FormFallbackPropsT): ReactElement => (
  <div className={styles.wrapper} aria-hidden="true">
    {Array.from({ length: fieldCount }, (_, index) => (
      // The blocks have no data and never reorder, so the index is a stable key.
      <div className={styles.field} key={index}>
        <div className={styles.label} />
        <div className={styles.input} />
      </div>
    ))}
    <div className={styles.button} />
  </div>
);
