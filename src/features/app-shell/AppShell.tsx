import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import styles from "./AppShell.module.css";

export type AppShellPropsT = {
  children: ReactNode;
};

/**
 * The frame around every page: a skip link, the header with the wordmark, and the main
 * landmark the page renders into.
 *
 * Pages render their content straight into it and must not add a second `<main>`. Nav
 * links join the header as their routes ship (Feed and Search in Milestone 3 and 4, the
 * profile link with sign-in in Milestone 1), so it never links to a page that does not
 * exist.
 */
export const AppShell = ({ children }: AppShellPropsT): ReactElement => (
  <div className={styles.wrapper}>
    <a className={styles.skipLink} href="#main">
      Skip to content
    </a>
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link className={styles.wordmark} href="/" aria-label="PeerReview.club, home">
          PeerReview<span className={styles.wordmarkDomain}>.club</span>
        </Link>
      </div>
    </header>
    <main className={styles.main} id="main">
      {children}
    </main>
  </div>
);
