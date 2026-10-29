"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ReactElement } from "react";

import { FormError } from "@/features/forms/FormError";
import { SubmitButton } from "@/features/forms/SubmitButton";

import type { FormActionT } from "./auth.types";
import styles from "./ConfirmSignInForm.module.css";

export type ConfirmSignInFormPropsT = {
  tokenHash: string;
  action: FormActionT;
};

/**
 * The "Sign in" button on the page a sign-in link opens. On success the action redirects.
 * On failure it says why and links to the sign-in page for a new link.
 */
export const ConfirmSignInForm = ({
  tokenHash,
  action
}: ConfirmSignInFormPropsT): ReactElement => {
  const [result, formAction, isPending] = useActionState(action, null);
  const failure = result?.ok === false ? result : null;

  return (
    <form className={styles.wrapper} action={formAction}>
      <input type="hidden" name="tokenHash" value={tokenHash} />
      <input type="hidden" name="type" value="email" />
      <SubmitButton isPending={isPending}>Sign in</SubmitButton>
      {failure && (
        <FormError>
          {failure.message} <Link href="/sign-in">Get a new sign-in link</Link>
        </FormError>
      )}
    </form>
  );
};
