import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormNotice } from "./FormNotice";

describe("FormNotice", () => {
  it("shows the title and the message together", () => {
    render(<FormNotice title="Check your email">We sent a sign-in link.</FormNotice>);

    expect(screen.getByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("We sent a sign-in link.")).toBeInTheDocument();
  });
});
