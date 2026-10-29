"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";

import type { FormActionT } from "@/features/auth/auth.types";
import { FormError } from "@/features/forms/FormError";
import { SubmitButton } from "@/features/forms/SubmitButton";
import { TextField } from "@/features/forms/TextField";

import styles from "./ProfileSetupForm.module.css";

export type ProfileSetupFormPropsT = {
  action: FormActionT;
};

/**
 * Handle and display name for a new account. Both start empty: nothing is copied from the
 * email address or a Google profile (SPEC section 1). On success the action redirects.
 */
export const ProfileSetupForm = ({ action }: ProfileSetupFormPropsT): ReactElement => {
  const [result, formAction, isPending] = useActionState(action, null);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const failure = result?.ok === false ? result : null;

  return (
    <form className={styles.wrapper} action={formAction} noValidate>
      <TextField
        label="Handle"
        name="handle"
        autoComplete="username"
        value={handle}
        helpText="2 to 30 letters, numbers, underscores (_), or dots (.). Shown as @handle."
        errors={failure?.fieldErrors?.handle}
        isRequired
        onValueChange={setHandle}
      />
      <TextField
        label="Display name (optional)"
        name="displayName"
        autoComplete="nickname"
        value={displayName}
        helpText="Up to 50 characters. Shown beside your handle."
        errors={failure?.fieldErrors?.displayName}
        onValueChange={setDisplayName}
      />
      <SubmitButton isPending={isPending}>Create profile</SubmitButton>
      {failure && <FormError>{failure.message}</FormError>}
    </form>
  );
};
