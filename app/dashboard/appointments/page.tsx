'use client';

import { useEffect, useState } from 'react';
import { Calendar, Video, MapPin, Check, X, Clock, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Appointment {
  aid: string;
  scheduled_date: string;
  scheduled_time: string;
  mode: string;
  status: string;
  complaint_description: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
  payment_status: string;
  patient: {
    pid: string;
    user: {
      name: string;
      email: string;
      phone: string;
      profile_image_url?: string;
    };
  };
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'today' | 'completed' | 'cancelled'>('pending');
  const [appointments, setAppointments] = useState<{
    pending: Appointment[];
    confirmed: Appointment[];
    today: Appointment[];
    completed: Appointment[];
    cancelled: Appointment[];
  }>({
    pending: [],
    confirmed: [],
    today: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refetch when switching to completed tab to get latest data
  useEffect(() => {
    if (activeTab === 'completed') {
      fetchAppointments();
    }
  }, [activeTab]);

  async function fetchAppointments() {
    try {
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch appointments
      const response = await fetch(`/api/doctor/appointments?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        console.log('API Response:', data.appointments);
        console.log('Completed from API:', data.appointments.completed);
        console.log('Cancelled from API:', data.appointments.cancelled);
        
        // API now provides completed and cancelled directly
        setAppointments({
          pending: data.appointments.pending || [],
          confirmed: data.appointments.confirmed || [],
          today: data.appointments.today || [],
          completed: data.appointments.completed || [],
          cancelled: data.appointments.cancelled || [],
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  async function confirmAppointment(aid: string) {
    try {
      const response = await fetch('/api/doctor/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aid, status: 'confirmed' }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Appointment confirmed');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Failed to confirm appointment');
    }
  }

  async function changeStatus(aid: string, newStatus: string) {
    try {
      const response = await fetch('/api/doctor/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aid, status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function deleteAppointment(aid: string) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    try {
      const response = await fetch(`/api/doctor/appointments?aid=${aid}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Appointment deleted');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  }

  async function updateAppointmentStatus(aid: string, status: string) {
    try {
      const response = await fetch('/api/doctor/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aid, status }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Appointment ${status}`);
        fetchAppointments(); // Refresh
      } else {
        toast.error('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  }

  async function assignToken(aid: string) {
    try {
      const tokenInput = document.getElementById(`token-${aid}`) as HTMLInputElement;
      const positionInput = document.getElementById(`position-${aid}`) as HTMLInputElement;
      
      const tokenNumber = parseInt(tokenInput?.value || '0');
      const queuePosition = parseInt(positionInput?.value || '0');

      if (!tokenNumber || !queuePosition) {
        toast.error('Please enter both token number and queue position');
        return;
      }

      const response = await fetch(`/api/doctor/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aid,
          token_number: tokenNumber,
          queue_position: queuePosition,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Token assigned successfully');
        fetchAppointments(); // Refetch to update UI
      } else {
        toast.error('Failed to assign token');
      }
    } catch (error) {
      console.error('Error assigning token:', error);
      toast.error('Failed to assign token');
    }
  }

  function formatTime(isoString: string | undefined): string {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'pending', label: 'Pending', count: appointments.pending.length },
    { id: 'confirmed', label: 'Confirmed', count: appointments.confirmed.length },
    { id: 'today', label: "Today's Appointments", count: appointments.today.length },
    { id: 'completed', label: 'Completed', count: appointments.completed.length },
    { id: 'cancelled', label: 'Cancelled', count: appointments.cancelled.length },
  ];

  const currentAppointments = appointments[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
        <p className="text-gray-600">Manage your patient consultations</p>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2 rounded-xl inline-flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-lg font-medium smooth-transition ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      {currentAppointments.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No appointments in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentAppointments.map((apt) => (
            <div key={apt.aid} className="glass-card-hover p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Patient Profile Image */}
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {apt.patient?.user?.profile_image_url ? (
                      <img
                        src={apt.patient.user.profile_image_url}
                        alt={apt.patient.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-primary-600" />
                    )}
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                    {apt.mode === 'online' ? (
                      <Video className="w-7 h-7 text-primary-600" />
                    ) : (
                      <MapPin className="w-7 h-7 text-primary-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {apt.patient?.user?.name || 'Patient'}
                      </h3>
                      {apt.payment_status === 'pending' && (
                        <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Free Consultation</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(apt.scheduled_date).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{apt.scheduled_time}</span>
                      </span>
                      <span className="capitalize px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                        {apt.mode}
                      </span>
                    </div>

                    {apt.complaint_description && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Complaint:</span> {apt.complaint_description}
                      </p>
                    )}

                    {/* Detailed timing for completed appointments */}
                    {activeTab === 'completed' && apt.duration_minutes && (
                      <div className="mb-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Start Time</p>
                            <p className="text-sm text-gray-900 font-bold">{formatTime(apt.start_time)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium mb-1">End Time</p>
                            <p className="text-sm text-gray-900 font-bold">{formatTime(apt.end_time)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Call Duration</p>
                            <p className="text-sm text-green-700 font-bold">
                              {Math.floor(apt.duration_minutes)} min {Math.round((apt.duration_minutes % 1) * 60)} sec
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple duration badge for today's completed */}
                    {activeTab === 'today' && apt.status === 'completed' && apt.duration_minutes && (
                      <div className="mb-3 px-4 py-2 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700 font-semibold">
                          Call Duration: {Math.floor(apt.duration_minutes)} min
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Contact: {apt.patient?.user?.phone || apt.patient?.user?.email}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => updateAppointmentStatus(apt.aid, 'confirmed')}
                        className="px-6 py-2 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white rounded-lg hover:shadow-lg smooth-transition flex items-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(apt.aid, 'cancelled')}
                        className="px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 smooth-transition flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {activeTab !== 'completed' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.location.href = `/dashboard/patients/${apt.patient?.pid}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 smooth-transition text-sm"
                      >
                        View Patient
                      </button>
                      
                      {/* Status dropdown for confirmed/completed appointments */}
                      {(apt.status === 'confirmed' || apt.status === 'completed') && (
                        <select
                          value={apt.status}
                          onChange={(e) => changeStatus(apt.aid, e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/50"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                      
                      {/* Delete button */}
                      <button
                        onClick={() => deleteAppointment(apt.aid)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 smooth-transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {activeTab === 'today' && apt.status !== 'completed' && (
                    <>
                      {apt.mode === 'online' ? (
                        <button
                          onClick={() => window.location.href = `/dashboard/video-call/${apt.aid}`}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition flex items-center space-x-2"
                        >
                          <Video className="w-5 h-5" />
                          <span>Start Video Call</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/dashboard/prescriptions/new?aid=${apt.aid}`)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:shadow-lg smooth-transition flex items-center space-x-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Meeting Over</span>
                        </button>
                      )}
                    </>
                  )}
                  {activeTab === 'today' && apt.status === 'completed' && (
                    <div className="text-sm text-gray-500 italic">
                      Call completed • Cannot reconnect
                    </div>
                  )}
                  {/* Show duration badge in completed */}
                  {activeTab === 'completed' && apt.duration_minutes && (
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      {Math.floor(apt.duration_minutes)} min call
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
