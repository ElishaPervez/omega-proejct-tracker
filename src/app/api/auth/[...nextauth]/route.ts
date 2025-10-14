import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { Adapter } from 'next-auth/adapters';

// Custom adapter that prevents duplicate user creation
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p);

  return {
    ...baseAdapter,
    async createUser(data) {
      console.log('CustomAdapter: createUser called with data:', data);

      // Check if this is a Discord OAuth user and if they already exist
      if (data.email) {
        const existingUser = await p.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          console.log('CustomAdapter: Found existing user by email:', existingUser.id);
          return existingUser;
        }
      }

      // If no existing user, create new one
      console.log('CustomAdapter: Creating new user');
      return baseAdapter.createUser!(data);
    },
    async linkAccount(data) {
      console.log('CustomAdapter: linkAccount called for userId:', data.userId);

      // Before linking account, check if a user with this Discord ID already exists
      if (data.provider === 'discord') {
        const existingUser = await p.user.findFirst({
          where: { discordId: data.providerAccountId },
        });

        if (existingUser && existingUser.id !== data.userId) {
          console.log('CustomAdapter: Found existing user with Discord ID, merging users');

          // Delete the newly created user and use the existing one
          await p.user.delete({
            where: { id: data.userId },
          });

          // Update Discord info on existing user
          await p.user.update({
            where: { id: existingUser.id },
            data: {
              discordUsername: data.providerAccountId,
              email: data.email || existingUser.email,
            },
          });

          // Link account to existing user
          data.userId = existingUser.id;
        } else {
          // Update Discord ID on the new user
          await p.user.update({
            where: { id: data.userId },
            data: {
              discordId: data.providerAccountId,
            },
          });
        }
      }

      return baseAdapter.linkAccount!(data);
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET || 'placeholder',
      authorization: {
        params: {
          scope: 'identify email',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
