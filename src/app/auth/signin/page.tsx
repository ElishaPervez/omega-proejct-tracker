'use client';

import { signIn } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Commission Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your projects with Discord integration
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <FaDiscord className="text-2xl" />
            Sign in with Discord
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>By signing in, you agree to link your Discord account</p>
          <p className="mt-2">Use Discord slash commands to manage projects on the go!</p>
        </div>
      </div>
    </div>
  );
}
