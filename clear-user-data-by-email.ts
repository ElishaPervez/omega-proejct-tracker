import { prisma } from './src/lib/prisma';

async function clearUserDataByEmail(email: string) {
  if (!email) {
    console.error('Please provide an email address as an argument');
    console.error('Usage: npx tsx clear-user-data-by-email.ts <email>');
    process.exit(1);
  }

  console.log(`Clearing data for user with email: ${email}`);

  try {
    // First, find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('No user found with the provided email. Checking by Discord ID...');
      
      // If no user found by email, try to find by Discord ID (which might be passed as email parameter in a different context)
      const userByDiscordId = await prisma.user.findFirst({
        where: { discordId: email }
      });
      
      if (userByDiscordId) {
        console.log(`Found user by Discord ID: ${userByDiscordId.name || userByDiscordId.email || userByDiscordId.discordUsername}`);
        await deleteUserAccount(userByDiscordId.id);
      } else {
        console.log('No user found with the provided email or Discord ID');
      }
      
      return;
    }

    console.log(`Found user: ${user.name || user.email || user.discordUsername}`);
    
    await deleteUserAccount(user.id);
  } catch (error) {
    console.error('Error clearing user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteUserAccount(userId: string) {
  // Delete all related data in the correct order to respect foreign key constraints
  const result = await prisma.$transaction([
    // Delete timers first since they might be active
    prisma.timer.deleteMany({ where: { userId } }),
    // Delete invoices which might be linked to projects and clients  
    prisma.invoice.deleteMany({ where: { userId } }),
    // Delete projects (and their related timers and invoices will be deleted via cascade)
    prisma.project.deleteMany({ where: { userId } }),
    // Delete side projects
    prisma.sideProject.deleteMany({ where: { userId } }),
    // Delete clients (and their related projects and invoices will be deleted via cascade)
    prisma.client.deleteMany({ where: { userId } }),
    // Finally, delete the user's accounts and sessions that may conflict
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    // Delete the user itself if there are no other providers linked
    prisma.user.delete({ where: { id: userId } }),
  ]);

  console.log('User account and all related data cleared successfully!');
  console.log('Deleted resources:', result.map((res, index) => `${Object.keys(res)[0]}: ${Object.values(res)[0] as number}`).join(', '));
}

// Use command line argument as email
const email = process.argv[2];
clearUserDataByEmail(email);