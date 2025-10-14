import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { formatShortDate, formatTime } from '@/lib/utils';

export default async function ProjectsPage() {
  const user = await requireAuth();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: { client: true },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  const statusColors = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    LOW: 'bg-green-50 border-green-200',
    MEDIUM: 'bg-yellow-50 border-yellow-200',
    HIGH: 'bg-orange-50 border-orange-200',
    URGENT: 'bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your commission projects
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No projects yet. Create one using the Discord bot with <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">/project create</code>
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 ${priorityColors[project.priority]}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {project.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[project.status]
                        }`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {project.priority}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {project.client && (
                        <span>Client: {project.client.name}</span>
                      )}
                      <span>Hours: {formatTime(project.workedSeconds)}</span>
                      {project.dueDate && (
                        <span>Due: {formatShortDate(project.dueDate)}</span>
                      )}
                      {project.completedAt && (
                        <span>Completed: {formatShortDate(project.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
