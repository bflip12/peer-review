import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("shows the app name as the only top-level heading", () => {
    render(<HomePage />);

    const result = screen.getAllByRole("heading", { level: 1 });

    expect(result.map((heading) => heading.textContent)).toEqual(["Peer Review"]);
  });

  it("says what the app does", () => {
    render(<HomePage />);

    const result = screen.getByText(
      "Log a night, rate the sound, the venue and each DJ set, and follow people."
    );

    expect(result).toBeInTheDocument();
  });
});
