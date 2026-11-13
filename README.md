# Embr

A daily companion app for people living with arthritis.

## Why

Hundreds of millions of people live with arthritis, but most of living with it happens at home, between short doctor visits, with little day-to-day support. Embr helps people track how they feel, plan their days around the illness, and get support when they need it.

Rheumatoid arthritis (RA) and osteoarthritis (OA) come first.

## What it does

- **Quick daily check-in:** pain, stiffness, fatigue and mood in a few taps, with big buttons that are easy on sore hands.
- **Calendar:** good days, bad days and flares at a glance, with "your patterns suggest" insights once enough days are logged.
- **Doctor visit report:** a one-page summary of recent symptoms and triggers, plus questions to ask.

## Vision

Embr aims to be more than a symptom log. Two things set it apart:

- **Personalized AI informant:** brings each person only the news, technology and products relevant to them, such as a new assistive device for sore hands, so they know what is out there and worth a look.
- **Community hub:** people with arthritis talk to each other, relate, and help each other cope.

Also planned:

- **Voice check-in:** speak instead of tapping. The AI fills in the check-in and the person confirms it.
- **Personalized exercise:** suggestions that fit how the person feels today, including nearby options such as pools and warm-water classes.
- **Group video calls** about living with arthritis.
- **Medical document upload:** reports and medication lists personalize the app. The person confirms every detail the AI reads.
- **Paid care tier:**
  - Advice from licensed physiotherapists and nurses by chat.
  - 1-on-1 video appointments with doctors through partner clinics.

  Care is offered region by region, because professionals must be licensed where the patient lives. It helps between visits and never replaces a person's own doctor.
 
#### Pitch: The only arthritis app where your daily check-ins make the news and the community personal to you.

## Safety and privacy

- Embr does not diagnose or change treatment.
- Red-flag symptoms always point to emergency services or a doctor.
- The AI answers only from content reviewed by health professionals, and says when it does not know.
- Personal health data is never sold or shared with advertisers.
- Each person can delete all of their data at any time.

## Status

Early development.

- [x] Public website
- [ ] Web app and API foundation (in progress)
- [ ] Accounts, daily check-in and calendar
- [ ] Voice check-in
- [ ] AI informant, community and exercise
- [ ] Paid care tier

## Tech stack

| Area | Technology |
| --- | --- |
| Web app | Next.js (React), TypeScript, Tailwind CSS, shadcn/ui |
| Mobile app (planned) | Expo (React Native) |
| Backend | FastAPI (Python), SQLAlchemy, Alembic |
| Database | PostgreSQL with pgvector |
| Sign-in | Clerk |
| Infrastructure | Docker, AWS, Terraform, GitHub Actions, Vercel |
| AI tooling | LangGraph, Langfuse |
| Repo tooling | pnpm workspaces, Turborepo |
| Design | Figma |

## Repo structure

```
apps/
  web/        Next.js web app (the product)
  website/    public website
  api/        FastAPI backend
packages/     shared code (coming later)
```

## Getting started

You need [Node.js](https://nodejs.org) 26, [pnpm](https://pnpm.io), [uv](https://docs.astral.sh/uv/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# Install dependencies
pnpm install

# Run the web app at http://localhost:3000
pnpm --filter @embr/web dev

# Run the API at http://localhost:8000 (interactive docs at /docs)
pnpm --filter @embr/api dev

# Run the public website at http://localhost:4173
python -m http.server 4173 --directory apps/website

# Check everything
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
