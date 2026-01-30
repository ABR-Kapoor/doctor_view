'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AuthSync component for doctor_view app
 * Links Kinde authentication to existing doctor records or creates new ones
 */
export default function AuthSync() {
  const [synced, setSynced] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function syncUser() {
      if (synced) return;

      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
        });

        const data = await res.json();

        if (data.success) {
          setSynced(true);
          // Refresh if this was a new account
          if (data.message === 'Doctor account created successfully' || 
              data.message === 'Doctor account linked successfully. Welcome!') {
            router.refresh();
          }
        } else {
          console.error('Sync failed:', data.error);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    syncUser();
  }, [synced, router]);

  return null;
}
