import type { Metadata } from "next";
import type { ReactElement } from "react";

import { requestSignInLink } from "@/features/auth/actions/requestSignInLink";
import { SignInForm } from "@/features/auth/SignInForm";
import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Sign in · Peer Review" };

/** Sign-in page: asks for an email address and sends a sign-in link to it. */
const SignInPage = (): ReactElement => (
  <FormPage title="Sign in" intro="We email you a link that signs you in. No password.">
    <SignInForm action={requestSignInLink} />
    <p>
      Your email is only used to sign in. It is never shown to other users. Any address
      works, including an alias.
    </p>
  </FormPage>
);

export default SignInPage;
