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

    const activeTimer = await prisma.timer.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(activeTimer);
  } catch (error) {
    console.error('Error fetching active timer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
