import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user-related data in the correct order to respect foreign key constraints
    await prisma.$transaction([
      // First delete timers since they could be active
      prisma.timer.deleteMany({ where: { userId } }),
      // Delete invoices which might be linked to projects and clients
      prisma.invoice.deleteMany({ where: { userId } }),
      // Delete projects (and their related timers and invoices will be deleted via cascade)
      prisma.project.deleteMany({ where: { userId } }),
      // Delete side projects
      prisma.sideProject.deleteMany({ where: { userId } }),
      // Delete clients (and their related projects and invoices will be deleted via cascade)
      prisma.client.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ message: 'User data cleared successfully' });
  } catch (error) {
    console.error('Error clearing user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}