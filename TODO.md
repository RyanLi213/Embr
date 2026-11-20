# To do

Active tasks only. Finished tasks move to `DONE.md`.

- [ ] Discuss the grand vision with Lisa and Leo

## Milestone 2: screens from the Figma design (agreed 2026-11-18)

Web app only (`apps/web`). Each branch is merged into `main` through a pull
request once CI passes.

- [ ] `feature/home-screen`: theme, logo, mascot, landscape, app shell, welcome
  and home screens, locked pages, tests
- [ ] Put the web app online right after `feature/home-screen` merges: a second
  Vercel project with root directory `apps/web`. The API stays on the laptop
  until accounts need it.
- [ ] `feature/guest-check-in`: check-in flow saved in the browser, home "done"
  state and week strip. Ryan writes the check-in tests first (test-first),
  with teaching.
- [ ] `feature/calendar`: month calendar from real check-ins, with day details
- [ ] Swap in the new mascot once the team finishes it (the website artwork is
  a placeholder until then)

## Check-in (agreed 2026-11-18)

Five questions, each answered 1 to 5: pain, stiffness, fatigue, mood, and "How
was today overall?" Then "Is today a flare day?" (yes or no) and an optional
note (up to 240 characters).

Day colour on the calendar:

1. Turn each answer into a 1 to 5 "how good" score. Pain, stiffness and fatigue
   are flipped (6 minus the answer); mood and overall stay as they are.
2. Take a weighted average: overall counts 1.5 times, the other four once each.
3. 3.5 or higher is Good, 2.5 up to 3.5 is Okay, below 2.5 is Hard.
4. A flare day shows as Flare, whatever the score.

## Later

- [ ] Build our own authentication to replace Clerk, once Embr has real users.
  Until then, Clerk handles sign-in, and the API keeps its own `users` table
  and a single login-check module, so the swap stays small.

## Guests and accounts (agreed 2026-11-14)

Embr never forces sign-up. The home page welcomes everyone and the core app
works without an account. Guests get a limited version, so signing up is
rewarded, not required.

| | Guest | Signed in |
| --- | --- | --- |
| Check-in and calendar | Saved in this browser only | Saved to the account, synced across phone and computer |
| Personalization | Basic: a short survey | Better over time: survey, check-in history and uploaded medical documents |
| Community and chat | No | Yes |

- Guests see a banner on the check-in and calendar screens: "You're not signed
  in, so your check-ins are saved only in this browser. You'll lose them if you
  clear your browsing data, use a private window, or switch devices. Create a
  free account to keep them safe."
- When a guest signs up, their past check-ins move into the new account, so
  nothing is lost.

## Grand vision (draft, to discuss with Lisa and Leo)

Goal: more than a check-in app, which people barely use. Two things set Embr apart:

1. **Personalized AI informant.** Brings each user only the news, technology and
   products relevant to them (for example, new assistive devices for hands), so
   they know what is out there and worth a look.
2. **Community hub.** People with RA talk to each other, relate and help each
   other cope. Gives people a reason to open the app every day.

Also planned:

- **Voice check-in.** Speak instead of tapping, for sore hands. The AI fills in
  the check-in and the user confirms it.
- **Exercise suggestions.** Personalized to the day's check-in, including nearby
  options such as pools and warm-water classes.
- **Group video calls** about living with arthritis.
- **Paid tier: online advice from licensed professionals** (physios and nurses,
  doctors later through a partner) for people who can't easily reach their
  doctor. Helps between visits; does not replace the rheumatologist.
- **Upload medical documents** (reports, test results, medication lists) to
  personalize the app. The AI reads them and the user confirms the details.
  Used for personalization only, never to interpret results. Top safety and
  privacy priority: encrypted, minimal, deletable, clear consent.
- **No diet advice.**
- **Moderation** of the community: later.
