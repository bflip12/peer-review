import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { FormFallback } from "@/features/forms/FormFallback";
import { FormPage } from "@/features/forms/FormPage";
import { ProfileSetup } from "@/features/profiles/ProfileSetup";

export const metadata: Metadata = { title: "Pick a handle · Peer Review" };

/** After a new user's first sign-in: pick a handle and an optional display name. */
const WelcomePage = (): ReactElement => (
  <FormPage
    title="Pick a handle"
    intro="Your handle is how people find you. You can add a display name too.">
    <Suspense fallback={<FormFallback fieldCount={2} />}>
      <ProfileSetup />
    </Suspense>
  </FormPage>
);

export default WelcomePage;
