# Co-Study Scheduler

A multi-tenant real-time scheduling tool where anyone can create a "room," get a shareable link, and let others book co-study sessions. All times auto-convert to the viewer's local timezone.

**Live:** [co-study-scheduler.vercel.app](https://co-study-scheduler.vercel.app)

## Demo

### Host: Creating a Room
<video src="https://github.com/deepakdeo/co-study-scheduler/raw/main/docs/demo/01-create-room.mp4" width="100%" autoplay loop muted playsinline></video>

### User: Booking a Session
<video src="https://github.com/deepakdeo/co-study-scheduler/raw/main/docs/demo/02-book-session.mp4" width="100%" autoplay loop muted playsinline></video>

## Why I Built This

I joined a closed group of fellow learners and wanted a way to meet new people in the community while staying productive. The idea was simple: instead of just chatting, why not share a focused study session together?

I create a room, share the link with the group, and members book whichever slot works for them. Everyone in the group can see who's booked which slot and which ones are still open. I share a Zoom link with each registrant via direct message -- though the tool also supports adding a common meeting link that gets emailed directly to registrants (if the host sets up email notifications with their own domain).

Feel free to use it as-is, fork it, or extend it however you like -- make it multi-dimensional for your own community.

## Features

- **No login required** -- create a room, share the link, and let people book
- **Automatic timezone conversion** -- times display in each viewer's local timezone
- **Real-time updates** -- bookings appear live for all viewers via Supabase Realtime
- **Admin dashboard** -- PIN-protected view with booking details and cancellation controls
- **Flexible scheduling** -- custom session durations (15 min to 8 hours), split or full-day windows
- **Booking management** -- users get a unique link to cancel/reschedule from any device
- **Email notifications** -- optional booking confirmations via Resend (requires setup)
- **Mobile responsive** -- stacked card layout on small screens, 5-column grid on desktop

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Database/Backend:** Supabase (PostgreSQL + Realtime + Edge Functions + Row Level Security)
- **Hosting:** Vercel
- **Email:** Resend (optional)
- **Routing:** react-router-dom v6
- **Timezone:** date-fns + date-fns-tz

## How It Works

1. **Create a Room** -- set your name, session duration, availability windows, timezone, and admin PIN
2. **Share Your Link** -- send the room URL to your study group
3. **Study Together** -- members book sessions in their own timezone

## Self-Hosting Guide

Want to run your own instance? Follow these steps:

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A [Resend](https://resend.com) account (optional, for email notifications)

### 1. Clone and install

```bash
git clone https://github.com/deepakdeo/co-study-scheduler.git
cd co-study-scheduler
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations in order:
   - `supabase/migrations/001_create_tables.sql`
   - `supabase/migrations/002_add_host_email.sql`
   - `supabase/migrations/003_fix_bookings_update_policy.sql`
   - `supabase/migrations/004_fix_bookings_policies.sql`
   - `supabase/migrations/005_make_meeting_link_optional.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables from your `.env`
4. Deploy

### 6. Email notifications (optional)

1. Create a [Resend](https://resend.com) account and get an API key
2. Install the Supabase CLI: `npm i -g supabase`
3. Link your project: `npx supabase link --project-ref YOUR_PROJECT_REF`
4. Set the secret: `npx supabase secrets set RESEND_API_KEY=your_resend_key`
5. Deploy the function: `npx supabase functions deploy notify-booking --no-verify-jwt`
6. To send emails to any address (not just your own), verify a custom domain in Resend

## Project Structure

```
src/
  components/    UI components (SlotGrid, BookingForm, Layout, etc.)
  pages/         Route pages (Home, CreateRoom, Room, Admin)
  hooks/         Custom hooks (useRoom, useBookings, useTimezone)
  lib/           Utilities (supabase client, slot generation, timezone, slugify)
supabase/
  migrations/    SQL schema migrations
  functions/     Edge Functions (notify-booking)
```

## License

MIT
