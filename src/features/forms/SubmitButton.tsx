import type { ReactElement, ReactNode } from "react";

import styles from "./SubmitButton.module.css";

export type SubmitButtonPropsT = {
  children: ReactNode;
  isPending?: boolean;
  variant?: "solid" | "outline" | "danger";
};

/**
 * The button that submits a form. Solid for the main action on its screen, outlined for
 * the others, danger for destructive actions only (`docs/style-guide.md`). While the
 * form's action runs it is disabled, so a second press cannot send the form twice.
 */
export const SubmitButton = ({
  children,
  isPending = false,
  variant = "solid"
}: SubmitButtonPropsT): ReactElement => (
  <button
    className={`${styles.wrapper} ${styles[variant]}`}
    type="submit"
    disabled={isPending}>
    {children}
  </button>
);
