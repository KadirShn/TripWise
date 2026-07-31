# AGENTS.md — TripWise

## 1. Role and working mode

You are the senior engineer responsible for building **TripWise**, a production-quality Expo React Native application for Android first and iOS-compatible by design.

Work autonomously inside this repository. Inspect existing files before changing them. Prefer small, verifiable changes over large blind rewrites. Run linting and type checking after meaningful changes. Fix errors before declaring a task complete.

Do not merely describe code. Create and modify the files, install compatible packages, run checks, and leave the repository in a runnable state.

## 2. Product summary

TripWise is a group travel expense splitter and itinerary planner.

A user can:

- Create an account or continue in guest/demo mode.
- Create a trip with title, destination, dates, base currency, and optional budget.
- Add trip participants.
- Record shared expenses and specify who paid and how the cost is split.
- See each participant's balance and a simplified settlement plan.
- Build a day-by-day itinerary.
- Review trip budget progress and category totals.
- Use the core app with unreliable connectivity through local caching.

The primary language is Turkish. The codebase and identifiers must be English. The architecture must permit English localization later.

## 3. Product name and identifiers

- Display name: `TripWise`
- Suggested slug: `tripwise`
- Android package placeholder: `com.kadirshn.tripwise`
- Scheme: `tripwise`

Keep package identifiers in app configuration easy to change.

## 4. Current release scope

### Must ship in MVP

1. Onboarding
2. Email/password authentication with Supabase
3. Guest/demo mode using seeded local data
4. Trips list
5. Create/edit/delete trip
6. Trip dashboard
7. Participant management
8. Expense CRUD
9. Equal, exact-amount, and percentage split modes
10. Balance calculation and simplified debt settlement
11. Day-by-day itinerary CRUD
12. Budget progress and category summary
13. Settings, theme selection, sign out, and delete-account entry point
14. Loading, empty, error, and offline states
15. Turkish localization through a translation layer
16. Unit tests for all financial calculations
17. Supabase SQL migration including Row Level Security policies
18. Android-ready Expo/EAS configuration

### Explicitly deferred from MVP

Do not block the first release on these features:

- Live multi-user collaboration
- Push notifications
- QR invite scanning
- Receipt OCR
- Automatic exchange-rate API
- PDF/Excel export
- Paid subscriptions
- Advertising
- Production AI calls

Create clean extension points and backlog notes for these, but do not implement fake buttons that appear functional.

## 5. Technical stack

Use the versions selected by the current Expo SDK and install Expo packages with `npx expo install` whenever possible.

- Expo SDK 57 project template
- React Native
- TypeScript with strict mode
- Expo Router for file-based navigation
- Supabase for Auth and PostgreSQL
- TanStack Query for server state
- Zustand for minimal client/UI state only
- React Hook Form and Zod for forms and validation
- `expo-sqlite` or AsyncStorage-backed persistence for local cache, choosing the simplest stable option compatible with the current SDK
- `expo-secure-store` for sensitive local session-related values where appropriate
- `expo-localization` plus a lightweight i18n solution
- `date-fns` for date handling
- `@expo/vector-icons` for icons
- Jest and React Native Testing Library for tests
- ESLint and Prettier

Avoid adding a large UI framework unless it materially reduces complexity. Prefer reusable in-house components and React Native primitives.

Do not import React Navigation packages directly in application code when Expo Router provides the needed API.

## 6. Architecture

Use a feature-oriented structure similar to:

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
  (tabs)/
  trip/
    [tripId]/
src/
  components/
    ui/
  features/
    auth/
    trips/
    participants/
    expenses/
    balances/
    itinerary/
    settings/
  lib/
    supabase/
    query/
    storage/
    i18n/
  stores/
  theme/
  types/
  utils/
    money/
    settlement/
  constants/
supabase/
  migrations/
  seed.sql
assets/
```

Rules:

- Route files should remain thin.
- Business logic belongs in feature services, hooks, and pure utility functions.
- Financial calculations must be pure, deterministic, typed, and tested.
- Database types should be centralized.
- UI components must not directly contain raw Supabase queries.
- Avoid circular dependencies.
- Use path aliases such as `@/` if configured correctly.

## 7. Navigation

Use Expo Router.

Main flow:

- Splash/bootstrap route
- Onboarding route shown only on first launch
- Auth routes: sign in, sign up, forgot password
- Main tabs:
  - Trips
  - Activity/Overview
  - Settings
- Trip detail nested screens:
  - Dashboard
  - Expenses
  - New/edit expense
  - Participants
  - Balances and settlements
  - Itinerary
  - Trip settings

Protect authenticated routes. Guest mode must be clearly marked and remain local-only.

## 8. UI and design system

Build a polished modern travel-finance interface rather than a generic starter template.

Visual direction:

- Friendly, clean, trustworthy
- Rounded cards and controls
- Strong information hierarchy
- Comfortable spacing
- Accessible contrast
- Light and dark themes
- Primary accent: teal/emerald family
- Secondary travel accent: warm amber/coral used sparingly

Create reusable primitives:

- `Screen`
- `AppText`
- `Button`
- `IconButton`
- `TextField`
- `SelectField`
- `DateField`
- `Card`
- `Avatar`
- `Badge`
- `MoneyText`
- `ProgressBar`
- `EmptyState`
- `ErrorState`
- `OfflineBanner`
- `Skeleton`
- `BottomSheet` or modal abstraction only when required

Accessibility:

- Minimum touch target around 44x44
- Meaningful accessibility labels
- Dynamic text should not break core layouts
- Do not communicate status only by color

## 9. Data model

Create SQL migrations for these entities. Use UUID primary keys, timestamps, foreign keys, indexes, and sensible cascading behavior.

### profiles

- `id` references `auth.users.id`
- `display_name`
- `avatar_url`
- `default_currency`
- `created_at`
- `updated_at`

### trips

- `id`
- `owner_id`
- `title`
- `destination`
- `start_date`
- `end_date`
- `base_currency`
- `budget_amount` nullable
- `cover_emoji` or simple cover key
- `created_at`
- `updated_at`

### trip_members

- `id`
- `trip_id`
- `user_id` nullable for manually added participants
- `display_name`
- `email` nullable
- `role` (`owner`, `editor`, `viewer`)
- `created_at`

### expenses

- `id`
- `trip_id`
- `created_by`
- `paid_by_member_id`
- `title`
- `notes` nullable
- `category`
- `amount_minor` integer
- `currency`
- `exchange_rate_to_base` numeric default 1
- `expense_date`
- `split_method` (`equal`, `exact`, `percentage`)
- `created_at`
- `updated_at`

### expense_splits

- `id`
- `expense_id`
- `member_id`
- `share_minor`
- `percentage` nullable

### itinerary_items

- `id`
- `trip_id`
- `created_by`
- `title`
- `notes` nullable
- `location_name` nullable
- `starts_at`
- `ends_at` nullable
- `estimated_cost_minor` nullable
- `sort_order`
- `created_at`
- `updated_at`

### settlements

- `id`
- `trip_id`
- `from_member_id`
- `to_member_id`
- `amount_minor`
- `currency`
- `status` (`planned`, `paid`)
- `paid_at` nullable
- `created_at`

Money must be stored as integer minor units. Never use floating point for canonical monetary amounts.

## 10. Security and Supabase

- Enable Row Level Security on every user-owned table.
- A trip owner can fully manage the trip.
- Authenticated members may read trips they belong to.
- Write access should respect member role.
- Users may only update their own profile.
- Never place a service-role key in the mobile app.
- Use only Expo public environment variables for the Supabase URL and publishable/anon key.
- Commit `.env.example`, never real secrets.
- Validate input both in the client and through database constraints where practical.

Create a trigger to create a profile after signup if suitable.

## 11. Financial rules

### Money representation

- Use integer minor units (`amountMinor`).
- Provide format/parse helpers based on currency metadata.
- Handle zero-decimal currencies without hardcoding only TRY/USD/EUR.

### Equal split

Split the total among selected members. Allocate remainder minor units deterministically so all shares sum exactly to the original total.

### Exact split

Require entered member shares to equal the expense total exactly.

### Percentage split

Require percentages to total 100. Calculate minor-unit shares and allocate rounding remainder deterministically.

### Member balance

For each member:

`balance = amount_paid_in_base_currency - amount_owed_in_base_currency`

Positive means the member should receive money. Negative means the member owes money.

### Debt simplification

Implement a deterministic greedy settlement algorithm:

- Separate creditors and debtors.
- Match the largest remaining debtor with the largest creditor.
- Transfer the minimum absolute amount.
- Continue until balances are settled within one minor unit.

The sum of balances must remain zero. Include comprehensive unit tests covering odd remainders, one payer, multiple currencies after conversion, and zero-balance members.

## 12. Offline and cache behavior

The app must remain useful during temporary connectivity loss.

- Persist query cache locally.
- Show cached trips and trip details when offline.
- Clearly indicate offline state.
- For MVP, authenticated offline mutations may be queued only if implementation remains reliable; otherwise disable server mutations with a clear message and preserve form input locally.
- Guest mode is fully local.
- Never silently discard user-entered data.

## 13. Guest/demo mode

Guest mode is required so Play Store reviewers and users can explore immediately.

- Seed one realistic Turkish-language sample trip.
- Include 3 participants, several expenses, balances, and itinerary items.
- Guest data must be stored locally.
- Display a persistent but unobtrusive “Demo modu” badge.
- Provide a conversion path to sign up, but do not claim guest data sync exists unless implemented.

## 14. Localization

- All visible strings must come from translation files.
- Initial locale: Turkish (`tr`).
- Prepare an English (`en`) file with at least core navigation and shared UI strings, or a complete mirrored structure if practical.
- Use Turkish date and currency formatting where locale is Turkish.
- Avoid concatenating translated fragments.

## 15. Error handling and observability

- Add a root error boundary.
- Normalize Supabase errors into user-friendly Turkish messages.
- Never expose raw stack traces or keys in UI.
- Log development diagnostics only in development.
- Include retry actions for recoverable errors.

## 16. Forms and validation

Use React Hook Form with Zod schemas.

Validate:

- Required values
- Date ordering
- Positive monetary amounts
- Valid email formats
- Split totals
- Percentage totals
- Participant selection
- Currency code shape

Disable duplicate submissions and show field-level messages.

## 17. Testing requirements

At minimum include unit tests for:

- Money parsing and formatting
- Equal split with remainders
- Percentage split rounding
- Exact split validation
- Balance calculation
- Settlement simplification
- Date validation

Add a small number of component tests for critical forms or empty/error states.

Commands must succeed:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
```

Use a test configuration compatible with the selected Expo SDK.

## 18. Quality gates

Before marking the build complete:

1. Install dependencies without incompatible-version warnings that can be resolved.
2. Run `npx expo-doctor` and fix actionable issues.
3. Run lint, typecheck, and tests.
4. Confirm no secrets are committed.
5. Confirm all routes render without obvious placeholder screens.
6. Confirm Android configuration has package name, adaptive icon placeholders, permissions, and scheme.
7. Confirm no deferred feature is represented as working when it is not.
8. Update README with exact setup steps.

## 19. Environment variables

Create `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The app must detect missing variables and enter guest/demo mode with a helpful development message rather than crash.

## 20. README requirements

README must include:

- Product overview
- Screens/features
- Stack
- Prerequisites
- Local setup for Windows 11
- Supabase project setup
- Applying SQL migrations
- Environment variables
- Running Android with Expo Go or development build
- Lint/typecheck/test commands
- EAS build commands
- Known MVP limitations
- Privacy and account deletion implementation notes

## 21. Git and delivery behavior

- Do not rewrite unrelated user changes.
- Keep changes cohesive.
- Do not commit generated secrets or build artifacts.
- Add useful comments only where logic is non-obvious.
- Avoid `any`; use `unknown` and narrow it.
- Avoid leaving TODOs for core MVP requirements.
- Deferred features may be listed in `BACKLOG.md`.

## 22. Implementation sequence

Follow this order unless the repository already contains working pieces:

1. Inspect repository and report current state.
2. Scaffold or normalize Expo SDK 57 TypeScript project.
3. Configure Expo Router, strict TypeScript, lint, formatting, tests, and app config.
4. Build theme, design primitives, i18n, and root providers.
5. Build local demo data and guest flow.
6. Build auth and Supabase client.
7. Add SQL migration and typed data access layer.
8. Build trips and participants.
9. Build expenses and split logic with tests.
10. Build balances and settlement UI.
11. Build itinerary and budget summary.
12. Add offline/error/empty states.
13. Polish accessibility and Android behavior.
14. Run all quality gates and update documentation.

## 23. Definition of done

The MVP is done only when a developer can clone the repository, install dependencies, add Supabase environment variables or use demo mode, launch the Android app, navigate all core flows, create a trip, add participants and expenses, see correct balances, create itinerary entries, and run all checks successfully.
