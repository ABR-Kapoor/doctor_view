'use client';

import { useState } from 'react';
import CollapsibleSidebar from './CollapsibleSidebar';

interface DashboardLayoutClientProps {
  user: any;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex text-sm">
      <CollapsibleSidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content - Dynamic offset based on sidebar state */}
      <main
        className={`flex-1 transition-all duration-300 p-4 md:p-6 overflow-x-hidden ${isCollapsed ? 'md:ml-22' : 'md:ml-72'
          }`}
      >
        {children}
      </main>
    </div>
  );
}
