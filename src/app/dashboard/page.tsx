import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { DashboardClient } from '@/components/DashboardClient';
import {
  Briefcase,
  FolderKanban,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatShortDate, formatTime } from '@/lib/utils';

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch all data
  const [projects, sideProjects, clients, invoices] = await Promise.all([
    prisma.project.findMany({
      where: { userId: user.id },
      include: { client: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.sideProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Calculate stats
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    totalSideProjects: sideProjects.length,
    activeSideProjects: sideProjects.filter(p => p.status === 'IN_PROGRESS').length,
    totalClients: clients.length,
    totalWorkedSeconds: projects.reduce((sum, p) => sum + p.workedSeconds, 0) +
      sideProjects.reduce((sum, p) => sum + p.workedSeconds, 0),
    totalRevenue: invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0),
    pendingRevenue: invoices
      .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.amount, 0),
  };

  // Get next up projects
  const nextUp = projects
    .filter(p => p.status === 'NOT_STARTED' || p.status === 'IN_PROGRESS')
    .sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    })
    .slice(0, 5);

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user.name}! Here&apos;s your project overview.
          </p>
        </div>

        {/* Focus Timer */}
        <DashboardClient
          projects={projects.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
          }))}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Projects"
            value={stats.totalProjects}
            subtitle={`${stats.activeProjects} in progress`}
            icon={Briefcase}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Side Projects"
            value={stats.totalSideProjects}
            subtitle={`${stats.activeSideProjects} active`}
            icon={FolderKanban}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Clients"
            value={stats.totalClients}
            icon={Users}
            iconColor="text-green-600"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`${formatCurrency(stats.pendingRevenue)} pending`}
            icon={DollarSign}
            iconColor="text-yellow-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Completed Projects"
            value={stats.completedProjects}
            icon={CheckCircle2}
            iconColor="text-green-600"
          />
          <StatCard
            title="Hours Worked"
            value={formatTime(stats.totalWorkedSeconds)}
            icon={Clock}
            iconColor="text-orange-600"
          />
          <StatCard
            title="Active Tasks"
            value={stats.activeProjects + stats.activeSideProjects}
            subtitle="In progress"
            icon={TrendingUp}
            iconColor="text-pink-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Next Up */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Next Up
            </h2>
            {nextUp.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No upcoming projects
              </p>
            ) : (
              <div className="space-y-3">
                {nextUp.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            project.priority === 'URGENT'
                              ? 'bg-red-500'
                              : project.priority === 'HIGH'
                              ? 'bg-orange-500'
                              : project.priority === 'MEDIUM'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{project.status.replace('_', ' ')}</span>
                        {project.client && <span>• {project.client.name}</span>}
                        {project.dueDate && (
                          <span>• Due {formatShortDate(project.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Invoices
            </h2>
            {recentInvoices.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No invoices yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{invoice.client?.name || 'No client'}</span>
                        <span>• {formatShortDate(invoice.issuedDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount)}
                      </div>
                      <div
                        className={`text-sm ${
                          invoice.status === 'PAID'
                            ? 'text-green-600'
                            : invoice.status === 'OVERDUE'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {invoice.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
