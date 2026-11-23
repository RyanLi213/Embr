import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clerkStillLoading, signInAs } from "@/test/clerk";

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

  it("shows the signed-in person, and unlocks Community", () => {
    signInAs({ fullName: "Alex Example" });
    render(<Sidebar />);

    expect(screen.getByText("Alex Example")).toBeInTheDocument();
    expect(screen.getByText("Signed in")).toBeInTheDocument();
    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Community" })).toBeInTheDocument();
  });

  it("shows the email when the signed-in person has no name", () => {
    signInAs({ fullName: null, email: "sam@example.com" });
    render(<Sidebar />);

    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
  });

  it("doesn't flash Guest while Clerk starts", () => {
    clerkStillLoading();
    render(<Sidebar />);

    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
    expect(screen.queryByText("Signed in")).not.toBeInTheDocument();
  });
});

describe("BottomNav", () => {
  it("marks the page being shown", () => {
    browser.pathname = "/";
    render(<BottomNav />);

    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Home");
  });
});
