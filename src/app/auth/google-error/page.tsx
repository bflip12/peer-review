import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Sign in · Peer Review" };

/**
 * Where Google sign-in ends when it does not finish: cancelled at Google, or a callback
 * opened twice or in another browser. Static, since the reason is not shown.
 */
const GoogleErrorPage = (): ReactElement => (
  <FormPage title="Google sign-in did not finish">
    <p>You may have cancelled it, or the sign-in started in another browser.</p>
    <p>
      <Link href="/sign-in">Try again</Link>
    </p>
  </FormPage>
);

export default GoogleErrorPage;
