# ClubConnect

Everything your sports club needs, in one place.

ClubConnect is a full-stack multi-sport club management application built with Next.js, Supabase, and TypeScript. It provides member management, team organisation, fixture scheduling, payment tracking, document storage, photo albums, and club announcements — all in a single, mobile-responsive platform.

## Screenshots

> Screenshots will be added once the application is deployed.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x | App Router framework |
| TypeScript | 5.x | Strict type safety |
| Supabase | Latest | PostgreSQL, Auth, Storage, RLS |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | UI component library |
| React Hook Form | 7.x | Form state management |
| Zod | 4.x | Schema validation |
| TanStack Table | 8.x | Data tables |
| date-fns | 4.x | Date utilities |
| nuqs | 2.x | URL search params state |
| Vitest | 4.x | Unit & component testing |
| React Testing Library | 16.x | Component test utilities |
| Lucide React | Latest | Icons |

## Features

- **Authentication** — Email/password and Google OAuth sign-in via Supabase Auth
- **Multi-sport support** — Configurable sport types with sport-specific labels (positions, scoring, etc.)
- **Member Management** — Full member directory, profiles, CSV import/export, status tracking
- **Team Management** — Create teams, manage rosters, assign captains, track positions
- **Fixture Scheduling** — List and calendar views, score entry, season/round tracking
- **Payments & Invoicing** — Create single or bulk invoices, track payment status, financial summaries
- **Document Library** — Upload and organise club documents with category filtering
- **Photo Albums** — Create albums, upload photos, lightbox gallery view
- **Announcements** — Post pinned and regular announcements to keep members informed
- **Organisation Settings** — Club branding, invite codes, admin controls
- **Role-based Access** — Admin, Manager, Coach, Player, Member, Guardian roles with RLS policies
- **Mobile Responsive** — Bottom tab navigation, responsive layouts throughout
- **Mobile App Ready** — Decoupled service layer architecture for future React Native companion app

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A Supabase account ([supabase.com](https://supabase.com))

### Clone and Install

```bash
git clone https://github.com/bradflavel/sports-club-app.git
cd sports-club-app
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |
| `NEXT_PUBLIC_SUPABASE_STORAGE_URL` | Your Supabase storage URL (`{project_url}/storage/v1`) |
| `NEXT_PUBLIC_APP_URL` | Application URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | Application display name (default: `ClubConnect`) |

### Database Setup

1. Create a new Supabase project
2. Run the migration files in order from `supabase/migrations/`:
   - Apply them via the Supabase SQL editor or using the Supabase CLI
   - Migrations are numbered `00001` through `00012` and must be run in order
3. Create two storage buckets in Supabase: `documents` and `photos`
4. (Optional) Configure Google OAuth in Supabase Auth settings
5. (Optional) Run `00012_seed_data.sql` after creating test auth.users entries

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

This project uses a **feature-based folder structure**:

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── shared/       # Reusable app components (DataTable, PageHeader, etc.)
│   └── layouts/      # Sidebar, TopBar, MobileNav
├── features/         # Feature modules
│   ├── auth/         # Authentication (login, signup, OAuth)
│   ├── members/      # Member management
│   ├── teams/        # Team and roster management
│   ├── fixtures/     # Match scheduling and results
│   ├── payments/     # Invoicing and payment tracking
│   ├── documents/    # Document library
│   ├── photos/       # Photo albums and gallery
│   ├── announcements/# Club announcements
│   ├── organisations/# Org settings and onboarding
│   └── dashboard/    # Dashboard widgets
├── hooks/            # Custom React hooks
├── lib/
│   ├── supabase/     # Supabase client setup and types
│   ├── utils.ts      # Utility functions
│   ├── format.ts     # Currency and date formatting
│   └── constants.ts  # Sport configs and enum options
└── types/            # Global TypeScript types
```

Each feature module contains:
- `components/` — React components (UI layer)
- `services/` — Data access functions (Supabase queries)
- `schemas/` — Zod validation schemas
- `types/` — TypeScript type definitions

**Architecture rule:** Components never call Supabase directly — all data access goes through the service layer. This ensures the codebase is ready for a future React Native companion app.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm format` | Format code with Prettier |

## Sport Configuration

Sports are configured in `src/lib/constants.ts`. Each sport type defines:

- `matchLabel` — What to call a match (Match, Game, Fixture)
- `periodLabel` — Period names (Half, Quarter, Innings, Set)
- `scoreLabel` — Score unit (Points, Goals, Runs, Tries)
- `positionLabels` — Available playing positions
- `defaultMaxPlayers` — Default squad size

Supported sports: Rugby League, Rugby Union, Cricket, Soccer, Netball, Basketball, Hockey, AFL, Touch Football, Volleyball, and Other.

To add a new sport, add an entry to the `SPORT_CONFIGS` object and add the value to the `sport_type` enum in both the database and TypeScript types.

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
3. Ensure all checks pass: `pnpm type-check && pnpm lint && pnpm test:run`
4. Submit a pull request

## License

MIT
