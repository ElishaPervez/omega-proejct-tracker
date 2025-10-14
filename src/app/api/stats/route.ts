import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all data in parallel
    const [projects, sideProjects, clients, invoices] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: { client: true },
      }),
      prisma.sideProject.findMany({
        where: { userId },
      }),
      prisma.client.findMany({
        where: { userId },
      }),
      prisma.invoice.findMany({
        where: { userId },
      }),
    ]);

    // Calculate statistics
    const stats = {
      projects: {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length,
        notStarted: projects.filter(p => p.status === 'NOT_STARTED').length,
        onHold: projects.filter(p => p.status === 'ON_HOLD').length,
      },
      sideProjects: {
        total: sideProjects.length,
        inProgress: sideProjects.filter(p => p.status === 'IN_PROGRESS').length,
        completed: sideProjects.filter(p => p.status === 'COMPLETED').length,
      },
      clients: {
        total: clients.length,
      },
      invoices: {
        total: invoices.length,
        draft: invoices.filter(i => i.status === 'DRAFT').length,
        sent: invoices.filter(i => i.status === 'SENT').length,
        paid: invoices.filter(i => i.status === 'PAID').length,
        overdue: invoices.filter(i => i.status === 'OVERDUE').length,
      },
      revenue: {
        total: invoices
          .filter(i => i.status === 'PAID')
          .reduce((sum, i) => sum + i.amount, 0),
        pending: invoices
          .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
          .reduce((sum, i) => sum + i.amount, 0),
      },
      hoursWorked: {
        total: projects.reduce((sum, p) => sum + p.hoursWorked, 0) +
          sideProjects.reduce((sum, p) => sum + p.hoursWorked, 0),
        projects: projects.reduce((sum, p) => sum + p.hoursWorked, 0),
        sideProjects: sideProjects.reduce((sum, p) => sum + p.hoursWorked, 0),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
