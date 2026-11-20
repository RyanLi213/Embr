import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComingSoon } from "./coming-soon";

const PROPS = {
  eyebrow: "Coming soon",
  title: "Your calendar is on its way.",
  body: "Each day will show as good, okay or hard.",
  action: { href: "/", label: "Back to home" },
};

describe("ComingSoon", () => {
  it("shows the message as the page's main heading, with a way onward", () => {
    render(<ComingSoon {...PROPS} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(PROPS.title);
    expect(screen.getByText(PROPS.body)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("shows no lock and no note unless asked", () => {
    render(<ComingSoon {...PROPS} />);

    expect(screen.queryByTestId("lock")).not.toBeInTheDocument();
  });

  it("shows a lock and a note for features that need an account", () => {
    render(<ComingSoon {...PROPS} locked note="Free to join." />);

    expect(screen.getByTestId("lock")).toBeInTheDocument();
    expect(screen.getByText("Free to join.")).toBeInTheDocument();
  });
});
