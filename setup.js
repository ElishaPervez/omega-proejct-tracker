const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🎉 Welcome to Commission Project Manager Setup!\n');
console.log('This will help you configure your application.\n');
console.log('You\'ll need:');
console.log('  1. Discord Bot Token (from Discord Developer Portal)');
console.log('  2. Discord Client ID (from Discord Developer Portal)');
console.log('  3. Discord Client Secret (from Discord Developer Portal)');
console.log('  4. Discord Guild/Server ID (optional - for faster command testing)\n');

const questions = [
  {
    key: 'DISCORD_TOKEN',
    question: '🤖 Enter your Discord Bot Token: ',
    validate: (val) => val.length > 50
  },
  {
    key: 'DISCORD_CLIENT_ID',
    question: '🆔 Enter your Discord Client ID: ',
    validate: (val) => val.length > 10
  },
  {
    key: 'DISCORD_CLIENT_SECRET',
    question: '🔑 Enter your Discord Client Secret: ',
    validate: (val) => val.length > 10
  },
  {
    key: 'DISCORD_GUILD_ID',
    question: '🏠 Enter your Discord Guild/Server ID (optional, press Enter to skip): ',
    validate: () => true,
    optional: true
  }
];

let answers = {};
let currentIndex = 0;

function askQuestion() {
  if (currentIndex >= questions.length) {
    createEnvFile();
    return;
  }

  const q = questions[currentIndex];

  rl.question(q.question, (answer) => {
    answer = answer.trim();

    if (!q.optional && !answer) {
      console.log('❌ This field is required. Please try again.');
      askQuestion();
      return;
    }

    if (answer && !q.validate(answer)) {
      console.log('❌ Invalid input. Please try again.');
      askQuestion();
      return;
    }

    if (answer) {
      answers[q.key] = answer;
    }

    currentIndex++;
    askQuestion();
  });
}

function createEnvFile() {
  console.log('\n✨ Generating secure NextAuth secret...');

  const nextAuthSecret = crypto.randomBytes(32).toString('base64');

  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# Discord Bot
DISCORD_TOKEN="${answers.DISCORD_TOKEN}"
DISCORD_CLIENT_ID="${answers.DISCORD_CLIENT_ID}"
DISCORD_GUILD_ID="${answers.DISCORD_GUILD_ID || ''}"

# Discord OAuth
DISCORD_CLIENT_SECRET="${answers.DISCORD_CLIENT_SECRET}"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${nextAuthSecret}"

# App URL
APP_URL="http://localhost:3000"
`;

  const envPath = path.join(__dirname, '.env');

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration saved to .env file!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: npm install');
  console.log('   2. Run: npx prisma migrate dev');
  console.log('   3. Run: npm run discord:register');
  console.log('   4. Start web app: npm run dev');
  console.log('   5. Start Discord bot: npm run discord:dev');
  console.log('\n🚀 Setup complete! Happy coding!\n');

  rl.close();
}

askQuestion();
