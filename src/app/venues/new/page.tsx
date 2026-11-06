import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { FormFallback } from "@/features/forms/FormFallback";
import { FormPage } from "@/features/forms/FormPage";
import { NewVenue } from "@/features/venues/NewVenue";

export const metadata: Metadata = { title: "Add a venue · Peer Review" };

/**
 * Adds a venue. Not linked from the app yet: the night picker opens it in Milestone 3
 * ("Add a venue or collective").
 */
const NewVenuePage = (): ReactElement => (
  <FormPage
    title="Add a venue"
    intro="Add a club or other place where music nights happen. Check it is not on Peer Review already.">
    <Suspense fallback={<FormFallback fieldCount={6} />}>
      <NewVenue />
    </Suspense>
  </FormPage>
);

export default NewVenuePage;
