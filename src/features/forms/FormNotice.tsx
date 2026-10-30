import type { ReactElement, ReactNode } from "react";

import styles from "./FormNotice.module.css";

export type FormNoticePropsT = {
  title: string;
  children: ReactNode;
};

/**
 * What a form did and what to do next, such as "Check your email". Set apart from the
 * page text by an ink border, the way `FormError` is by the danger color. Render it inside
 * the form's `role="status"` region, so screen readers announce it.
 */
export const FormNotice = ({ title, children }: FormNoticePropsT): ReactElement => (
  <div className={styles.wrapper}>
    <p className={styles.title}>{title}</p>
    <p>{children}</p>
  </div>
);
