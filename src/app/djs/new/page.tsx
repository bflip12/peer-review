import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { NewDj } from "@/features/djs/NewDj";
import { FormFallback } from "@/features/forms/FormFallback";
import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Add a DJ · Peer Review" };

/**
 * Adds a DJ. Not linked from the app yet: the lineup on the log form opens it in
 * Milestone 3.
 */
const NewDjPage = (): ReactElement => (
  <FormPage
    title="Add a DJ"
    intro="Add a DJ or live act. Check they are not on Peer Review already.">
    <Suspense fallback={<FormFallback fieldCount={7} />}>
      <NewDj />
    </Suspense>
  </FormPage>
);

export default NewDjPage;
