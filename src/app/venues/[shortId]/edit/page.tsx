import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { FormFallback } from "@/features/forms/FormFallback";
import { FormPage } from "@/features/forms/FormPage";
import { EditVenue } from "@/features/venues/EditVenue";

export const metadata: Metadata = { title: "Edit venue · Peer Review" };

/** Edits a venue's name, city, links, and sound systems, for whoever may edit it. */
const EditVenuePage = ({ params }: PageProps<"/venues/[shortId]/edit">): ReactElement => (
  <FormPage title="Edit venue">
    <Suspense fallback={<FormFallback fieldCount={6} />}>
      <EditVenue params={params} />
    </Suspense>
  </FormPage>
);

export default EditVenuePage;
