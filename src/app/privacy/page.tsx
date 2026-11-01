import type { Metadata } from "next";
import type { ReactElement } from "react";

import { PrivacyPolicy } from "@/features/privacy/PrivacyPolicy";

export const metadata: Metadata = { title: "Privacy · Peer Review" };

/** What Peer Review stores and who handles it. Linked from the footer and sign-in. */
const PrivacyPage = (): ReactElement => <PrivacyPolicy />;

export default PrivacyPage;
