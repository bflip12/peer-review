import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormError } from "./FormError";

describe("FormError", () => {
  it("announces the message as an alert", () => {
    render(<FormError>The sign-in link could not be sent.</FormError>);

    const result = screen.getByRole("alert");

    expect(result).toHaveTextContent("The sign-in link could not be sent.");
  });

  it("keeps links in the message usable", () => {
    render(
      <FormError>
        This link expired. <a href="/sign-in">Get a new sign-in link</a>
      </FormError>
    );

    const result = screen.getByRole("link", { name: "Get a new sign-in link" });

    expect(screen.getByRole("alert")).toContainElement(result);
  });
});
