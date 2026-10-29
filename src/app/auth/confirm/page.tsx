import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { ConfirmSignIn } from "@/features/auth/ConfirmSignIn";
import { FormFallback } from "@/features/forms/FormFallback";
import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Sign in · Peer Review" };

/** The page a sign-in link opens. Signing in waits for the button press. */
const ConfirmSignInPage = ({
  searchParams
}: PageProps<"/auth/confirm">): ReactElement => (
  <FormPage title="Sign in to Peer Review">
    <Suspense fallback={<FormFallback fieldCount={0} />}>
      <ConfirmSignIn searchParams={searchParams} />
    </Suspense>
  </FormPage>
);

export default ConfirmSignInPage;
