'use client';

import { useEffect, useState } from 'react';
import { Calendar, Video, MapPin, Check, X, Clock, User, CheckCircle, ChevronDown, Phone, Mail, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { TranslatedText } from '../../components/TranslatedText';

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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<{doctor: string, specs: string[]} | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refetch when switching to completed tab to get latest data
  useEffect(() => {
    if (activeTab === 'completed') {
      fetchAppointments();
    }
  }, [activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

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
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-black text-gray-900 mb-1"><TranslatedText>Consultation Schedule</TranslatedText></h1>
        <p className="text-gray-600 text-sm"><TranslatedText>Manage your appointments and patient consultations</TranslatedText></p>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 inline-flex space-x-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <TranslatedText>{tab.label}</TranslatedText>
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-primary-100 text-primary-600'
              }`}>
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
          <p className="text-gray-500"><TranslatedText>No appointments in this category</TranslatedText></p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentAppointments.map((apt) => {
            // Determine status color overlay
            const getStatusOverlay = () => {
              switch(apt.status) {
                case 'confirmed': return 'bg-green-500/5';
                case 'pending': return 'bg-amber-500/5';
                case 'cancelled': return 'bg-red-500/5';
                case 'completed': return 'bg-blue-500/5';
                default: return 'bg-gray-500/5';
              }
            };
            
            const getStatusBorder = () => {
              switch(apt.status) {
                case 'confirmed': return 'border-green-200';
                case 'pending': return 'border-amber-200';
                case 'cancelled': return 'border-red-200';
                case 'completed': return 'border-blue-200';
                default: return 'border-gray-200';
              }
            };
            
            return (
            <div 
              key={apt.aid} 
              className={`relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-2 ${getStatusBorder()}`}
            >
              {/* Status Color Overlay */}
              <div className={`absolute inset-0 ${getStatusOverlay()} pointer-events-none z-0`} />
              
              {/* Card Content */}
              <div className="relative z-10 p-6 space-y-4">
                {/* Patient Info Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                      {apt.patient?.user?.profile_image_url ? (
                        <img
                          src={apt.patient.user.profile_image_url}
                          alt={apt.patient.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-primary-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        <TranslatedText>{apt.patient?.user?.name || 'Patient'}</TranslatedText>
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`p-1.5 rounded-lg ${apt.mode === 'online' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                          {apt.mode === 'online' ? <Video className="w-3 h-3 text-blue-600" /> : <MapPin className="w-3 h-3 text-emerald-600" />}
                        </div>
                        <span className="text-xs font-bold text-gray-500 capitalize"><TranslatedText>{apt.mode}</TranslatedText></span>
                      </div>
                      {apt.patient?.user?.phone && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{apt.patient.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    apt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                    apt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <TranslatedText>{apt.status}</TranslatedText>
                  </span>
                </div>
                
                {/* Appointment Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      <TranslatedText>{new Date(apt.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</TranslatedText>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{apt.scheduled_time}</span>
                  </div>
                </div>
                
                {/* Complaint Description */}
                {apt.complaint_description && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-1"><TranslatedText>Patient's Complaint</TranslatedText></p>
                    <p className="text-sm text-gray-700 line-clamp-2"><TranslatedText>{apt.complaint_description}</TranslatedText></p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => updateAppointmentStatus(apt.aid, 'confirmed')}
                        className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span><TranslatedText>Confirm</TranslatedText></span>
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(apt.aid, 'cancelled')}
                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                      >
                        <TranslatedText>Decline</TranslatedText>
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'today' && apt.status !== 'completed' && (
                    <button
                      onClick={() => {
                        if (apt.mode === 'online') {
                          window.location.href = `/dashboard/video-call/${apt.aid}`;
                        } else {
                          router.push(`/dashboard/prescriptions/new?aid=${apt.aid}`);
                        }
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center space-x-1"
                    >
                      {apt.mode === 'online' ? <Video className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      <span><TranslatedText>{apt.mode === 'online' ? 'Start Call' : 'Complete Visit'}</TranslatedText></span>
                    </button>
                  )}
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === apt.aid ? null : apt.aid);
                      }}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown Menu - Smart Positioning */}
                    {openDropdown === apt.aid && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              window.location.href = `/dashboard/patients/${apt.patient?.pid}`;
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <TranslatedText>View Patient History</TranslatedText>
                          </button>
                          {apt.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setOpenDropdown(null);
                                changeStatus(apt.aid, 'completed');
                              }}
                              className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <TranslatedText>Mark as Completed</TranslatedText>
                            </button>
                          )}
                          {apt.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setOpenDropdown(null);
                                changeStatus(apt.aid, 'cancelled');
                              }}
                              className="w-full px-4 py-2 text-left text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <TranslatedText>Cancel Appointment</TranslatedText>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              deleteAppointment(apt.aid);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                          >
                            <TranslatedText>Delete Record</TranslatedText>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
