import Link from "next/link";
import { Suspense } from "react";
import type { ReactElement, ReactNode } from "react";

import { AccountNavFallback } from "@/features/auth/AccountNavFallback";

import styles from "./AppShell.module.css";

export type AppShellPropsT = {
  children: ReactNode;
  /** The header's account area. It reads the session, so it renders inside Suspense. */
  accountNav: ReactNode;
};

/**
 * The frame around every page: a skip link, the header with the wordmark, and the main
 * landmark the page renders into.
 *
 * Pages render their content straight into it and must not add a second `<main>`. Nav
 * links join the header as their routes ship (Feed and Search in Milestone 3 and 4, the
 * profile link with profile pages in Milestone 4), so it never links to a page that does
 * not exist.
 */
export const AppShell = ({ children, accountNav }: AppShellPropsT): ReactElement => (
  <div className={styles.wrapper}>
    <a className={styles.skipLink} href="#main">
      Skip to content
    </a>
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link className={styles.wordmark} href="/" aria-label="PeerReview.club, home">
          PeerReview<span className={styles.wordmarkDomain}>.club</span>
        </Link>
        <Suspense fallback={<AccountNavFallback />}>{accountNav}</Suspense>
      </div>
    </header>
    <main className={styles.main} id="main">
      {children}
    </main>
  </div>
);
