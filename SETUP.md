# 🚀 Fresh Start Setup Guide

Welcome! This guide will help you set up the Commission Project Manager from scratch.

## 📋 Prerequisites

Before starting, make sure you have:
- **Node.js 18+** installed
- **npm** package manager
- A **Discord account**
- Access to **Discord Developer Portal**

## 🎯 Quick Start (Recommended)

### Option 1: Automated Setup (Easiest!)

Just double-click this file:
```
fresh-start.bat
```

This will:
1. Clear any existing configuration
2. Ask you for all credentials interactively
3. Set up everything automatically

### Option 2: Manual Setup

If you prefer manual control, follow these steps:

## 📝 Step-by-Step Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Give it a name (e.g., "Project Manager")
4. Click **"Create"**

### 2. Get Your Bot Token

1. Go to the **"Bot"** section in the left sidebar
2. Click **"Add Bot"** (if not already created)
3. Click **"Reset Token"** and copy it
   - ⚠️ Save this! You'll need it for `DISCORD_TOKEN`

### 3. Get Your Client ID and Secret

1. Go to **"OAuth2"** section
2. Copy your **"Client ID"**
   - Save this for `DISCORD_CLIENT_ID`
3. Click **"Reset Secret"** under Client Secret
4. Copy the **Client Secret**
   - ⚠️ Save this! You'll need it for `DISCORD_CLIENT_SECRET`

### 4. Add OAuth Redirect URLs

Still in OAuth2 section:
1. Click **"Add Redirect"**
2. Add: `http://localhost:3000/api/auth/callback/discord`
3. Click **"Save Changes"**

### 5. Get Your Server/Guild ID (Optional)

1. Open Discord
2. Go to **User Settings > Advanced**
3. Enable **"Developer Mode"**
4. Right-click your server
5. Click **"Copy Server ID"**
   - Save this for `DISCORD_GUILD_ID` (optional - makes commands update instantly)

### 6. Run Interactive Setup

Open Command Prompt or PowerShell in the project folder and run:

```bash
npm run setup
```

Or manually run:
```bash
node setup.js
```

Follow the prompts and enter your credentials.

### 7. Install Dependencies

```bash
npm install
```

### 8. Create Database

```bash
npx prisma migrate dev
```

### 9. Register Discord Commands

```bash
npm run discord:register
```

### 10. Start the Application

**Option A: Use the batch file (opens both servers)**
```bash
start-dev.bat
```

**Option B: Manual start (use 2 terminals)**

Terminal 1 - Web App:
```bash
npm run dev
```

Terminal 2 - Discord Bot:
```bash
npm run discord:dev
```

### 11. Invite Bot to Your Server

1. Go to Discord Developer Portal > Your App > OAuth2 > URL Generator
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
4. Copy the URL and open in browser
5. Select your server and authorize

## 🎉 You're Done!

Access your dashboard at: **http://localhost:3000**

Use Discord commands in your server:
- `/dashboard` - View your stats
- `/project create` - Create a new project
- `/client add` - Add a client
- `/invoice create` - Create an invoice

## 🔧 Utility Scripts

### Clear Database (Keep Configuration)
```bash
clear-database.bat
```

### Fresh Start (Clear Everything)
```bash
fresh-start.bat
```

### Start Development Servers
```bash
start-dev.bat
```

## 🆘 Troubleshooting

### "Module not found" errors
```bash
npm install
npx prisma generate
```

### "Table does not exist" errors
```bash
npx prisma migrate dev
```

### Discord bot not responding
1. Check `DISCORD_TOKEN` is correct
2. Make sure you ran `npm run discord:register`
3. Verify bot has permissions in your server

### OAuth login fails
1. Check `DISCORD_CLIENT_SECRET` is correct
2. Verify redirect URL is added in Discord Developer Portal
3. Make sure it matches: `http://localhost:3000/api/auth/callback/discord`

## 📁 Project Structure

```
commission-project-manager/
├── setup.js              # Interactive setup script
├── fresh-start.bat       # Complete reset + setup
├── clear-database.bat    # Clear only database
├── start-dev.bat         # Start both servers
├── prisma/               # Database schema & migrations
├── src/
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   ├── discord/         # Discord bot commands
│   └── lib/             # Utilities
└── .env                 # Your configuration (auto-generated)
```

## 🔐 Environment Variables

After setup, your `.env` file will contain:
- `DATABASE_URL` - Database connection
- `DISCORD_TOKEN` - Bot token
- `DISCORD_CLIENT_ID` - OAuth client ID
- `DISCORD_CLIENT_SECRET` - OAuth secret
- `DISCORD_GUILD_ID` - Your server ID (optional)
- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - Auto-generated security key
- `APP_URL` - Application URL

## 💡 Tips

- Use `DISCORD_GUILD_ID` for instant command updates during development
- Without it, global commands take up to 1 hour to update
- Keep your `.env` file secret - never commit it to git
- Use `fresh-start.bat` when sharing the project with others

## 📚 Next Steps

1. Create your first project via Discord: `/project create`
2. Add clients: `/client add`
3. Use the focus timer on the dashboard
4. Track your time and create invoices!

Happy coding! 🎨
