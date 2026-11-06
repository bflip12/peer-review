import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";

import { VenueDetails } from "@/features/venues/VenueDetails";
import { VenueDetailsFallback } from "@/features/venues/VenueDetailsFallback";

export const metadata: Metadata = { title: "Venue · Peer Review" };

/** A venue's page, at `/venues/<short_id>/<name-city>`. */
const VenuePage = ({ params }: PageProps<"/venues/[shortId]/[slug]">): ReactElement => (
  <Suspense fallback={<VenueDetailsFallback />}>
    <VenueDetails params={params} />
  </Suspense>
);

export default VenuePage;
