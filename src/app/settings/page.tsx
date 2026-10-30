import type { Metadata } from "next";
import type { ReactElement } from "react";

import { DeleteAccountSection } from "@/features/account/DeleteAccountSection";
import { FormPage } from "@/features/forms/FormPage";

export const metadata: Metadata = { title: "Settings · Peer Review" };

/** Account settings. For now, deleting the account. */
const SettingsPage = (): ReactElement => (
  <FormPage title="Settings">
    <DeleteAccountSection />
  </FormPage>
);

export default SettingsPage;
