# Veezy - AI Sales Agent SaaS Platform

A modern, full-stack TypeScript monorepo for building AI-powered sales agent applications with multi-tenant architecture.

## 🚀 Tech Stack

### Frontend (`apps/web`)

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Supabase Auth** - Google OAuth authentication
- **Server Actions** - Server-side data mutations

### Backend (`apps/api`)

- **NestJS** - Progressive Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database (via Supabase)
- **class-validator** - DTO validation

### Shared (`packages/shared`)

- Shared TypeScript types and utilities
- Used across both frontend and backend

### Infrastructure

- **Turborepo** - High-performance build system
- **npm workspaces** - Monorepo package management
- **Supabase** - Authentication & PostgreSQL hosting

## 📁 Project Structure

```
veezy/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   │   ├── auth/    # Authentication pages
│   │   │   │   └── dashboard/
│   │   │   └── lib/         # Utilities
│   │   │       └── supabase/ # Supabase clients
│   │   └── package.json
│   │
│   └── api/                 # NestJS backend
│       ├── src/
│       │   ├── prisma/      # Prisma service
│       │   ├── tenant/      # Tenant module
│       │   └── main.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   └── shared/              # Shared TypeScript types
│       └── src/
│           └── types.ts
│
├── package.json             # Root workspace config
└── turbo.json              # Turborepo pipeline
```

## 🛠️ Getting Started

### Prerequisites

- Node.js v23.6.0 or higher
- npm 11.3.0 or higher
- Supabase account
- PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/akvinayaktiwari/veezy.git
   cd veezy
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   **For `apps/web/.env.local`:**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

   **For `apps/api/.env`:**

   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=4000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up the database**

   ```bash
   cd apps/api
   npx prisma db push
   cd ../..
   ```

5. **Run development servers**

   ```bash
   npm run dev
   ```

   This starts:
   - Next.js on `http://localhost:3000`
   - NestJS API on `http://localhost:4000`

## 🗄️ Database Schema

### Multi-Tenant Architecture

```prisma
model Tenant {
  id        String   @id @default(uuid())
  userId    String   @unique
  name      String
  email     String?
  agents    Agent[]
  leads     Lead[]
  bookings  Booking[]
}

model Agent {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  publicLink  String   @unique @default(uuid())
  // ... more fields
}

model Lead {
  id       String   @id @default(uuid())
  tenantId String
  email    String
  // ... more fields
}

model Booking {
  id       String   @id @default(uuid())
  tenantId String
  leadId   String
  // ... more fields
}
```

## 🔐 Authentication Flow

1. User clicks "Sign in with Google" on `/auth/login`
2. Redirected to Google OAuth consent screen
3. After authorization, redirected to `/auth/callback`
4. Session created and stored in cookies
5. User redirected to `/dashboard`
6. Tenant automatically created on first login

## 📦 Available Scripts

### Root

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production

### Apps/Web (Next.js)

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Apps/API (NestJS)

- `npm run dev` - Start NestJS in watch mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:dev` - Start in development mode
- `npm test` - Run tests

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable Google OAuth provider in Authentication settings
3. Copy your project URL and API keys
4. Update `.env.local` and `.env` files

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Add credentials to Supabase dashboard

## 🚢 Deployment

### Vercel (Frontend)

```bash
# Deploy Next.js app
cd apps/web
vercel
```

### Railway/Render (Backend)

1. Connect your GitHub repository
2. Set root directory to `apps/api`
3. Add environment variables
4. Deploy

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the UNLICENSED license.

## 👨‍💻 Author

**Vinayak Tiwari**

- GitHub: [@akvinayaktiwari](https://github.com/akvinayaktiwari)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NestJS team for the robust backend framework
- Supabase for authentication and database hosting
- Vercel for the Turborepo build system
