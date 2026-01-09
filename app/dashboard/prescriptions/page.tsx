'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, Send, TrendingUp, Edit, Clock, Trash, Plus, ChevronDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Prescription {
  prescription_id: string;
  diagnosis: string;
  medicines: any[];
  created_at: string;
  sent_to_patient: boolean;
  sent_at: string | null;
  patients: {
    pid: string;
    city: string;
    state: string;
    users: {
      name: string;
      email: string;
      profile_image_url: string;
    };
  };
}

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Stats State
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'schedule' | 'progress'>>({});
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      // Get doctor profile
      const profileResponse = await fetch(`/api/doctor/profile?uid=${user.uid}`);
      const profileData = await profileResponse.json();

      if (!profileData.success) {
        toast.error('Failed to load doctor profile');
        return;
      }

      // Fetch prescriptions
      const response = await fetch(`/api/doctor/prescriptions?did=${profileData.doctor.did}`);
      const data = await response.json();
      console.log('[Dashboard] Adherence Data:', data);

      if (data.success) {
        setPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('✅ Copied to clipboard!');
  }

  async function sendPrescription(prescriptionId: string) {
    setSendingId(prescriptionId);
    try {
      const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}/send`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Prescription sent to patient!');
        fetchPrescriptions(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to send prescription');
      }
    } catch (error) {
      console.error('Error sending prescription:', error);
      toast.error('Failed to send prescription');
    } finally {
      setSendingId(null);
    }
  }

  // Fetch stats when opening modal or switching tab
  const fetchAdherenceStats = async (prescriptionId: string) => {
    setLoadingStats(true);
    try {
      // NOTE: Using the existing doctor API for adherence which returns { adherence: ..., stats: ... }
      const res = await fetch(`/api/doctor/adherence/${prescriptionId}`);
      const data = await res.json();
      
      if (data.success) {
         setStats(prev => ({ 
             ...prev, 
             [prescriptionId]: {
                 overallPercentage: data.stats?.adherence_rate || 0,
                 takenDoses: data.stats?.taken || 0,
                 totalDoses: data.stats?.total_doses || 0,
                 skippedDoses: data.stats?.skipped || 0,
                 breakdown: data.stats?.medicine_breakdown?.map((m: any) => ({
                    medicineName: m.medicine_name,
                    percentage: m.adherence_rate,
                    taken: m.taken,
                    total: m.total
                 })) || []
             }
         }));
      }
    } catch (error) {
       console.error("Failed to fetch doctor stats", error);
       toast.error("Could not load adherence stats");
    } finally {
       setLoadingStats(false);
    }
  };

  async function deletePrescription(prescriptionId: string) {
    if (!confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Prescription deleted successfully');
        fetchPrescriptions(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to delete prescription');
      }
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Failed to delete prescription');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sentPrescriptions = prescriptions.filter(p => p.sent_to_patient);
  const draftPrescriptions = prescriptions.filter(p => !p.sent_to_patient);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage patient prescriptions</p>
        </div>
        <Link
          href="/dashboard/prescriptions/new"
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Prescription</span>
        </Link>
      </div>

      {/* Drafts/Unsent */}
      {draftPrescriptions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span>Draft Prescriptions ({draftPrescriptions.length})</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {draftPrescriptions.map((prescription) => (
              <div
                key={prescription.prescription_id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl aspect-square flex flex-col"
              >
                {/* Main Visual (Patient Image or Placeholder) */}
                <div className="flex-1 relative bg-gray-50 flex flex-col items-center justify-center p-6">
                   <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg mb-4 transform transition-transform duration-500 group-hover:scale-110">
                      {prescription.patients?.users?.profile_image_url ? (
                        <img
                          src={prescription.patients.users.profile_image_url}
                          alt={prescription.patients.users.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                          {prescription.patients?.users?.name?.charAt(0) || '?'}
                        </div>
                      )}
                   </div>
                   <h3 className="font-bold text-lg text-gray-900 text-center px-4 truncate w-full">
                     {prescription.patients?.users?.name || 'Unknown Patient'}
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">{prescription.diagnosis}</p>
                   
                   <span className="absolute top-4 right-4 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                     DRAFT
                   </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-white font-medium mb-1">Created {new Date(prescription.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-200 text-sm mb-6">{prescription.medicines.length} Medicines</p>
                    
                    <div className="flex flex-col space-y-3 w-full max-w-xs">
                       <button
                         onClick={() => router.push(`/dashboard/prescriptions/${prescription.prescription_id}/edit`)}
                         className="py-2.5 px-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                       >
                         <Edit className="w-4 h-4" />
                         <span>Edit Draft</span>
                       </button>
                       <button
                         onClick={() => sendPrescription(prescription.prescription_id)}
                         disabled={sendingId === prescription.prescription_id}
                         className="py-2.5 px-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                       >
                         <Send className="w-4 h-4" />
                         <span>{sendingId === prescription.prescription_id ? 'Sending...' : 'Send Now'}</span>
                       </button>
                       <button
                         onClick={() => deletePrescription(prescription.prescription_id)}
                         className="py-2 px-4 text-red-300 hover:text-red-200 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                       >
                         <Trash className="w-4 h-4" />
                         <span>Delete</span>
                       </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Prescriptions */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Pill className="w-5 h-5 text-primary-600" />
          </div>
          <span>Sent Prescriptions ({sentPrescriptions.length})</span>
        </h2>
        
        {sentPrescriptions.length === 0 ? (
          <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-gray-200">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No sent prescriptions yet</p>
            <Link href="/dashboard/prescriptions/new" className="text-primary-600 hover:underline mt-2 inline-block">
              Create your first prescription
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {sentPrescriptions.map((prescription) => (
              <div
                key={prescription.prescription_id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl aspect-square flex flex-col"
              >
                 {/* Main Visual - Full Cover Image */}
                 <div className="absolute inset-0 bg-gray-100">
                    {prescription.patients?.users?.profile_image_url ? (
                      <img
                        src={prescription.patients.users.profile_image_url}
                        alt={prescription.patients.users.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 text-primary-300">
                        <Pill className="w-20 h-20 opacity-20" />
                         <span className="text-6xl font-black opacity-10 mt-2">
                           {prescription.patients?.users?.name?.charAt(0) || '?'}
                         </span>
                      </div>
                    )}
                 </div>

                 {/* Gradient Overlay for Text Readability (Always Visible at bottom) */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300"></div>

                 {/* Bottom Name Label (Always Visible) */}
                 <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-2 group-hover:translate-y-full transition-transform duration-300 flex flex-col justify-end h-full">
                    <h3 className="font-bold text-2xl mb-1 drop-shadow-md">
                       {prescription.patients?.users?.name || 'Unknown Patient'}
                    </h3>
                    <p className="text-white/80 text-sm font-medium leading-snug break-words drop-shadow-sm">
                       {prescription.diagnosis}
                    </p>
                 </div>

                 {/* Hover Overlay with Actions */}
                 <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center transform scale-95 group-hover:scale-100">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white mb-3 shadow-lg">
                        {prescription.patients?.users?.profile_image_url ? (
                           <img src={prescription.patients.users.profile_image_url} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full bg-gray-200"></div>
                        )}
                    </div>
                    <h3 className="text-white font-black text-3xl mb-2">{prescription.patients?.users?.name}</h3>
                    <p className="text-primary-100 text-lg font-bold mb-8">{prescription.medicines.length} Medicines • Active</p>

                    <div className="flex flex-col space-y-3 w-full max-w-[200px]">
                        <button
                          onClick={() => {
                              setSelectedPrescription(prescription);
                              setActiveTab(prev => ({...prev, [prescription.prescription_id]: 'schedule'}));
                          }}
                          className="w-full py-3 px-4 bg-white text-primary-900 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Open Details</span>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <button
                              onClick={() => router.push(`/dashboard/prescriptions/${prescription.prescription_id}/edit`)}
                              className="py-2.5 px-4 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-md"
                           >
                             <Edit className="w-4 h-4" />
                           </button>
                           <button
                             onClick={() => deletePrescription(prescription.prescription_id)}
                             className="py-2.5 px-4 bg-white/20 text-white rounded-xl font-medium hover:bg-red-500/80 transition-colors flex items-center justify-center backdrop-blur-md"
                           >
                             <Trash className="w-4 h-4" />
                           </button>
                        </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

       {/* Detail Modal (Copied/Adapted from Patient View) */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                       {selectedPrescription.patients?.users?.profile_image_url ? (
                           <img src={selectedPrescription.patients.users.profile_image_url} className="w-full h-full object-cover" />
                       ) : (
                           <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                               {selectedPrescription.patients?.users?.name?.[0]}
                           </div>
                       )}
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-gray-900">{selectedPrescription.patients?.users?.name}</h2>
                       <p className="text-gray-500 text-sm">Diagnosis: {selectedPrescription.diagnosis}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedPrescription(null)}
                   className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                 >
                    <ChevronDown className="w-6 h-6 text-gray-500" />
                 </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                  
                 {/* Tabs Navigation */}
                  <div className="flex justify-center mb-8">
                    <div className="flex space-x-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        <button
                          onClick={() => setActiveTab(prev => ({...prev, [selectedPrescription.prescription_id]: 'schedule'}))}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                            (activeTab[selectedPrescription.prescription_id] || 'schedule') === 'schedule'
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          View Schedule
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab(prev => ({...prev, [selectedPrescription.prescription_id]: 'progress'}));
                            fetchAdherenceStats(selectedPrescription.prescription_id);
                          }}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                            activeTab[selectedPrescription.prescription_id] === 'progress'
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          Progress & Stats
                        </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {(activeTab[selectedPrescription.prescription_id] || 'schedule') === 'schedule' ? (
                      <div className="max-w-2xl mx-auto space-y-6">
                           {/* Medicine List (Read-only for Doctor) */}
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                   <Pill className="w-5 h-5 text-primary-500" />
                                   Prescribed Medicines
                                </h3>
                             </div>

                             <div className="space-y-4">
                                {selectedPrescription.medicines.map((med: any, idx: number) => (
                                   <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                      <div>
                                         <p className="font-bold text-gray-900">{med.name}</p>
                                         <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                                      </div>
                                      <div className="text-right">
                                         <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600">
                                            {med.duration}
                                         </span>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>

                          {/* Instructions Block */}
                          {selectedPrescription.instructions && (
                             <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
                                <h4 className="font-bold text-yellow-800 mb-2 text-sm uppercase tracking-wide">Your Instructions</h4>
                                <p className="text-yellow-900 leading-relaxed">{selectedPrescription.instructions}</p>
                             </div>
                          )}
                      </div>
                  ) : (
                      <div className="max-w-3xl mx-auto space-y-6">
                        {loadingStats ? (
                           <div className="text-center py-24">
                              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-gray-500 font-medium">Fetching patient progress...</p>
                           </div>
                        ) : stats[selectedPrescription.prescription_id] ? (
                           <div className="grid md:grid-cols-2 gap-6">
                              {/* Overall Chart */}
                              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                 <div className="relative w-48 h-48 mb-6">
                                    <svg className="w-full h-full transform -rotate-90">
                                      <circle cx="96" cy="96" r="80" className="stroke-gray-100 fill-none" strokeWidth="16" />
                                      <circle
                                        cx="96" cy="96" r="80"
                                        className={`fill-none transition-all duration-1000 ease-out ${
                                            stats[selectedPrescription.prescription_id]?.overallPercentage >= 80 ? 'stroke-green-500' :
                                            stats[selectedPrescription.prescription_id]?.overallPercentage >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'
                                        }`}
                                        strokeWidth="16"
                                        strokeDasharray="502"
                                        strokeDashoffset={502 - (502 * (stats[selectedPrescription.prescription_id]?.overallPercentage || 0)) / 100}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                       <span className="text-5xl font-black text-gray-900 tracking-tight">{stats[selectedPrescription.prescription_id]?.overallPercentage}%</span>
                                       <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Adherence</span>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-3 gap-4 w-full text-center">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                       <div className="text-2xl font-bold text-gray-900">{stats[selectedPrescription.prescription_id]?.totalDoses}</div>
                                       <div className="text-xs text-gray-500 font-medium">Total Doses</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-xl text-green-700">
                                       <div className="text-2xl font-bold">{stats[selectedPrescription.prescription_id]?.takenDoses}</div>
                                       <div className="text-xs font-medium opacity-80">Taken</div>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-xl text-red-700">
                                       <div className="text-2xl font-bold">{stats[selectedPrescription.prescription_id]?.skippedDoses}</div>
                                       <div className="text-xs font-medium opacity-80">Skipped</div>
                                    </div>
                                 </div>
                              </div>

                              {/* Medicine Breakdown */}
                              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                 <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-gray-400" />
                                    Detailed Breakdown
                                 </h3>
                                 <div className="space-y-6">
                                     {stats[selectedPrescription.prescription_id]?.breakdown?.map((med: any, idx: number) => (
                                        <div key={idx} className="group">
                                           <div className="flex justify-between items-end mb-2">
                                              <div>
                                                 <span className="font-bold text-gray-700 block text-sm">{med.medicineName}</span>
                                                 <span className="text-xs text-gray-400 font-medium">{med.taken}/{med.total} doses</span>
                                              </div>
                                              <span className="font-bold text-primary-600 text-lg">{med.percentage}%</span>
                                           </div>
                                           <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                              <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                                                    med.percentage >= 80 ? 'bg-green-500' : 
                                                    med.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${med.percentage}%` }}
                                              >
                                                 <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                              </div>
                                           </div>
                                        </div>
                                     ))}
                                     {(!stats[selectedPrescription.prescription_id]?.breakdown || stats[selectedPrescription.prescription_id]?.breakdown.length === 0) && (
                                         <p className="text-center text-gray-400 py-4">No data available for individual medicines.</p>
                                     )}
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="text-center py-24">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <TrendingUp className="w-8 h-8 text-gray-300" />
                              </div>
                              <p className="text-gray-500 font-medium">No progress data available yet.</p>
                           </div>
                        )}
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
