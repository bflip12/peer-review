import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { DetailsFallback } from "@/features/catalog/DetailsFallback";
import { VenueDetails } from "@/features/venues/VenueDetails";

export const metadata: Metadata = { title: "Venue · Peer Review" };

/** A venue's page, at `/venues/<short_id>/<name-city>`. */
const VenuePage = ({ params }: PageProps<"/venues/[shortId]/[slug]">): ReactElement => (
  <Suspense fallback={<DetailsFallback />}>
    <VenueDetails params={params} />
  </Suspense>
);

export default VenuePage;
