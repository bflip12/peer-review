import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GoogleSignInButton } from "./GoogleSignInButton";

describe("GoogleSignInButton", () => {
  it("submits its form, which runs the Google sign-in action", async () => {
    const action = vi.fn(() => Promise.resolve());
    render(
      <form action={action}>
        <GoogleSignInButton />
      </form>
    );

    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(action).toHaveBeenCalledOnce();
  });
});
