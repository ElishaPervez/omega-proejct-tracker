# 🎨 Omega Project Tracker

A powerful project management system for commission designers with Discord bot integration. Track projects, clients, invoices, and work time - all accessible via Discord slash commands and a beautiful web dashboard.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![Discord.js](https://img.shields.io/badge/Discord.js-14-5865F2?style=flat&logo=discord&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma&logoColor=white)

## ✨ Features

### 📊 Web Dashboard
- **Beautiful UI** with real-time statistics
- **Focus Timer** (Upwork-style) with live updates
- Track projects, side projects, clients, and invoices
- View revenue, hours worked, and completion stats
- Responsive design for all devices

### 🤖 Discord Bot Integration
- Manage everything via Discord slash commands
- Works in servers and DMs
- Instant sync between Discord and web interface
- Real-time notifications and updates

### ⏱️ Time Tracking
- Upwork-style focus timer with stunning animations
- Live updates every second
- Auto-saves time to projects
- Session history tracking

### 💼 Project Management
- Track regular projects and side projects separately
- Set priorities (Low, Medium, High, Urgent)
- Multiple statuses (Not Started, In Progress, On Hold, Completed, Cancelled)
- Link projects to clients

### 👥 Client Management
- Store client information
- Track projects and revenue per client
- Project history

### 💰 Invoice Tracking
- Create and manage invoices
- Track payment status
- Link invoices to projects and clients
- Revenue analytics

## 🚀 Quick Start (3 Easy Steps!)

### Step 1: Install Dependencies
```bash
setup.bat
```

### Step 2: Configure Credentials
```bash
fresh-start.bat
```

### Step 3: Start the Application
```bash
start-dev.bat
```

**That's it!** The app will open at `http://localhost:3000` 🎉

---

## 📋 Prerequisites

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **Discord Account**
- **Discord Application** ([Create here](https://discord.com/developers/applications))

## 🔧 Detailed Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ElishaPervez/omega-proejct-tracker.git
cd omega-proejct-tracker
```

### 2. Install Dependencies
```bash
setup.bat
```

### 3. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Go to **"Bot"** section → Copy the **Bot Token**
4. Go to **"OAuth2"** section → Copy **Client ID** and **Client Secret**
5. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`

### 4. Configure Application
```bash
fresh-start.bat
```

### 5. Invite Bot & Start
Follow the prompts, then run:
```bash
start-dev.bat
```

## 📱 Discord Commands

```
/dashboard                 - View your statistics
/project create           - Create a new project
/project list             - List all projects
/client add              - Add a new client
/invoice create          - Create an invoice
```

See [SETUP.md](SETUP.md) for complete command list.

## 🛠️ Utility Scripts

| Script | Description |
|--------|-------------|
| `setup.bat` | Install dependencies |
| `fresh-start.bat` | Complete reset + setup |
| `clear-database.bat` | Clear database only |
| `start-dev.bat` | Start app + bot |

## 🎨 Tech Stack

- Next.js 14, React, TypeScript, Tailwind CSS
- Prisma ORM (SQLite/PostgreSQL)
- Discord.js v14
- NextAuth.js

## 🆘 Troubleshooting

**Dependencies won't install**
```bash
npm cache clean --force
npm install
```

**Database errors**
```bash
npx prisma generate
npx prisma migrate dev
```

**Discord bot not responding**
- Verify token is correct
- Run `npm run discord:register`

See [SETUP.md](SETUP.md) for more help.

## 📄 License

MIT License

---

Made with ❤️ for commission designers

**Star ⭐ this repo if you find it helpful!**
