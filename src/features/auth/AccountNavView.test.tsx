import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountNavView } from "./AccountNavView";

// Stands in for the signOut server action.
const mockSignOut = vi.fn(() => Promise.resolve());

describe("AccountNavView", () => {
  it("links to the sign-in page when signed out, with no sign-out button", () => {
    render(<AccountNavView state={{ kind: "signedOut" }} signOutAction={mockSignOut} />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("links to the welcome page when the user has no handle yet", () => {
    render(
      <AccountNavView state={{ kind: "needsProfile" }} signOutAction={mockSignOut} />
    );

    expect(screen.getByRole("link", { name: "Pick a handle" })).toHaveAttribute(
      "href",
      "/welcome"
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("shows the handle and a sign-out button when signed in", () => {
    render(
      <AccountNavView
        state={{ kind: "active", handle: "dj_rush" }}
        signOutAction={mockSignOut}
      />
    );

    expect(screen.getByText("@dj_rush")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("says the account is banned, with a sign-out button", () => {
    render(<AccountNavView state={{ kind: "banned" }} signOutAction={mockSignOut} />);

    expect(screen.getByText("This account is banned.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
