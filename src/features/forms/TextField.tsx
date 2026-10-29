import type { ChangeEvent, ReactElement } from "react";

import styles from "./TextField.module.css";

export type TextFieldPropsT = {
  label: string;
  name: string;
  value: string;
  type?: "text" | "email";
  autoComplete?: string;
  helpText?: string;
  errors?: string[];
  isRequired?: boolean;
  onValueChange: (value: string) => void;
};

/**
 * A labelled text input with optional help text and error messages below it. Help and
 * errors are linked to the input with `aria-describedby`, and errors set `aria-invalid`.
 */
export const TextField = ({
  label,
  name,
  value,
  type = "text",
  autoComplete,
  helpText,
  errors = [],
  isRequired = false,
  onValueChange
}: TextFieldPropsT): ReactElement => {
  const inputId = `field-${name}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const hasErrors = errors.length > 0;
  const describedBy = [helpText && helpId, hasErrors && errorId]
    .filter(Boolean)
    .join(" ");

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onValueChange(event.target.value);
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        className={styles.input}
        id={inputId}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={isRequired}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy || undefined}
        onChange={handleChange}
      />
      {helpText && (
        <p className={styles.help} id={helpId}>
          {helpText}
        </p>
      )}
      {hasErrors && (
        <p className={styles.error} id={errorId}>
          {errors.join(" ")}
        </p>
      )}
    </div>
  );
};
