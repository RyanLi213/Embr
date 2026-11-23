# Notes

Ryan's thoughts and decisions, newest first.

## 2026-11-22: A nice screen for first-time visitors (to do)

Give people a nice screen the first time they visit Embr. Use the welcome page
we already have (`/welcome`) and work on making it nicer.

## 2026-11-22: Write a test for the Page helper (to do)

Write a unit test for `Page` in `apps/web/src/components/shell/page.tsx`, the
last uncovered line in the web app's coverage. It's uncovered because only the
home page uses it, and coverage skips pages; no unit test renders it directly.
Good first test to write myself.

## 2026-11-22: Check-in time of day (decided: built around the evening)

The daily check-in is not a morning check-in. Embr is built around an evening
check-in, so it can be accurate for the whole day, including "How was today
overall?". But we don't tell people directly to check in in the evening: the
app is just designed around it.

People should check in at the same time each day so their check-ins can be
compared, since pain can change through the day.

In the morning they can still open Embr to plan their day.

Still to discuss: when in their day people will actually open the app.

## 2026-11-18: "Overall" counts more (decided)

In the day colour, "How was today overall?" counts 1.5 times as much as the
other questions (chosen over 2: a bit heavier than the rest, not double).
