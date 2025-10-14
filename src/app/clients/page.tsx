import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';
import { formatCurrency } from '@/lib/utils';

export default async function ClientsPage() {
  const user = await requireAuth();

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    include: {
      projects: {
        select: {
          id: true,
          status: true,
        },
      },
      invoices: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Clients
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your client relationships
            </p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No clients yet. Add one using <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">/client add</code>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => {
              const totalProjects = client.projects.length;
              const activeProjects = client.projects.filter(
                p => p.status === 'IN_PROGRESS'
              ).length;
              const totalRevenue = client.invoices
                .filter(i => i.status === 'PAID')
                .reduce((sum, i) => sum + i.amount, 0);

              return (
                <div
                  key={client.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {client.name}
                  </h3>
                  {client.company && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {client.company}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    {client.email && (
                      <div className="text-gray-600 dark:text-gray-400">
                        Email: {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="text-gray-600 dark:text-gray-400">
                        Phone: {client.phone}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">
                          Projects
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {totalProjects}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activeProjects} active
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">
                          Revenue
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(totalRevenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
