import type { ReactElement, ReactNode } from "react";

import styles from "./SubmitButton.module.css";

export type SubmitButtonPropsT = {
  children: ReactNode;
  isPending?: boolean;
  tone?: "ink" | "danger";
};

/**
 * The solid button that submits a form, the main action on its screen. While the form's
 * action runs it is disabled, so a second press cannot send the form twice. The danger
 * tone is for destructive actions only (`docs/style-guide.md`).
 */
export const SubmitButton = ({
  children,
  isPending = false,
  tone = "ink"
}: SubmitButtonPropsT): ReactElement => (
  <button
    className={tone === "danger" ? `${styles.wrapper} ${styles.danger}` : styles.wrapper}
    type="submit"
    disabled={isPending}>
    {children}
  </button>
);
