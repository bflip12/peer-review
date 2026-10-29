import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("labels the input and passes typed text to onValueChange", async () => {
    const handleValueChange = vi.fn();
    render(
      <TextField label="Email" name="email" value="" onValueChange={handleValueChange} />
    );

    await userEvent.type(screen.getByLabelText("Email"), "a");

    expect(handleValueChange).toHaveBeenCalledWith("a");
  });

  it("links help text to the input", () => {
    render(
      <TextField
        label="Handle"
        name="handle"
        value=""
        helpText="2 to 30 characters."
        onValueChange={vi.fn()}
      />
    );

    const result = screen.getByLabelText("Handle");

    expect(result).toHaveAccessibleDescription("2 to 30 characters.");
    expect(result).not.toHaveAttribute("aria-invalid");
  });

  it("marks the input invalid and adds the errors to its description", () => {
    render(
      <TextField
        label="Handle"
        name="handle"
        value="ab"
        helpText="2 to 30 characters."
        errors={["That handle is taken."]}
        onValueChange={vi.fn()}
      />
    );

    const result = screen.getByLabelText("Handle");

    expect(result).toHaveAttribute("aria-invalid", "true");
    expect(result).toHaveAccessibleDescription(
      "2 to 30 characters. That handle is taken."
    );
  });
});
