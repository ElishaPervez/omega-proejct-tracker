import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    async signIn({ user, account, profile }) {
      // Simply add Discord ID to user after OAuth login
      if (account?.provider === 'discord' && profile && user.id) {
        try {
          // Just update the user with Discord info (adapter already created the user)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              discordId: profile.id as string,
              discordUsername: profile.username as string,
            },
          });
        } catch (error) {
          console.error('Error updating Discord ID:', error);
          // Continue anyway - this is not critical
        }
      }
      return true;
    },
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
