# Commission Project Manager

A comprehensive project management system for commission designers with Discord bot integration. Manage your projects, clients, invoices, and more - all accessible via Discord slash commands and a beautiful web dashboard.

## Features

- **Discord Bot Integration**: Manage everything via Discord slash commands in servers or DMs
- **Web Dashboard**: Beautiful, responsive web interface with real-time statistics
- **Project Management**: Track regular projects and side projects separately
- **Client Management**: Keep track of all your clients and their projects
- **Invoice Tracking**: Create and manage invoices with revenue tracking
- **Statistics Dashboard**: View revenue, hours worked, project completion, and more
- **Authentication**: Secure Discord OAuth integration

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Prisma ORM (SQLite for local, PostgreSQL for production)
- **Discord Bot**: Discord.js v14
- **Deployment**: Vercel (web app), VPS/Cloud (Discord bot)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Discord account and Discord Developer Portal access
- (Optional) Vercel account for deployment

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd commission-project-manager

# Install dependencies
npm install
```

### 2. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Under "Token", click "Reset Token" and copy it (you'll need this)
5. Enable these Privileged Gateway Intents:
   - ❌ Presence Intent (not needed)
   - ❌ Server Members Intent (not needed)
   - ❌ Message Content Intent (not needed)
6. Go to "OAuth2" section:
   - Copy your "Client ID" (you'll need this)
   - Copy your "Client Secret" (you'll need this)
   - Add a redirect URL: `http://localhost:3000/api/auth/callback/discord`

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL="file:./dev.db"

# Discord Bot
DISCORD_TOKEN="your_bot_token_here"
DISCORD_CLIENT_ID="your_client_id_here"
DISCORD_GUILD_ID="optional_guild_id_for_testing"

# Discord OAuth
DISCORD_CLIENT_SECRET="your_client_secret_here"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_a_random_secret_here"

# App URL
APP_URL="http://localhost:3000"
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view your database
npm run prisma:studio
```

### 5. Register Discord Commands

Before starting the bot, register the slash commands:

```bash
npm run discord:register
```

This will register all slash commands with Discord. If you provided `DISCORD_GUILD_ID`, commands will be instantly available in that server. Otherwise, it may take up to 1 hour for global commands to propagate.

### 6. Start Development Servers

You'll need two terminal windows:

**Terminal 1 - Web App:**
```bash
npm run dev
```

**Terminal 2 - Discord Bot:**
```bash
npm run discord:dev
```

The web app will be available at `http://localhost:3000`

### 7. Invite Bot to Your Server

1. Go to Discord Developer Portal > Your Application > OAuth2 > URL Generator
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Send Messages
   - Embed Links
   - Read Message History
4. Copy the generated URL and open it in your browser
5. Select the server you want to add the bot to

## Discord Commands

### Project Management

```
/project create title:"Logo Design" description:"Client logo" priority:High client:"John Doe"
/project list [status:IN_PROGRESS]
/project update title:"Logo" status:COMPLETED
/project hours title:"Logo" hours:5
/project view title:"Logo Design"
```

### Side Projects

```
/sideproject create title:"Personal Website" description:"My portfolio"
/sideproject list [status:IN_PROGRESS]
/sideproject update title:"Website" status:COMPLETED
/sideproject hours title:"Website" hours:3
```

### Client Management

```
/client add name:"John Doe" email:"john@example.com" company:"ABC Corp"
/client list
/client view name:"John"
```

### Invoice Management

```
/invoice create amount:500 client:"John Doe" description:"Logo design work" due_days:30
/invoice list [status:PAID]
/invoice update invoice_number:"INV-202501-1234" status:PAID
/invoice view invoice_number:"INV-202501-1234"
```

### Dashboard

```
/dashboard
```

View your complete statistics including:
- Total projects and completion status
- Revenue (earned and pending)
- Hours worked
- Active clients
- Next up tasks

## Web Dashboard Features

### Pages

1. **Dashboard** (`/dashboard`): Overview with statistics and quick access
2. **Projects** (`/projects`): List and manage all commission projects
3. **Side Projects** (`/side-projects`): Track personal projects
4. **Clients** (`/clients`): View all clients with their project history
5. **Invoices** (`/invoices`): Track payments and revenue

### Authentication

- Sign in with Discord OAuth
- Automatic user creation on first Discord command use
- Secure session management with NextAuth.js

## Deployment

### Deploy Web App to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables (same as `.env` but use PostgreSQL for `DATABASE_URL`)
   - Deploy!

3. **Set up PostgreSQL Database**:
   - Use Vercel Postgres, Neon, Supabase, or any PostgreSQL provider
   - Update `DATABASE_URL` in Vercel environment variables
   - Update Prisma schema datasource to use PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   - Run migrations: `npx prisma migrate deploy`

4. **Update Discord OAuth**:
   - Go to Discord Developer Portal
   - Add your production URL as a redirect: `https://your-app.vercel.app/api/auth/callback/discord`
   - Update `NEXTAUTH_URL` and `APP_URL` in Vercel environment variables

### Deploy Discord Bot

The Discord bot needs to run 24/7 on a server. Options:

#### Option 1: VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone <your-repo-url>
cd commission-project-manager

# Install dependencies
npm install

# Create .env file with production values
nano .env

# Generate Prisma client
npx prisma generate

# Install PM2 for process management
npm install -g pm2

# Start the bot
pm2 start npm --name "discord-bot" -- run discord:dev

# Make bot auto-restart on server reboot
pm2 startup
pm2 save
```

#### Option 2: Railway.app

1. Go to [Railway](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Set start command: `npm run discord:dev`
5. Deploy!

#### Option 3: Render.com

1. Go to [Render](https://render.com)
2. Create new "Background Worker"
3. Connect your GitHub repository
4. Set build command: `npm install && npx prisma generate`
5. Set start command: `npm run discord:dev`
6. Add environment variables
7. Deploy!

## Database Migrations

When you make changes to the Prisma schema:

```bash
# Create a new migration
npm run prisma:migrate

# For production
npx prisma migrate deploy
```

## Project Structure

```
commission-project-manager/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard page
│   │   ├── projects/         # Projects page
│   │   ├── side-projects/    # Side projects page
│   │   ├── clients/          # Clients page
│   │   ├── invoices/         # Invoices page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── Navbar.tsx
│   │   └── StatCard.tsx
│   ├── discord/              # Discord bot
│   │   ├── bot.ts           # Main bot file
│   │   ├── commands/        # Command handlers
│   │   └── register-commands.ts
│   ├── lib/                 # Utility functions
│   │   ├── prisma.ts       # Prisma client
│   │   ├── auth.ts         # Auth helpers
│   │   └── utils.ts        # General utilities
│   └── types/              # TypeScript types
├── .env.example            # Example environment variables
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Troubleshooting

### Discord Bot Not Responding

1. Check if bot is online in your Discord server
2. Verify `DISCORD_TOKEN` is correct
3. Make sure you ran `npm run discord:register`
4. Check bot has proper permissions
5. Look at console logs for errors

### Web App Authentication Issues

1. Verify `DISCORD_CLIENT_SECRET` is correct
2. Check redirect URL is correct in Discord Developer Portal
3. Make sure `NEXTAUTH_SECRET` is set
4. Clear browser cookies and try again

### Database Connection Issues

1. Check `DATABASE_URL` is correct
2. Make sure Prisma client is generated: `npx prisma generate`
3. Verify migrations are run: `npm run prisma:migrate`
4. For production, ensure database is accessible from your deployment

### Commands Take Long to Update

- Guild commands update instantly
- Global commands take up to 1 hour
- Use `DISCORD_GUILD_ID` for faster testing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Review Discord.js and Next.js documentation
3. Open an issue on GitHub

## Acknowledgments

- Built with Next.js, Discord.js, and Prisma
- UI components styled with Tailwind CSS
- Icons from Lucide React and React Icons
