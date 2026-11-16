import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { EditDj } from "@/features/djs/EditDj";
import { FormFallback } from "@/features/forms/FormFallback";
import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Edit DJ · Peer Review" };

/** Edits a DJ's name, where they're based, and links, for whoever may edit them. */
const EditDjPage = ({ params }: PageProps<"/djs/[shortId]/edit">): ReactElement => (
  <FormPage title="Edit DJ">
    <Suspense fallback={<FormFallback fieldCount={7} />}>
      <EditDj params={params} />
    </Suspense>
  </FormPage>
);

export default EditDjPage;
