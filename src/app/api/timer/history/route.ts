import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timers = await prisma.timer.findMany({
      where: {
        userId: session.user.id,
        isActive: false,
      },
      include: {
        project: true,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(timers);
  } catch (error) {
    console.error('Error fetching timer history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
