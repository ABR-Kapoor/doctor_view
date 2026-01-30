'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../../components/TranslatedText';

export default function DoctorVideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const aid = params.aid as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const zpRef = useRef<any>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);
  const [showPostCallModal, setShowPostCallModal] = useState(false);
  const [liveTimerInterval, setLiveTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[DOCTOR] Component mounted, starting initialization...');
    
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('[DOCTOR] Not in browser, skipping');
      return;
    }
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log('[DOCTOR] Timer fired, calling init function');
      fetchAppointmentAndInitCall();
    }, 500);

    return () => {
      clearTimeout(timer);
      console.log('[DOCTOR] Cleanup called');
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.log('[DOCTOR] ZegoCloud cleanup:', e);
        }
      }
    };
  }, [aid]);

  async function fetchAppointmentAndInitCall() {
    const timeoutId = setTimeout(() => {
      const errorMsg = 'Connection timeout - please check your camera/microphone permissions and internet connection';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }, 15000); // 15 second timeout

    try {
      console.log('Starting video call initialization...');
      
      // Check if container is available
      if (!containerRef.current) {
        throw new Error('Video container not ready');
      }

      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.uid);

      // Fetch appointment details
      const response = await fetch(`/api/doctor/appointments?uid=${user.uid}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to load appointments');
      }

      // Find the specific appointment
      const allAppointments = [
        ...data.appointments.pending,
        ...data.appointments.confirmed,
        ...data.appointments.today,
      ];
      const appointment = allAppointments.find((apt: any) => apt.aid === aid);

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      console.log('Appointment found:', appointment.aid);
      setAppointmentData(appointment);

      // Dynamically import ZegoCloud SDK (client-side only)
      console.log('Loading ZegoCloud SDK...');
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

      // Initialize ZegoCloud
      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || '';
      
      if (!appID || !serverSecret) {
        throw new Error('ZegoCloud credentials missing');
      }

      const roomID = `appointment_${aid}`;
      const userID = user.uid;
      const userName = user.name || 'Doctor';

      console.log('Generating token for room:', roomID);
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      console.log('Creating ZegoCloud instance...');
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;
      
      console.log('[DOCTOR] Joining room...');
      
      // Don't await - just start the join process
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showPreJoinView: false,
        showScreenSharingButton: true,
        showRoomTimer: true,
        maxUsers: 2,
        onLeaveRoom: () => {
          console.log('[DOCTOR] onLeaveRoom triggered!');
          clearTimeout(timeoutId);
          
          // Stop live timer
          if (liveTimerInterval) {
            clearInterval(liveTimerInterval);
          }
          
          // Calculate final duration
          if (callStartTime) {
            const endTime = new Date();
            const durationMs = endTime.getTime() - callStartTime.getTime();
            const durationSeconds = Math.floor(durationMs / 1000);
            const durationMinutes = durationSeconds / 60; // Decimal minutes for database
            
            setCallDurationSeconds(durationSeconds);
            
            // Update appointment with call times
            updateCallDuration(callStartTime, endTime, durationMinutes);
          }
          
          setShowPostCallModal(true);
        },
        onJoinRoom: async () => {
          console.log('[DOCTOR] Successfully joined room!');
          clearTimeout(timeoutId);
          
          // Start call on server and get synchronized start time
          const startTime = await startCall();
          setCallStartTime(startTime);
          
          // Start live timer (updates every second)
          const timer = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setCallDurationSeconds(elapsed >= 0 ? elapsed : 0);
          }, 1000);
          setLiveTimerInterval(timer);
        },
        onUserJoin: (users: any) => {
          console.log('[DOCTOR] User joined:', users);
        },
        onUserLeave: (users: any) => {
          console.log('[DOCTOR] User left:', users);
        },
      });

      // Set loading to false immediately after starting join
      console.log('Video call initialized, waiting for connection...');
      clearTimeout(timeoutId);
      setLoading(false);
    } catch (error: any) {
      console.error('Video call error:', error);
      clearTimeout(timeoutId);
      const errorMsg = error.message || 'Failed to initialize video call';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      
      // Redirect after showing error
      setTimeout(() => {
        router.push('/dashboard/appointments');
      }, 3000);
    }
  }

  async function startCall() {
    try {
      console.log('[DOCTOR] Notifying server: Call Started');
      const response = await fetch(`/api/appointments/${aid}/start-call`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success && data.data?.call_started_at) {
        return new Date(data.data.call_started_at);
      }
      return new Date(); // Fallback
    } catch (error) {
      console.error('[DOCTOR] Failed to start call on server:', error);
      return new Date();
    }
  }

  async function updateCallDuration(startTime: Date, endTime: Date, durationMins: number) {
    try {
      console.log('[DOCTOR] Updating call duration:', {
        aid,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMins
      });

      const response = await fetch(`/api/appointments/${aid}/call-duration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: durationMins,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('[DOCTOR] ✅ Call duration updated successfully:', data);
      } else {
        console.error('[DOCTOR] ❌ API returned error:', data);
      }
    } catch (err) {
      console.error('[DOCTOR] ❌ Failed to update call duration:', err);
    }
  }

  function handlePrescribe() {
    if (appointmentData) {
      const minutes = Math.floor(callDurationSeconds / 60);
      router.push(`/dashboard/prescriptions/new?aid=${aid}&pid=${appointmentData.pid}&duration=${minutes}`);
    }
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Video Call Container - Hidden when call ends */}
      <div 
        ref={containerRef} 
        className="w-full h-full" 
        style={{ display: showPostCallModal ? 'none' : 'block' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 z-50">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-medium"><TranslatedText>Connecting to video call...</TranslatedText></p>
          <p className="text-gray-500 text-sm mt-2"><TranslatedText>Please allow camera and microphone access</TranslatedText></p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2"><TranslatedText>Connection Failed</TranslatedText></h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard/appointments')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <TranslatedText>Back to Appointments</TranslatedText>
            </button>
          </div>
        </div>
      )}

      {/* Patient Info Overlay - Only during call */}
      {appointmentData && !loading && !error && !showPostCallModal && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                <TranslatedText>{appointmentData.patient?.user?.name || 'Patient'}</TranslatedText>
              </p>
              <p className="text-xs text-gray-600">
                {new Date(appointmentData.scheduled_date).toLocaleDateString()} <TranslatedText>at</TranslatedText>{' '}
                {appointmentData.scheduled_time}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Timer Badge - Only during call */}
      {callStartTime && !showPostCallModal && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg z-10">
          <p className="text-sm font-bold text-gray-900">
            <TranslatedText>Duration</TranslatedText>: {Math.floor(callDurationSeconds / 60)}:{String(callDurationSeconds % 60).padStart(2, '0')}
          </p>
        </div>
      )}

      {/* Post-Call Screen - Replaces video frame */}
      {showPostCallModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full mx-6">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Video className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3"><TranslatedText>Call Ended Successfully</TranslatedText></h2>
              <p className="text-lg text-gray-600">
                <TranslatedText>Duration</TranslatedText>: <span className="font-bold text-primary-600">
                  {Math.floor(callDurationSeconds / 60)} <TranslatedText>min</TranslatedText> {callDurationSeconds % 60} <TranslatedText>sec</TranslatedText>
                </span>
              </p>
            </div>

            {/* Patient Summary Card */}
            {appointmentData && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">
                      {appointmentData.patient?.user?.name?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600"><TranslatedText>Patient</TranslatedText></p>
                    <p className="font-bold text-gray-900 text-lg"><TranslatedText>{appointmentData.patient?.user?.name}</TranslatedText></p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-1"><TranslatedText>Chief Complaint</TranslatedText></p>
                  <p className="text-gray-900"><TranslatedText>{appointmentData.chief_complaint || 'N/A'}</TranslatedText></p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePrescribe}
                className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold text-lg hover:shadow-xl smooth-transition transform hover:scale-105"
              >
                📝 <TranslatedText>Prescribe Medicine</TranslatedText>
              </button>
              <button
                onClick={() => router.push('/dashboard/appointments')}
                className="w-full px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 smooth-transition"
              >
                ← <TranslatedText>Back to Dashboard</TranslatedText>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
