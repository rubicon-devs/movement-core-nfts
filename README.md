# Movement Core NFTs

A community-driven voting platform for selecting the top NFT collections on Movement blockchain. Each month, the Movement community submits and votes for their favorite NFT collections.

![Movement Core NFTs](public/logo.png)

## Features

- **Monthly Voting Cycles**: Submit collections, vote, view winners
- **Discord Authentication**: Login with Discord, role-based access control
- **Tradeport Integration**: Validates collections against Tradeport's verified list
- **Admin Dashboard**: Manage phases, calculate winners, export data, block users
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: Custom Discord OAuth with JWT sessions
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Discord Application (for OAuth)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/movement-core-nfts.git
   cd movement-core-nfts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Fill in your `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/movement_core"
   DISCORD_CLIENT_ID="your_discord_client_id"
   DISCORD_CLIENT_SECRET="your_discord_client_secret"
   DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/callback"
   JWT_SECRET="your_random_jwt_secret"
   REQUIRED_ROLE_ID="your_discord_role_id"
   ADMIN_DISCORD_IDS="discord_id_1,discord_id_2"
   ```

4. Set up the database:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Phase Schedule

| Phase | Timing | Duration | Description |
|-------|--------|----------|-------------|
| Submission | 8 days before end of month | 3 days | Users submit NFT collections |
| Voting | 5 days before end of month | 4 days | Users vote for their favorites (max 5 votes) |
| Display | Last day of month onwards | Until next submission | Top 15 winners are displayed |

**Example for a 31-day month:**
- Submission: Days 24-26
- Voting: Days 27-30
- Display: Day 31 through Day 23 of next month

Admins can override phases manually from the admin dashboard.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/        # Admin actions
│   │   ├── auth/         # Discord OAuth
│   │   ├── collections/  # Collection data
│   │   ├── phase/        # Phase info
│   │   ├── submissions/  # Submit collections
│   │   └── votes/        # Vote handling
│   ├── admin/            # Admin dashboard
│   └── page.tsx          # Home page
├── components/
│   ├── ClientPage.tsx    # Main voting UI
│   ├── Header.tsx        # Navigation
│   └── Providers.tsx     # Context providers
└── lib/
    ├── discord.ts        # Discord API helpers
    ├── phase.ts          # Phase calculation
    ├── prisma.ts         # Database client
    ├── session.ts        # JWT session handling
    └── tradeport.ts      # Tradeport API integration
```

## License

MIT