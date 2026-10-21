import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Peer Review",
  description:
    "Log a night, rate the sound, the venue and each DJ set, and follow people."
};

/** Root layout for every page. Fonts and the app shell arrive with the token file. */
const RootLayout = ({ children }: LayoutProps<"/">): ReactElement => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
