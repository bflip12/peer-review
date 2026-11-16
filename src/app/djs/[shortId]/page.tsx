import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { DetailsFallback } from "@/features/catalog/DetailsFallback";
import { DjDetails } from "@/features/djs/DjDetails";

export const metadata: Metadata = { title: "DJ · Peer Review" };

/**
 * A DJ's short URL, `/djs/<short_id>`. Redirects to the full URL with the name, which
 * `DjDetails` does for any missing or outdated slug.
 */
const DjShortPage = ({ params }: PageProps<"/djs/[shortId]">): ReactElement => (
  <Suspense fallback={<DetailsFallback />}>
    <DjDetails params={params} />
  </Suspense>
);

export default DjShortPage;
