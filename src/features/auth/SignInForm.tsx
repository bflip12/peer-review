"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";

import { FormError } from "@/features/forms/FormError";
import { FormNotice } from "@/features/forms/FormNotice";
import { SubmitButton } from "@/features/forms/SubmitButton";
import { TextField } from "@/features/forms/TextField";

import type { FormActionT } from "./auth.types";
import styles from "./SignInForm.module.css";

export type SignInFormPropsT = {
  action: FormActionT;
};

/**
 * The email field that asks for a sign-in link. After a link is sent it says to check
 * the inbox and names the address, and the form stays, so the user can fix a typo and
 * send again.
 */
export const SignInForm = ({ action }: SignInFormPropsT): ReactElement => {
  const [result, formAction, isPending] = useActionState(action, null);
  const [email, setEmail] = useState("");
  // The address the last link went to, kept apart from the field so editing it does not
  // change what the notice says was sent.
  const [sentTo, setSentTo] = useState("");
  const isSent = result?.ok === true;
  const failure = result?.ok === false ? result : null;

  return (
    <form
      className={styles.wrapper}
      action={formAction}
      noValidate
      onSubmit={() => {
        setSentTo(email.trim());
      }}>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        errors={failure?.fieldErrors?.email}
        isRequired
        onValueChange={setEmail}
      />
      <SubmitButton isPending={isPending}>Send sign-in link</SubmitButton>
      <div className={styles.status} role="status">
        {isSent && (
          <FormNotice title="Check your email">
            We sent a sign-in link to {sentTo}. Open it on this or any other device.
          </FormNotice>
        )}
      </div>
      {failure && !failure.fieldErrors && <FormError>{failure.message}</FormError>}
    </form>
  );
};
