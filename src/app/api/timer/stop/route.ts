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

    // Find active timer
    const activeTimer = await prisma.timer.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!activeTimer) {
      return NextResponse.json(
        { error: 'No active timer found' },
        { status: 404 }
      );
    }

    const endTime = new Date();
    const durationInSeconds = Math.floor(
      (endTime.getTime() - activeTimer.startTime.getTime()) / 1000
    );
    const durationInHours = durationInSeconds / 3600;

    // Stop timer
    const stoppedTimer = await prisma.timer.update({
      where: { id: activeTimer.id },
      data: {
        isActive: false,
        endTime,
        duration: durationInSeconds,
      },
      include: {
        project: true,
      },
    });

    // Add hours to project if associated
    if (activeTimer.projectId) {
      await prisma.project.update({
        where: { id: activeTimer.projectId },
        data: {
          hoursWorked: {
            increment: durationInHours,
          },
        },
      });
    }

    return NextResponse.json(stoppedTimer);
  } catch (error) {
    console.error('Error stopping timer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
