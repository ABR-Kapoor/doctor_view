import { redirect } from 'next/navigation';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { Home, Calendar, Users, FileText, User, LogOut, Pill } from 'lucide-react';
import Link from 'next/link';

import ProfilePicture from '../components/ProfilePicture';

export default async function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, getUser } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect('/');
  }

  const user = await getUser();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Patients', href: '/dashboard/patients', icon: Users },
    { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: Pill },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-gray-200/50 min-h-screen sticky top-0 flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-1">
              <img src="/Logos/logo_transparent.png" alt="AuraSutra" className="h-12" />
              <span className="text-2xl font-semibold" style={{ fontFamily: 'Alatsi, sans-serif' }}>AuraSutra</span>
            </div>
            <span className="text-xs text-gray-600 font-semibold">Doctor Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-primary-50/50 smooth-transition text-gray-700 hover:text-primary-600 group"
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 smooth-transition" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/50">
          <div className="flex items-center space-x-3 px-4 py-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center overflow-hidden">
              <ProfilePicture uid={user?.id} />
              {!user?.id && (
                <span className="text-primary-700 font-semibold">
                  {user?.given_name?.[0] || 'D'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Dr. {user?.given_name || 'Doctor'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className="flex items-center space-x-2 px-4 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg smooth-transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
