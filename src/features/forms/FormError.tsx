import type { ReactElement, ReactNode } from "react";

import styles from "./FormError.module.css";

export type FormErrorPropsT = {
  children: ReactNode;
};

/**
 * A form's error that is not about one field, such as a link that could not be sent.
 * Set apart from plain status text by the danger color and a border, and announced to
 * screen readers when it appears.
 */
export const FormError = ({ children }: FormErrorPropsT): ReactElement => (
  <p className={styles.wrapper} role="alert">
    {children}
  </p>
);
