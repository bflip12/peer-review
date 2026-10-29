import type { ReactElement, ReactNode } from "react";

import styles from "./SubmitButton.module.css";

export type SubmitButtonPropsT = {
  children: ReactNode;
  isPending?: boolean;
};

/**
 * The solid button that submits a form, the main action on its screen. While the form's
 * action runs it is disabled, so a second press cannot send the form twice.
 */
export const SubmitButton = ({
  children,
  isPending = false
}: SubmitButtonPropsT): ReactElement => (
  <button className={styles.wrapper} type="submit" disabled={isPending}>
    {children}
  </button>
);
