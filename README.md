# Movement Core NFTs

A community-driven voting platform for selecting the top NFT collections on Movement blockchain. Each month, the Movement community submits and votes for their favorite NFT collections.

![Movement Core NFTs](public/logo.png)

## Features

### Voting System
- **Monthly voting cycles** with three phases:
  - **Submission Phase** (3 days): Users submit NFT collections for consideration
  - **Voting Phase** (4 days): Community votes on submitted collections (max 5 votes per user)
  - **Display Phase** (~23 days): Winners are announced and displayed
- **Vote toggling**: Users can add/remove votes until voting closes
- **Hidden vote counts**: Vote tallies are hidden during voting to prevent bandwagon effects; only revealed when winners are announced
- **Role-gated voting**: Requires specific Discord role to participate

### User Features
- **Discord OAuth authentication**
- **One submission per user per month**
- **Real-time phase countdown timer**
- **Collection search and filtering**
- **Voting history page** with chart and table views

### Admin Features
- **Admin dashboard** (`/admin`)
- **Phase override controls** (force submission/voting/display phase)
- **View live vote counts** during voting phase (hidden from regular users)
- **Calculate and publish winners**
- **Manage submissions** (delete individual submissions)
- **Block/unblock users**
- **Data management** (clear submissions, votes, winners by month)
- **Export winners data**

### History Page
- **Chart view**: Line graph showing vote trends over time
- **Table view**: Monthly rankings with vote counts and changes
- **Filter options**: View top 5, 10, or 15 collections
- **Interactive legend**: Show/hide individual collections on chart

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom Discord OAuth with JWT sessions
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Chart.js / react-chartjs-2
- **Hosting**: Vercel
- **Database Hosting**: Supabase

## Phase Schedule

Phases are calculated dynamically based on the current month's length:

| Phase | Timing | Duration |
|-------|--------|----------|
| Submission | 8 days before month end | 3 days |
| Voting | 5 days before month end | 4 days |
| Display | Last day of month → next submission | ~23 days |

**Example for a 31-day month:**
- Submission: Days 24-26
- Voting: Days 27-30
- Display: Day 31 + next month until day 23

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)
- Discord application with OAuth2 configured

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/movement-core-collections.git
   cd movement-core-collections
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. **Configure the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Discord OAuth
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
DISCORD_REDIRECT_URI="https://your-domain.com/api/auth/callback"
DISCORD_GUILD_ID="your_discord_server_id"

# Authentication
JWT_SECRET="your_jwt_secret_min_32_chars"

# Access Control
REQUIRED_ROLE_ID="discord_role_id_for_voting"
ADMIN_DISCORD_IDS="discord_id_1,discord_id_2"
```

## Discord Setup

1. Create a Discord application at https://discord.com/developers/applications
2. Go to **OAuth2** → **General**
3. Add redirect URL: `https://your-domain.com/api/auth/callback`
4. Copy Client ID and Client Secret to your environment variables
5. Enable the **Server Members Intent** under **Bot** settings (if using role checking)

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel's settings
4. Set `DISCORD_REDIRECT_URI` to your Vercel URL
5. Add the Vercel callback URL to Discord OAuth2 redirects
6. Deploy!

### Optional: Password Protection

To add a site-wide password (useful for beta testing):

1. Add `SITE_PASSWORD` environment variable in Vercel
2. Deploy the middleware and password page (see `/src/middleware.ts`)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Discord OAuth endpoints
│   │   ├── collections/    # Collection CRUD
│   │   ├── phase/          # Phase information
│   │   ├── votes/          # Voting endpoints
│   │   ├── winners/        # Public winners endpoint
│   │   ├── history/        # Historical voting data
│   │   ├── admin/          # Admin actions
│   │   └── submit/         # Collection submission
│   ├── admin/              # Admin dashboard page
│   ├── history/            # Voting history page
│   └── page.tsx            # Main voting page
├── components/
│   ├── ClientPage.tsx      # Main client component
│   └── Header.tsx          # Navigation header
├── lib/
│   ├── discord.ts          # Discord OAuth utilities
│   ├── phase.ts            # Phase calculation logic
│   ├── prisma.ts           # Prisma client
│   └── session.ts          # JWT session management
└── middleware.ts           # Optional password protection
```

## License

MIT License