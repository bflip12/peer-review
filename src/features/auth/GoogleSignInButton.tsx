"use client";

import type { ReactElement } from "react";
import { useFormStatus } from "react-dom";

import { SubmitButton } from "@/features/forms/SubmitButton";

/**
 * The outlined "Continue with Google" button. Render it inside a form whose action is
 * `startGoogleSignIn`. Disabled while the action runs, so a second press does not start
 * a second sign-in.
 */
export const GoogleSignInButton = (): ReactElement => {
  const { pending: isPending } = useFormStatus();
  return (
    <SubmitButton variant="outline" isPending={isPending}>
      Continue with Google
    </SubmitButton>
  );
};
