'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, Users, Pill, User } from 'lucide-react';
import { TranslatedText } from './TranslatedText';

interface SidebarNavigationProps {
  isCollapsed?: boolean;
}

export default function SidebarNavigation({ isCollapsed = false }: SidebarNavigationProps) {
    const pathname = usePathname();

    const items = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
        { name: 'Patients', href: '/dashboard/patients', icon: Users },
        { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: Pill },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
    ];

    return (
        <>
            {items.map((item) => {
                // Adjust active logic: simple exact match or startsWith for sub-routes
                const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard');

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`
              flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 group
              ${isActive
                                ? 'bg-sky-500 text-white shadow-md font-bold'
                                : 'text-black/80 hover:bg-black/5 hover:text-black font-semibold'}
            `}
                        title={isCollapsed ? item.name : undefined}
                    >
                        <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-white' : 'text-black group-hover:text-black'} ${isCollapsed ? '' : 'shrink-0'}`} />
                        {!isCollapsed && <span><TranslatedText>{item.name}</TranslatedText></span>}
                    </Link>
                );
            })}
        </>
    );
}
