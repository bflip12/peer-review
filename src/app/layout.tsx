import "@/styles/tokens.css";
import "@/styles/reset.css";

import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import type { ReactElement } from "react";

import { AppShell } from "@/features/app-shell/AppShell";
import { AccountNav } from "@/features/auth/AccountNav";

// Not a variable font, so each weight the style guide uses is listed.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Peer Review",
  description:
    "Log a night, rate the sound, the venue and each DJ set, and follow people."
};

/** Root layout for every page: tokens, reset, the font, and the app shell with the account area. */
const RootLayout = ({ children }: LayoutProps<"/">): ReactElement => (
  <html lang="en" className={plexMono.variable}>
    <body>
      <AppShell accountNav={<AccountNav />}>{children}</AppShell>
    </body>
  </html>
);

export default RootLayout;
