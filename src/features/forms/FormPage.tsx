import type { ReactElement, ReactNode } from "react";

import styles from "./FormPage.module.css";

export type FormPagePropsT = {
  title: string;
  children: ReactNode;
  intro?: string;
};

/** A page that is one short form: the title, an optional intro line, and the form. */
export const FormPage = ({ title, children, intro }: FormPagePropsT): ReactElement => (
  <div className={styles.wrapper}>
    <h1>{title}</h1>
    {intro && <p className={styles.intro}>{intro}</p>}
    {children}
  </div>
);
