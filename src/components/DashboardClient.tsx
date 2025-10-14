'use client';

import { FocusTimer } from './FocusTimer';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  projects: Array<{ id: string; title: string; status: string }>;
}

export function DashboardClient({ projects }: DashboardClientProps) {
  const router = useRouter();

  const handleTimerUpdate = () => {
    // Refresh the page to update stats
    router.refresh();
  };

  // Filter to active projects only
  const activeProjects = projects.filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'NOT_STARTED'
  );

  return (
    <div className="mb-8">
      <FocusTimer onTimerUpdate={handleTimerUpdate} projects={activeProjects} />
    </div>
  );
}
