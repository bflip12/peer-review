import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Account deleted · Peer Review" };

/** Where deleting an account ends. Static: the user is already signed out. */
const AccountDeletedPage = (): ReactElement => (
  <FormPage title="Your account is deleted">
    <p>Your profile is gone and this browser is signed out.</p>
    <p>
      <Link href="/">Go to the home page</Link>
    </p>
  </FormPage>
);

export default AccountDeletedPage;
