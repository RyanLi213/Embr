import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuestBanner } from "@/components/check-in/guest-banner";
import { CommunityLink } from "@/components/home/community-link";
import { clerkStillLoading, fakeClerk, signInAs } from "@/test/clerk";

import { AccountAvatar } from "./account-avatar";
import { CommunityScreen } from "./community-screen";
import { ProfileScreen } from "./profile-screen";

const heading = () => screen.getByRole("heading", { level: 1 });

describe("ProfileScreen", () => {
  it("invites guests to sign in", () => {
    render(<ProfileScreen />);

    expect(heading()).toHaveTextContent("Take Embr with you.");
    expect(screen.getByRole("link", { name: /Sign in to unlock/ })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("shows the signed-in person's name, email and phone", () => {
    signInAs({ fullName: "Alex Example", email: "alex@example.com", phone: "+15550100" });
    render(<ProfileScreen />);

    expect(heading()).toHaveTextContent("Alex Example");
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("+15550100")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Sign in/ })).not.toBeInTheDocument();
  });

  it("leaves out details the person hasn't given, and welcomes them without a name", () => {
    signInAs({ fullName: null, email: "sam@example.com", phone: null });
    render(<ProfileScreen />);

    expect(heading()).toHaveTextContent("Welcome to Embr");
    expect(screen.queryByText("Phone")).not.toBeInTheDocument();
  });

  it("signs out and goes home", () => {
    signInAs();
    render(<ProfileScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(fakeClerk.signOut).toHaveBeenCalledWith({ redirectUrl: "/" });
  });

  it("waits for Clerk instead of flashing the wrong page", () => {
    clerkStillLoading();
    const { container } = render(<ProfileScreen />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
  });
});

describe("CommunityScreen", () => {
  it("is locked for guests", () => {
    render(<CommunityScreen />);

    expect(screen.getByTestId("lock")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in to unlock/ })).toBeInTheDocument();
  });

  it("says it's coming soon once signed in, without a lock", () => {
    signInAs();
    render(<CommunityScreen />);

    expect(heading()).toHaveTextContent("You shouldn’t have to do this alone.");
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByTestId("lock")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to home/ })).toHaveAttribute("href", "/");
  });

  it("waits for Clerk instead of flashing the wrong page", () => {
    clerkStillLoading();
    render(<CommunityScreen />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});

describe("GuestBanner", () => {
  it("invites guests to make an account", () => {
    render(<GuestBanner />);

    expect(screen.getByText("Your check-ins are saved on this browser")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a free account" })).toBeInTheDocument();
  });

  it("doesn't ask signed-in people to make an account", () => {
    signInAs();
    render(<GuestBanner />);

    expect(screen.getByText("Your check-ins are still saved on this browser")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("AccountAvatar", () => {
  it("shows G for guests and the initial once signed in", () => {
    const { rerender } = render(<AccountAvatar />);
    expect(screen.getByRole("link", { name: "Open profile" })).toHaveTextContent("G");

    signInAs({ fullName: "Alex Example" });
    rerender(<AccountAvatar />);
    expect(screen.getByRole("link", { name: "Open profile" })).toHaveTextContent("A");
  });

  it("shows nothing while Clerk starts", () => {
    clerkStillLoading();
    render(<AccountAvatar />);

    expect(screen.getByRole("link", { name: "Open profile" })).toHaveTextContent("");
  });
});

describe("CommunityLink", () => {
  it("asks guests to sign in, and shows signed-in people what's coming", () => {
    const { rerender } = render(<CommunityLink />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/sign-in");

    signInAs();
    rerender(<CommunityLink />);
    expect(screen.getByRole("link", { name: /See what’s coming/ })).toHaveAttribute(
      "href",
      "/community",
    );
  });
});
