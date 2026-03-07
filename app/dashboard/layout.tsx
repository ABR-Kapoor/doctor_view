import { redirect } from 'next/navigation';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import sql from '@/lib/db';
import AuthSync from '@/components/AuthSync';
import DashboardLayoutClient from '@/app/components/DashboardLayoutClient';
import DoctorProfileCheck from '@/components/DoctorProfileCheck';

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

  // Fetch user data from database including name
  let dbUserData = null;
  if (user?.id) {
    const [userData] = await sql`
        SELECT role, name, uid FROM users WHERE auth_id = ${user.id}
    `;

    dbUserData = userData;

    // If user is a patient, redirect to unauthorized page
    if (userData?.role === 'patient') {
      redirect('/unauthorized');
    }
  }

  // Merge Kinde user with database user data
  const mergedUser = {
    ...user,
    name: dbUserData?.name || user?.given_name || 'Doctor',
    uid: dbUserData?.uid,
  };

  return (
    <>
      <AuthSync />
      <DoctorProfileCheck />
      <DashboardLayoutClient user={mergedUser}>
        {children}
      </DashboardLayoutClient>
    </>
  );
}
