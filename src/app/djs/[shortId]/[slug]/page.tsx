import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { DetailsFallback } from "@/features/catalog/DetailsFallback";
import { DjDetails } from "@/features/djs/DjDetails";

export const metadata: Metadata = { title: "DJ · Peer Review" };

/** A DJ's page, at `/djs/<short_id>/<name>`. */
const DjPage = ({ params }: PageProps<"/djs/[shortId]/[slug]">): ReactElement => (
  <Suspense fallback={<DetailsFallback />}>
    <DjDetails params={params} />
  </Suspense>
);

export default DjPage;
