import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Landscape } from "./landscape";
import { Logo } from "./logo";
import { Mascot } from "./mascot";

describe("Logo", () => {
  it("is a link home, announced by the word people see", () => {
    render(<Logo />);

    expect(screen.getByRole("link", { name: "embr" })).toHaveAttribute("href", "/");
  });
});

describe("Mascot", () => {
  it("is hidden from screen readers when it only decorates the page", () => {
    const { container } = render(<Mascot />);

    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps the artwork's shape at any height", () => {
    render(<Mascot height={335} alt="Embr" />);

    const image = screen.getByRole("img", { name: "Embr" });
    expect(image).toHaveAttribute("height", "335");
    expect(image).toHaveAttribute("width", "198");
  });
});

describe("Landscape", () => {
  it("is decoration only, hidden from screen readers", () => {
    render(<Landscape className="inset-0" />);

    expect(screen.getByTestId("landscape")).toHaveAttribute("aria-hidden", "true");
  });
});
