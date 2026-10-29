import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("submits the form it is in", () => {
    render(<SubmitButton>Send sign-in link</SubmitButton>);

    const result = screen.getByRole("button", { name: "Send sign-in link" });

    expect(result).toHaveAttribute("type", "submit");
    expect(result).toBeEnabled();
  });

  it("is disabled while the form's action runs", () => {
    render(<SubmitButton isPending>Send sign-in link</SubmitButton>);

    const result = screen.getByRole("button", { name: "Send sign-in link" });

    expect(result).toBeDisabled();
  });
});
