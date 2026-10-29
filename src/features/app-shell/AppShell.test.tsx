import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("links the wordmark to the home page with a readable name", () => {
    render(<AppShell>Content</AppShell>);

    const result = screen.getByRole("link", { name: "PeerReview.club, home" });

    expect(result).toHaveAttribute("href", "/");
  });

  it("puts the wordmark in the page header", () => {
    render(<AppShell>Content</AppShell>);

    const result = screen.getByRole("banner");

    expect(result).toContainElement(
      screen.getByRole("link", { name: "PeerReview.club, home" })
    );
  });

  it("renders the page inside the main landmark", () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>
    );

    const result = screen.getByRole("main");

    expect(result).toHaveTextContent("Page content");
    expect(result).toHaveAttribute("id", "main");
  });

  it("starts with a skip link to the main content", () => {
    render(<AppShell>Content</AppShell>);

    const result = screen.getAllByRole("link");

    expect(result[0]).toHaveTextContent("Skip to content");
    expect(result[0]).toHaveAttribute("href", "#main");
  });

  it("renders an empty main when there is no page content", () => {
    render(<AppShell>{null}</AppShell>);

    const result = screen.getByRole("main");

    expect(result).toBeEmptyDOMElement();
  });
});
