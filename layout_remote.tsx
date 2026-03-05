import { redirect } from 'next/navigation';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import Link from 'next/link';

import ProfilePicture from '@/app/components/ProfilePicture';
import { supabase } from '@/lib/shared/supabase';
import AuthSync from '@/components/AuthSync';
import DashboardLayoutClient from '@/app/components/DashboardLayoutClient';

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
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, name, uid')
      .eq('auth_id', user.id)
      .single();

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
      <DashboardLayoutClient user={mergedUser}>
        {children}
      </DashboardLayoutClient>
    </>
  );
}

