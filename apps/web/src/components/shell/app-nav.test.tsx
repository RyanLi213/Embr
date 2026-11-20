import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BottomNav, isCurrent, Sidebar } from "./app-nav";

// Pretend the browser is showing a chosen page
const browser = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => browser.pathname }));

describe("isCurrent", () => {
  it("treats Home as current only on the home page", () => {
    expect(isCurrent("/", "/")).toBe(true);
    expect(isCurrent("/calendar", "/")).toBe(false);
  });

  it("treats a page and the pages inside it as current", () => {
    expect(isCurrent("/calendar", "/calendar")).toBe(true);
    expect(isCurrent("/calendar/2026-11", "/calendar")).toBe(true);
    expect(isCurrent("/calendars", "/calendar")).toBe(false);
  });
});

describe("Sidebar", () => {
  beforeEach(() => {
    browser.pathname = "/calendar";
  });

  it("links to every page and marks the one being shown", () => {
    render(<Sidebar />);
    const menu = screen.getByRole("navigation", { name: "Main" });

    const hrefs = within(menu)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/check-in", "/calendar", "/community", "/profile"]);
    expect(within(menu).getByRole("link", { current: "page" })).toHaveTextContent("Calendar");
  });

  it("tells screen reader users that Community needs an account", () => {
    render(<Sidebar />);

    expect(
      screen.getByRole("link", { name: "Community (needs an account)" }),
    ).toBeInTheDocument();
  });

  it("shows that the visitor is a guest, with a link to the profile", () => {
    render(<Sidebar />);

    expect(screen.getByText("Saved in this browser")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open profile" })).toHaveAttribute("href", "/profile");
  });
});

describe("BottomNav", () => {
  it("marks the page being shown", () => {
    browser.pathname = "/";
    render(<BottomNav />);

    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Home");
  });
});
