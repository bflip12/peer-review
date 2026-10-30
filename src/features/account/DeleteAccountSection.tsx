import { Suspense } from "react";
import type { ReactElement } from "react";

import { FormFallback } from "@/features/forms/FormFallback";

import { DeleteAccount } from "./DeleteAccount";
import styles from "./DeleteAccountSection.module.css";

/**
 * The settings page's "Delete account" section: what deleting removes, then the form.
 * The list grows as features add data a user owns (SPEC "Privacy").
 */
export const DeleteAccountSection = (): ReactElement => (
  <section className={styles.wrapper} aria-labelledby="delete-account-heading">
    <h2 className={styles.heading} id="delete-account-heading">
      Delete account
    </h2>
    <p>
      This deletes your account and your profile, and signs you out. It cannot be undone.
      Your handle becomes free for anyone to take.
    </p>
    <Suspense fallback={<FormFallback fieldCount={1} />}>
      <DeleteAccount />
    </Suspense>
  </section>
);
