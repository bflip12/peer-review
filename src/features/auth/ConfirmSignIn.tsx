import Link from "next/link";
import type { ReactElement } from "react";

import { confirmSignIn } from "./actions/confirmSignIn";
import { ConfirmSignInForm } from "./ConfirmSignInForm";
import { getTokenHashParam } from "./utils/getTokenHashParam";

export type ConfirmSignInPropsT = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The body of the page a sign-in link opens: the "Sign in" button, or a way to get a new
 * link when this one is cut off. Reads the query, so it renders inside `<Suspense>`.
 */
export const ConfirmSignIn = async ({
  searchParams
}: ConfirmSignInPropsT): Promise<ReactElement> => {
  const tokenHash = getTokenHashParam(await searchParams);
  if (!tokenHash) {
    return (
      <p>
        This sign-in link is incomplete. Open the whole link from the email, or{" "}
        <Link href="/sign-in">get a new sign-in link</Link>.
      </p>
    );
  }
  return <ConfirmSignInForm tokenHash={tokenHash} action={confirmSignIn} />;
};
