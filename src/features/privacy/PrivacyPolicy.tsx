import Link from "next/link";
import type { ReactElement } from "react";

import styles from "./PrivacyPolicy.module.css";

// Shown on the page. Change it with every edit to the text below.
const LAST_UPDATED = "6 November 2026";
const CONTACT_EMAIL = "hello@peerreview.club";

/**
 * The privacy page's text. It describes only what the app stores today, so each feature
 * that stores new data a user owns updates it (`TASKS.md`).
 */
export const PrivacyPolicy = (): ReactElement => (
  <article className={styles.wrapper}>
    <h1>Privacy</h1>
    <p className={styles.updated}>Last updated {LAST_UPDATED}</p>

    <section className={styles.section}>
      <h2 className={styles.heading}>What we store</h2>
      <ul className={styles.list}>
        <li>
          Your email address, to sign you in. It is never shown to other users and no page
          or search returns it.
        </li>
        <li>Your handle and display name. Anyone can see them.</li>
        <li>
          Venues you add and edits you make to them. Anyone can see the venues. Who added
          a venue is seen only by you, and by locals and admins. Who edited it is seen
          only by locals and admins.
        </li>
      </ul>
    </section>

    <section className={styles.section}>
      <h2 className={styles.heading}>Signing in with Google</h2>
      <p>
        Google sends us your email address, name, and profile picture. We use only the
        email address. Our sign-in provider keeps the name and picture with your account,
        and Peer Review never reads or shows them. Your handle and display name start
        empty and are only what you type.
      </p>
    </section>

    <section className={styles.section}>
      <h2 className={styles.heading}>Cookies</h2>
      <p>
        Peer Review sets cookies only to keep you signed in. There are no analytics, ads,
        or tracking cookies.
      </p>
    </section>

    <section className={styles.section}>
      <h2 className={styles.heading}>Services that handle your data</h2>
      <ul className={styles.list}>
        <li>Supabase stores the database and runs sign-in.</li>
        <li>Vercel hosts the site.</li>
        <li>Resend sends sign-in emails.</li>
        <li>Google, if you sign in with Google.</li>
        <li>Cloudflare runs the domain and forwards email sent to {CONTACT_EMAIL}.</li>
      </ul>
    </section>

    <section className={styles.section}>
      <h2 className={styles.heading}>Deleting your account</h2>
      <p>
        In <Link href="/settings">Settings</Link>, &ldquo;Delete account&rdquo; deletes
        your account and profile straight away. It cannot be undone. Venues you added and
        edits you made stay, without the record that they were yours.
      </p>
    </section>

    <section className={styles.section}>
      <h2 className={styles.heading}>City data</h2>
      <p>
        The list of cities comes from <a href="https://www.geonames.org/">GeoNames</a>,
        under the <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>{" "}
        license.
      </p>
    </section>

    <section className={styles.section}>
      <h2 className={styles.heading}>Contact</h2>
      <p>
        Questions about your data: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        .
      </p>
    </section>
  </article>
);
