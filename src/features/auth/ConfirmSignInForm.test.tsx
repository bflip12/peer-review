import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { FormActionT } from "./auth.types";
import { ConfirmSignInForm } from "./ConfirmSignInForm";

// Stands in for the confirmSignIn server action.
const mockAction = (result: ActionResultT) =>
  vi.fn<FormActionT>(() => Promise.resolve(result));

describe("ConfirmSignInForm", () => {
  it("sends the link's token hash and type when the user presses Continue", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(<ConfirmSignInForm tokenHash="abc123" action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({ tokenHash: "abc123", type: "email" });
  });

  it("does nothing until the button is pressed", () => {
    const action = mockAction({ ok: true, data: undefined });

    render(<ConfirmSignInForm tokenHash="abc123" action={action} />);

    expect(action).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains a used link and links to a new one", async () => {
    render(
      <ConfirmSignInForm
        tokenHash="abc123"
        action={mockAction({
          ok: false,
          message: "This sign-in link has expired or was already used. Ask for a new one."
        })}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sign-in link has expired or was already used. Ask for a new one."
    );
    expect(screen.getByRole("link", { name: "Get a new sign-in link" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
  });
});
