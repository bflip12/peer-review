import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormPage } from "./FormPage";

describe("FormPage", () => {
  it("shows the title as the page heading, then the intro and the form", () => {
    render(
      <FormPage title="Sign in" intro="We email you a link.">
        <button type="submit">Send</button>
      </FormPage>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sign in");
    expect(screen.getByText("We email you a link.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("leaves out the intro when there is none", () => {
    render(
      <FormPage title="Sign in">
        <button type="submit">Send</button>
      </FormPage>
    );

    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});
