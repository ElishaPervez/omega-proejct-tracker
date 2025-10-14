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

    const body = await request.json();
    const { projectId, description } = body;

    // Check if there's already an active timer
    const activeTimer = await prisma.timer.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (activeTimer) {
      return NextResponse.json(
        { error: 'You already have an active timer running' },
        { status: 400 }
      );
    }

    // Create new timer
    const timer = await prisma.timer.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        description: description || null,
        isActive: true,
        startTime: new Date(),
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(timer);
  } catch (error) {
    console.error('Error starting timer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
