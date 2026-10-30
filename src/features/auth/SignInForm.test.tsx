import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { FormActionT } from "./auth.types";
import { SignInForm } from "./SignInForm";

// Stands in for the requestSignInLink server action.
const mockAction = (result: ActionResultT) =>
  vi.fn<FormActionT>(() => Promise.resolve(result));

const submitEmail = async (email: string): Promise<void> => {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.click(screen.getByRole("button", { name: "Send sign-in link" }));
};

describe("SignInForm", () => {
  it("sends the typed address to the action", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(<SignInForm action={action} />);

    await submitEmail("dj@example.com");

    const formData = action.mock.calls[0][1];
    expect(formData.get("email")).toBe("dj@example.com");
  });

  it("says to check the inbox once the link is sent", async () => {
    render(<SignInForm action={mockAction({ ok: true, data: undefined })} />);

    await submitEmail("dj@example.com");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your emailWe sent a sign-in link to dj@example.com. Open it on this or any other device."
    );
  });

  it("keeps naming the address the link went to while the field is edited", async () => {
    render(<SignInForm action={mockAction({ ok: true, data: undefined })} />);
    await submitEmail("dj@example.com");
    await screen.findByText("Check your email");

    await userEvent.type(screen.getByLabelText("Email"), "x");

    expect(screen.getByRole("status")).toHaveTextContent(
      "We sent a sign-in link to dj@example.com."
    );
  });

  it("shows an address error on the field and keeps what was typed", async () => {
    render(
      <SignInForm
        action={mockAction({
          ok: false,
          message: "Check the email address.",
          fieldErrors: { email: ["Enter an email address, like name@example.com."] }
        })}
      />
    );

    await submitEmail("dj");

    const field = screen.getByLabelText("Email");
    expect(
      await screen.findByText("Enter an email address, like name@example.com.")
    ).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveValue("dj");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a failure that is not about the field as an alert", async () => {
    render(
      <SignInForm
        action={mockAction({
          ok: false,
          message: "Too many sign-in emails were sent. Wait a minute, then try again."
        })}
      />
    );

    await submitEmail("dj@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many sign-in emails were sent. Wait a minute, then try again."
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
