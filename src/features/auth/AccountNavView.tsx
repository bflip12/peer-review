import Link from "next/link";
import type { ReactElement } from "react";

import styles from "./AccountNavView.module.css";
import type { AccountNavStateT } from "./utils/getAccountNavState";

export type AccountNavViewPropsT = {
  state: AccountNavStateT;
  signOutAction: () => Promise<void>;
};

/** The header's account area for one state. `AccountNav` reads the state. */
export const AccountNavView = ({
  state,
  signOutAction
}: AccountNavViewPropsT): ReactElement => {
  if (state.kind === "signedOut") {
    return (
      <div className={styles.wrapper}>
        <Link className={styles.link} href="/sign-in">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {state.kind === "needsProfile" && (
        <Link className={styles.link} href="/welcome">
          Pick a handle
        </Link>
      )}
      {state.kind === "active" && <span className={styles.handle}>@{state.handle}</span>}
      {state.kind === "banned" && (
        <span className={styles.banned}>This account is banned.</span>
      )}
      {state.kind !== "needsProfile" && (
        <Link className={styles.link} href="/settings">
          Settings
        </Link>
      )}
      <form action={signOutAction}>
        <button className={styles.signOut} type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
};
