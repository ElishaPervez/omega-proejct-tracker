'use client';

import { useState } from 'react';
import { requireAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear ALL your data? This action cannot be undone and will delete all your projects, clients, invoices, and timers.')) {
      return;
    }

    setIsClearing(true);
    setError(null);
    setClearSuccess(false);

    try {
      const response = await fetch('/api/user/clear-data', {
        method: 'POST',
      });

      if (response.ok) {
        setClearSuccess(true);
        // Optionally refresh or redirect after a delay
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to clear data');
      }
    } catch (err) {
      setError('An error occurred while clearing data');
      console.error('Error clearing data:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and data
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Data Management
          </h2>
          
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Clear All Data
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Delete all your projects, clients, invoices, and timers. This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3">
                {clearSuccess && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Data cleared successfully!
                  </span>
                )}
                
                <button
                  onClick={handleClearAllData}
                  disabled={isClearing}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isClearing 
                      ? 'bg-yellow-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {isClearing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Clearing...
                    </>
                  ) : (
                    'Clear All Data'
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your email address</p>
              </div>
              <p className="text-sm text-gray-900 dark:text-white">Connected via Discord</p>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Discord</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your Discord account</p>
              </div>
              <p className="text-sm text-gray-900 dark:text-white">Connected</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}