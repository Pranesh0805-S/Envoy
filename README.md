# Envoy — AI Gmail Workbench

Envoy is an agentic Gmail assistant that categorizes, summarizes, and helps manage your inbox — with an interactive floating avatar you can chat with, powered by Claude.

## What it does

- **Smart Digest** — fetches your inbox and uses Claude (Haiku) to categorize every email into Urgent, Important, Job/Career, Security, Newsletter/Promotional, Social, or Spam-like, with a confidence score and one-line reasoning for every decision.
- **Approval-Gated Actions** — Archive/Delete never happens automatically. Every action goes into a pending queue and requires explicit user approval before touching your real inbox.
- **Meeting Detection** — automatically detects meeting/event emails, extracts date & time, and creates real Google Calendar events (or lets you pick a date manually if none was detected).
- **Follow-Up Tracker** — flags sent emails that haven't received a reply after N days.
- **Unsubscribe Assistant** — detects newsletter/promo emails with unsubscribe links and surfaces them for one-click cleanup.
- **Floating Avatar** — a custom animated SVG avatar with contextual expressions (idle, thinking, alert, greet). Chat with it about your inbox, ask it to summarize, or have it draft email replies for you to review and send.
- **Light / Dark / System theming** with a full glass/spatial design system.

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS v4, Framer Motion, React Router
**Backend:** Node.js, Express
**Database/Auth:** Supabase (Postgres, Row Level Security, Google OAuth)
**AI:** Anthropic Claude API (Haiku 4.5)
**APIs:** Gmail API, Google Calendar API (via `googleapis`)

## Architecture

```
Frontend (React) → Backend (Express) → Gmail API / Calendar API
                                     → Claude API (categorization, chat, drafting)
                                     → Supabase (auth, user data, approval queue)
```

All destructive actions (delete/archive) pass through a `pending_actions` table and require explicit user approval before any Gmail API call executes — the AI never modifies the inbox unsupervised.

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project with Google OAuth configured (Gmail + Calendar scopes)
- A Google Cloud project with Gmail API + Calendar API enabled
- An Anthropic API key

### Setup

```bash
# Backend
cd backend
npm install
# create .env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID,
# GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL
npm run dev

# Frontend
cd frontend
npm install
# create .env with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

## Project Structure

```
envoy/
├── backend/
│   └── src/
│       ├── config/       # Supabase + Google API clients
│       ├── middleware/   # Auth verification
│       ├── routes/       # auth, mail, calendar, agent, actions
│       └── services/     # Gmail, Calendar, Claude agent logic
├── frontend/
│   └── src/
│       ├── components/   # avatar, mail cards, UI (sidebar, toast)
│       ├── hooks/        # useInboxData, useTheme
│       ├── lib/          # Supabase client, auth helpers
│       └── pages/        # Dashboard (main workbench)
└── extension/            # (planned) Chrome extension
```

## Screenshots

*(add 2-3 screenshots here — workbench with categorized tabs, the avatar chat panel with a draft, and the light/dark theme toggle)*

## Roadmap
- Chrome extension (inject avatar directly into Gmail)
- Multi-account support
- Export inbox to PDF/DOCX
