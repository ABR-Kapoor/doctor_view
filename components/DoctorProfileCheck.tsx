'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import { checkDoctorProfileComplete } from '@/lib/shared/profile-utils';

export default function DoctorProfileCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [percentage, setPercentage] = useState(100);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    checkProfile();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      checkProfile();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [pathname]); // Re-check when pathname changes

  async function checkProfile() {
    try {
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) return;

      // Fetch profile
      const response = await fetch(`/api/doctor/profile?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        const completeness = checkDoctorProfileComplete(data.doctor, data.user);
        
        if (!completeness.isComplete) {
          setPercentage(completeness.percentage);
          setMissingFields(completeness.missingFields);
          setIsProfileIncomplete(true);
          
          // Show modal on non-profile pages to inform user what's missing
          if (pathname !== '/dashboard/profile') {
            setShowModal(true);
          } else {
            // Hide modal on profile page itself
            setShowModal(false);
          }
        } else {
          setIsProfileIncomplete(false);
          setShowModal(false);
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  }

  const handleModalAction = () => {
    // When user clicks "Complete Profile", redirect to profile page
    setShowModal(false);
    router.push('/dashboard/profile?incomplete=true');
  };

  return (
    <ProfileCompletionModal
      isOpen={showModal}
      percentage={percentage}
      missingFields={missingFields}
      userType="doctor"
      onProfileUpdate={checkProfile}
      onCompleteProfile={handleModalAction}
    />
  );
}
