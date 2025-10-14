import { prisma } from './src/lib/prisma';

async function clearCurrentUserData() {
  // Replace 'your-discord-id' with your actual Discord ID
  // You can find this by logging into your app and checking the user table
  const discordId = process.argv[2];
  
  if (!discordId) {
    console.error('Please provide your Discord ID as an argument');
    console.error('Usage: npx tsx clear-user-data.ts <your-discord-id>');
    process.exit(1);
  }

  console.log(`Clearing data for user with Discord ID: ${discordId}`);

  try {
    // First, find the user by Discord ID
    const user = await prisma.user.findUnique({
      where: { discordId },
    });

    if (!user) {
      console.error('User not found with the provided Discord ID');
      process.exit(1);
    }

    console.log(`Found user: ${user.name || user.email || user.discordUsername}`);

    // Delete all related data in the correct order to respect foreign key constraints
    const result = await prisma.$transaction([
      // Delete timers first since they might be active
      prisma.timer.deleteMany({ where: { userId: user.id } }),
      // Delete invoices which might be linked to projects and clients  
      prisma.invoice.deleteMany({ where: { userId: user.id } }),
      // Delete projects (and their related timers and invoices will be deleted via cascade)
      prisma.project.deleteMany({ where: { userId: user.id } }),
      // Delete side projects
      prisma.sideProject.deleteMany({ where: { userId: user.id } }),
      // Delete clients (and their related projects and invoices will be deleted via cascade)
      prisma.client.deleteMany({ where: { userId: user.id } }),
    ]);

    console.log('User data cleared successfully!');
    console.log('Deleted resources:', result.map((res, index) => `${Object.keys(res)[0]}: ${Object.values(res)[0]}`).join(', '));
  } catch (error) {
    console.error('Error clearing user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCurrentUserData();