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
      // Check if user with this Discord ID already exists (from bot usage)
      if (account?.provider === 'discord' && profile && user.id) {
        const existingDiscordUser = await prisma.user.findUnique({
          where: { discordId: profile.id as string },
        });

        if (existingDiscordUser && existingDiscordUser.id !== user.id) {
          // Merge: Save OAuth user data, then merge accounts
          const oauthEmail = user.email;
          const oauthName = user.name;
          const oauthImage = user.image;

          // Move accounts to existing Discord user
          await prisma.account.updateMany({
            where: { userId: user.id },
            data: { userId: existingDiscordUser.id },
          });

          // Move sessions to existing Discord user
          await prisma.session.updateMany({
            where: { userId: user.id },
            data: { userId: existingDiscordUser.id },
          });

          // Delete the duplicate OAuth user first (frees up the email constraint)
          await prisma.user.delete({
            where: { id: user.id },
          });

          // Now update existing Discord user with OAuth info
          await prisma.user.update({
            where: { id: existingDiscordUser.id },
            data: {
              email: oauthEmail || existingDiscordUser.email,
              name: oauthName || existingDiscordUser.name,
              image: oauthImage || existingDiscordUser.image,
            },
          });
        } else if (!existingDiscordUser) {
          // No existing Discord user, just update current user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              discordId: profile.id as string,
              discordUsername: profile.username as string,
            },
          });
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
