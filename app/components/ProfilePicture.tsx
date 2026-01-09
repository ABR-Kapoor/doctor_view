'use client';

import { useEffect, useState } from 'react';

export default function ProfilePicture({ uid }: { uid?: string }) {
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    fetchProfileImage();
  }, []);

  async function fetchProfileImage() {
    try {
      // First sync user to get UID
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();
      
      if (user?.uid) {
        // Then fetch doctor profile
        const profileResponse = await fetch(`/api/doctor/profile?uid=${user.uid}`);
        const data = await profileResponse.json();
        
        if (data.success && data.doctor?.profile_image_url) {
          setProfileImage(data.doctor.profile_image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  }

  if (!profileImage) return null;

  return (
    <img
      src={profileImage}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  );
}
