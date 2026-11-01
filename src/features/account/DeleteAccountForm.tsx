"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";

import type { FormActionT } from "@/features/auth/auth.types";
import { FormError } from "@/features/forms/FormError";
import { SubmitButton } from "@/features/forms/SubmitButton";
import { TextField } from "@/features/forms/TextField";

import styles from "./DeleteAccountForm.module.css";

export type DeleteAccountFormPropsT = {
  handle: string;
  action: FormActionT;
};

/**
 * Deletes the signed-in user's account once they type their handle. The action checks the
 * handle again on the server. On success it redirects.
 */
export const DeleteAccountForm = ({
  handle,
  action
}: DeleteAccountFormPropsT): ReactElement => {
  const [result, formAction, isPending] = useActionState(action, null);
  const [typed, setTyped] = useState("");
  const failure = result?.ok === false ? result : null;

  return (
    <form className={styles.wrapper} action={formAction} noValidate>
      <TextField
        label="Type your handle to confirm"
        name="handle"
        autoComplete="off"
        value={typed}
        helpText={`Your handle is ${handle}.`}
        errors={failure?.fieldErrors?.handle}
        isRequired
        onValueChange={setTyped}
      />
      <SubmitButton variant="danger" isPending={isPending}>
        Delete account
      </SubmitButton>
      {failure && <FormError>{failure.message}</FormError>}
    </form>
  );
};
