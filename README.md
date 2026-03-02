# Realtime Chat Application

A modern, real-time chat application built with Next.js, Supabase, and Redis.
Features instant messaging, message persistence, and reconnection handling.

[Live Demo](https://tessuract.dev)

Note: Live demo is from differnt repos (private) with a frontend/backend split infrastrucutre but functionality is the same up (groups only is the same)

Why the split? Self managed vs managed services (i.e. Supabase, Vercel, etc)

## Features

- **Messaging**: Real-time chat with persistence, unsend, and reconnection
  recovery
- **AI assistant**: Claude integration with public/private responses, streaming,
  and context-aware conversations
- **Rooms**: Multi-room support with create/delete management
- **Performance**: Redis (local) / Vercel KV (production) for caching and
  delivery tracking
- **Platform**: Responsive UI, typed codebase, OpenAPI docs, and Vercel-ready
  deployment

## Tech Stack

- **App**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS v4, Radix UI
- **Backend services**: Supabase (PostgreSQL + Realtime/WebSocket)
- **State and caching**: Zustand, TanStack Query, Redis/Vercel KV
- **Tooling and deploy**: Bun, Vercel

## Prerequisites

- Bun package manager
- Docker and Docker Compose (for Redis) - Local DB only
- **Supabase**: Choose one option below
  - **Option A**: Supabase cloud account and project (recommended for using a
    prod/dev branch)
  - **Option B**: Local Supabase via Docker (recommended for development) -
    [Setup Guide](docs/LOCAL_SUPABASE_SETUP.md)
- Anthropic account (for AI assistant - optional)
- Vercel account (for deployment)

## Local Setup

Use the local setup guide for `.env` templates and Supabase configuration:

📖 **[Local Supabase Setup Guide](docs/LOCAL_SUPABASE_SETUP.md)**

## Authentication Setup

The application uses Supabase Auth with OAuth providers (GitHub and Discord).
Follow these steps to configure authentication:

### 1. OAuth Provider Setup

#### GitHub OAuth App

1. Go to
   [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000` (development) or your production
     URL
   - **Authorization callback URL**:
     `https://your-project-id.supabase.co/auth/v1/callback`
   - Replace `your-project-id` with your actual Supabase project ID
3. Copy the **Client ID** and **Client Secret**

#### Discord OAuth App

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **OAuth2** settings
4. Add redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**

### 2. Supabase Configuration

1. Go to your Supabase Dashboard → **Authentication** → **Providers**

2. **Enable GitHub Provider:**
   - Toggle on GitHub
   - Add your GitHub Client ID and Client Secret
   - Save changes

3. **Enable Discord Provider:**
   - Toggle on Discord
   - Add your Discord Client ID and Client Secret
   - Save changes

4. **Configure URL Settings:**
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**:
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.vercel.app`
   - **Redirect URLs**: Add these URLs:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://your-domain.vercel.app/auth/callback`

### 3. Environment Variables

Ensure your `.env.local` includes the callback URL:

```bash
# Authentication Configuration
NEXT_PUBLIC_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

For production deployment, set these environment variables in Vercel:

```bash
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://your-domain.vercel.app/auth/callback
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 4. Important Notes

- **OAuth Flow**: GitHub/Discord → Supabase Auth → Your App
- **Callback URLs**:
  - OAuth providers use: `https://your-project-id.supabase.co/auth/v1/callback`
  - Your app uses: `/auth/callback`
- **Testing**: Make sure to test both providers in development before deploying

### 5. Troubleshooting

If you're getting redirected to the root URL with a code parameter instead of
`/auth/callback`:

1. Check that `NEXT_PUBLIC_AUTH_CALLBACK_URL` is set correctly
2. Verify Supabase redirect URLs include `/auth/callback`
3. Ensure OAuth provider callback URLs point to Supabase (not your app directly)

## AI Assistant

The application includes an AI assistant powered by Anthropic's Claude 3.5
Haiku.

For AI-related environment variables, use the template in
[Local Supabase Setup Guide](docs/LOCAL_SUPABASE_SETUP.md).

When `AI_WEB_SEARCH_ENABLED=true`, the assistant can automatically use Tavily
for time-sensitive prompts (for example "latest", "today", "current price") and
will include inline source links in responses. If Tavily quota is exceeded, web
search is temporarily disabled for `AI_WEB_SEARCH_QUOTA_COOLDOWN_MS` and the
assistant falls back to normal AI responses without blocking chat.

Backend/search execution is feature-flagged:

- `AI_BACKEND_MODE=anthropic_tavily`: Anthropic direct + Tavily web search
- `AI_BACKEND_MODE=anthropic_native_web`: Anthropic direct + Anthropic native
  web search
- `AI_BACKEND_MODE=vercel_ai_sdk`: Vercel AI SDK + Anthropic provider + native
  web search (no Tavily required)
- In `vercel_ai_sdk` mode, `AI_SEARCH_DRIVER=tavily` is also supported (SDK +
  Tavily tool path).

Use `AI_SEARCH_DRIVER=auto` to map search driver by backend mode. Invalid flag
combinations fail open when `AI_FLAG_FAIL_OPEN=true`.

Flags migration rollout:

- `AI_FLAGS_MIGRATION_MODE=shadow` (default): evaluates both resolvers, logs
  mismatch, keeps legacy env resolver active.
- `AI_FLAGS_MIGRATION_MODE=active`: uses `flags/next` runtime evaluation as
  source of truth.
- Local/dev values can come from environment variables; Vercel can override via
  Flags Explorer. `FLAGS_SECRET` is required for Flags SDK.

The assistant also supports dynamic model routing: it uses the default model for
normal prompts and switches to the code model for coding-intent prompts.

### AI Assistant User Setup

**Important**: Since the database uses foreign key constraints to `auth.users`,
the AI Assistant needs a valid Supabase Auth user account.

#### Method 1: Using Setup API (Automated)

1. **Create the AI user** by calling the setup endpoint:

```bash
curl -X POST http://localhost:3000/api/setup/ai-user
```

2. **Copy the returned AI user ID** from the response

3. **Add the AI user ID to your environment variables** in `.env.local`:

```bash
# Add this to your .env.local file
AI_USER_ID=
```

4. **Remove the setup endpoint** (for security):

```bash
rm -rf app/api/setup
```

#### Method 2: Using Supabase Dashboard (Manual)

1. **Go to your Supabase Dashboard** → **Authentication** → **Users**

2. **Click "Add user"** and fill in:
   - **Email**: `ai-assistant@examplesupabaseurl.com` (replace)
   - **Password**: Generate a random password (AI won't login with it)
   - **Auto Confirm User**: Check this box

3. **Click "Create user"**

4. **Copy the User UUID** from the created user

5. **Add user metadata** (optional but recommended):
   - Click on the created user
   - Go to **Raw User Meta Data** section
   - Add this JSON:

   ```json
   {
     "full_name": "AI Assistant",
     "is_ai_user": true
   }
   ```

6. **Add the AI user ID to your environment variables** in `.env.local`:

```bash
# Add this to your .env.local file
AI_USER_ID=
```

#### What this does:

- Creates a dedicated AI Assistant user in Supabase Auth
- Provides a valid user ID for database foreign key constraints
- Ensures AI messages are properly stored and retrieved
- The AI user has metadata: `{ full_name: 'AI Assistant', is_ai_user: true }`

#### Production Setup:

For production deployment:

1. Run the setup endpoint on your production URL
2. Add the `AI_USER_ID` environment variable to your Vercel project settings
3. Deploy the updated code
4. Remove the setup endpoint from production

### Security Considerations

**Important**: The `/api/ai/generate` endpoint consumes AI tokens from your
Agent account. It is strongly recommended to implement rate limiting on this
endpoint to prevent abuse and control costs.

Consider implementing:

- Per-user rate limits (e.g., max requests per minute/hour)
- Request quotas per user or IP address
- Authentication checks to ensure only authorized users can access the endpoint
- Monitoring and alerting for unusual usage patterns

**Vercel Deployment**: If deploying on Vercel, you can use
[Vercel Firewall](https://vercel.com/docs/security/vercel-firewall) to configure
rate limiting rules for specific API routes without code changes. This provides
an easy way to set up IP-based or route-based rate limits directly from your
Vercel dashboard.

## Database Setup

You have two options for setting up Supabase:

### Option A: Hosted Supabase (Cloud)

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase Dashboard
3. Run `/database/rooms_schema.sql`
4. Run `/database/schema.sql`
5. Copy your project URL and keys to `.env.local` (see
   [Local Supabase Setup Guide](docs/LOCAL_SUPABASE_SETUP.md))

### Option B: Local Supabase (Docker)

**Recommended for development** - Run Supabase locally with Docker for faster
development, offline work, and simple email authentication.

📖 **[Complete Local Setup Guide →](docs/LOCAL_SUPABASE_SETUP.md)**

Quick start:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start Supabase locally
supabase start

# Apply database migrations
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f database/rooms_schema.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f database/schema.sql
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd realtime-chat/react
```

2. Install dependencies:

```bash
bun install
```

3. Start Redis using Docker:

```bash
bun run docker:up
```

4. Start the development server:

```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

Interactive Swagger/OpenAPI documentation is available at:

- **Swagger UI**:
  [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI Spec**:
  [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Quick Start

1. Start the development server: `bun run dev`
2. Visit `/api-docs` to explore and test all API endpoints
3. Use the "Authorize" button to add your JWT token for authenticated requests

## Available Scripts

### Development

- `bun run dev` - Start development server with Turbopack
- `bun run dev:instance1` - Start on port 3000 (for testing multiple instances)
- `bun run dev:instance2` - Start on port 3001 (for testing multiple instances)

### Build & Production

- `bun run build` - Build the application for production
- `bun run start` - Start the production server

### Code Quality

- `bun run lint` - Run ESLint and TypeScript checks
- `bun run prettier` - Format code with Prettier

### Docker & Redis

- `bun run docker:up` - Start Redis container
- `bun run docker:down` - Stop Redis container
- `bun run docker:logs` - View Redis logs
- `bun run docker:debug` - Start with Redis Commander UI
- `bun run dev:docker` - Start Redis and development server together
- `bun run redis:cli` - Access Redis CLI

## Key Components

### Redis/Vercel KV Integration

Used for:

- Message delivery tracking
- Caching recent messages
- Connection state management
- Automatic environment switching (Redis locally, Vercel KV in production)

## Testing Multiple Instances

To test real-time functionality:

1. Start multiple development instances:

```bash
# Terminal 1
bun run dev:instance1

# Terminal 2
bun run dev:instance2
```

2. Open both URLs:
   - http://localhost:3000
   - http://localhost:3001

3. Join the same room with different usernames to test real-time messaging.

## Redis Commander (Debug Mode)

To monitor Redis in development:

```bash
bun run docker:debug
```

Access Redis Commander at [http://localhost:8081](http://localhost:8081)

### Redis/KV Architecture

- **Local Development**: Uses Docker Redis container
- **Production**: Automatically uses Vercel KV (Upstash Redis)
- **Automatic Detection**: Client switches based on environment variables

## License

MIT License - see LICENSE file for details.
