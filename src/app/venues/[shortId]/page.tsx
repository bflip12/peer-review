import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { DetailsFallback } from "@/features/catalog/DetailsFallback";
import { VenueDetails } from "@/features/venues/VenueDetails";

export const metadata: Metadata = { title: "Venue · Peer Review" };

/**
 * A venue's short URL, `/venues/<short_id>`. Redirects to the full URL with the name and
 * city, which `VenueDetails` does for any missing or outdated slug.
 */
const VenueShortPage = ({ params }: PageProps<"/venues/[shortId]">): ReactElement => (
  <Suspense fallback={<DetailsFallback />}>
    <VenueDetails params={params} />
  </Suspense>
);

export default VenueShortPage;
