import type { ReactElement } from "react";

import styles from "./AccountNavFallback.module.css";

/** Holds the account area's place while `AccountNav` reads the session. */
export const AccountNavFallback = (): ReactElement => (
  <div className={styles.wrapper} aria-hidden="true" />
);
