import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicy } from "./PrivacyPolicy";

describe("PrivacyPolicy", () => {
  it("links to account deletion and the contact address", () => {
    render(<PrivacyPolicy />);

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(screen.getByRole("link", { name: "hello@peerreview.club" })).toHaveAttribute(
      "href",
      "mailto:hello@peerreview.club"
    );
  });

  it("credits GeoNames with links to the site and the license", () => {
    render(<PrivacyPolicy />);

    expect(screen.getByRole("link", { name: "GeoNames" })).toHaveAttribute(
      "href",
      "https://www.geonames.org/"
    );
    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by/4.0/"
    );
  });

  it("lists venues, DJs, and edits, and who sees that they are yours", () => {
    render(<PrivacyPolicy />);

    const result = screen.getByText(
      /^Venues and DJs you add, and edits you make to them\./
    );

    expect(result).toHaveTextContent(
      "Who added one is seen only by you, and by locals and admins. Who edited it is seen only by locals and admins."
    );
  });

  it("has one heading per section under the page title", () => {
    render(<PrivacyPolicy />);

    const result = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

    expect(result).toEqual([
      "What we store",
      "Signing in with Google",
      "Cookies",
      "Services that handle your data",
      "Deleting your account",
      "City data",
      "Contact"
    ]);
  });
});
