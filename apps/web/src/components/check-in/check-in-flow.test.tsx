import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "@/lib/check-in";
import { loadCheckIns } from "@/lib/store-load-check-in";

import { CheckInFlow } from "./check-in-flow";

const DATE = "2026-11-22";

const pick = (answer: string) => fireEvent.click(screen.getByRole("radio", { name: answer }));
const continueButton = () => screen.getByRole("button", { name: /Continue/ });
const heading = () => screen.getByRole("heading", { level: 1 });

/** Answers every question, ending on the note */
function answerEverything() {
  for (const answer of ["A whisper", "A little tight", "Burning bright", "Light", "A good day", "No"]) {
    pick(answer);
    fireEvent.click(continueButton());
  }
}

describe("CheckInFlow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts on the first question with nothing picked, and Continue off", () => {
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);

    expect(heading()).toHaveTextContent("How is your pain today?");
    expect(screen.getByText("Question 1 of 6")).toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
    expect(continueButton()).toBeDisabled();
  });

  it("turns Continue on once an answer is picked", () => {
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);

    pick("A whisper");
    expect(screen.getByRole("radio", { name: "A whisper" })).toBeChecked();
    expect(continueButton()).toBeEnabled();
  });

  it("moves focus to each new question, so screen readers read it out", () => {
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);

    pick("A whisper");
    fireEvent.click(continueButton());
    expect(heading()).toHaveTextContent("How stiff do you feel?");
    expect(heading()).toHaveFocus();
  });

  it("keeps the answers when going back", () => {
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);

    pick("A whisper");
    fireEvent.click(continueButton());
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));

    expect(heading()).toHaveTextContent("How is your pain today?");
    expect(screen.getByRole("radio", { name: "A whisper" })).toBeChecked();
  });

  it("asks about a flare after the five questions, then for a note", () => {
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);

    for (const answer of ["A whisper", "A little tight", "Burning bright", "Light", "A good day"]) {
      pick(answer);
      fireEvent.click(continueButton());
    }
    expect(heading()).toHaveTextContent("Is today a flare day?");
    expect(screen.getByText("Question 6 of 6")).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();

    pick("No");
    fireEvent.click(continueButton());
    expect(heading()).toHaveTextContent("Anything else you want to remember?");
    expect(screen.getByText("One last thing")).toBeInTheDocument();
  });

  it("saves every answer when finished", () => {
    const onSaved = vi.fn();
    render(<CheckInFlow date={DATE} onSaved={onSaved} />);

    answerEverything();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Took a gentle walk" } });
    fireEvent.click(screen.getByRole("button", { name: /Finish check-in/ }));

    expect(loadCheckIns()[DATE]).toEqual({
      date: DATE,
      pain: 2,
      stiffness: 2,
      energy: 4,
      mood: 4,
      overall: 4,
      flare: false,
      note: "Took a gentle walk",
    });
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("stops the note at 240 characters", () => {
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);
    answerEverything();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "a".repeat(300) } });
    expect(screen.getByRole("textbox")).toHaveValue("a".repeat(240));
    expect(screen.getByText("240/240")).toBeInTheDocument();
  });

  it("explains and keeps the answers when the browser won't save", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage is blocked");
    });
    const onSaved = vi.fn();
    render(<CheckInFlow date={DATE} onSaved={onSaved} />);

    answerEverything();
    fireEvent.click(screen.getByRole("button", { name: /Finish check-in/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn’t save your check-in");
    expect(onSaved).not.toHaveBeenCalled();
    expect(heading()).toHaveTextContent("Anything else you want to remember?");
  });

  it("starts with the saved answers when changing them", () => {
    const saved: CheckIn = {
      date: DATE,
      pain: 4,
      stiffness: 2,
      energy: 4,
      mood: 4,
      overall: 4,
      flare: true,
      note: "Busy day",
    };
    render(<CheckInFlow date={DATE} initial={saved} onSaved={vi.fn()} onExit={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Loud" })).toBeChecked();
    expect(continueButton()).toBeEnabled();
  });

  it("goes home from the first question, or back where it came from when changing answers", () => {
    const { unmount } = render(<CheckInFlow date={DATE} onSaved={vi.fn()} />);
    expect(screen.getByRole("link", { name: /Back/ })).toHaveAttribute("href", "/");
    unmount();

    const onExit = vi.fn();
    render(<CheckInFlow date={DATE} onSaved={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
