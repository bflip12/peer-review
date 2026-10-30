import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { requestSignInLink } from "@/features/auth/actions/requestSignInLink";
import { startGoogleSignIn } from "@/features/auth/actions/startGoogleSignIn";
import { GoogleSignInButton } from "@/features/auth/GoogleSignInButton";
import { SignInForm } from "@/features/auth/SignInForm";
import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Sign in · Peer Review" };

/** Sign-in page: Google, or an email address that gets a sign-in link. */
const SignInPage = (): ReactElement => (
  <FormPage title="Sign in" intro="No password. Use Google, or get a link by email.">
    <form action={startGoogleSignIn}>
      <GoogleSignInButton />
    </form>
    <SignInForm action={requestSignInLink} />
    <p>
      Your email is only used to sign in. It is never shown to other users. Any address
      works, including an alias. <Link href="/privacy">How we handle your data</Link>.
    </p>
  </FormPage>
);

export default SignInPage;
