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

  it("has one heading per section under the page title", () => {
    render(<PrivacyPolicy />);

    const result = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

    expect(result).toEqual([
      "What we store",
      "Signing in with Google",
      "Cookies",
      "Services that handle your data",
      "Deleting your account",
      "Contact"
    ]);
  });
});
