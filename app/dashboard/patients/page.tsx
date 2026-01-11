'use client';

import { useEffect, useState } from 'react';
import { Users, Search, User, Phone, Mail, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Patient {
  pid: string;
  uid: string;
  adherenceRate: number;
  prescriptionCount: number;
  user: {
    name: string;
    email: string;
    phone: string;
    profile_image_url?: string;
  };
  recentAdherence: Array<{ is_taken: boolean }>;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/doctor/patients?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter((patient) =>
    patient.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-black text-gray-900 mb-1">My Patients</h1>
        <p className="text-gray-600 text-sm">View and manage patient records with adherence tracking</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by name..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
          />
        </div>
      </div>

      {/* Patient Cards */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-100">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {searchTerm ? 'No patients found matching your search' : 'No patients yet'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPatients.map((patient) => {
            const adherenceColor = 
              patient.adherenceRate >= 80 ? 'text-green-600' :
              patient.adherenceRate >= 60 ? 'text-amber-600' :
              'text-red-600';

            return (
              <div 
                key={patient.pid}
                className="group relative h-[400px] bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  {patient.user?.profile_image_url ? (
                    <img
                      src={patient.user.profile_image_url}
                      alt={patient.user.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
                      <User className="w-32 h-32 text-white opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>

                {/* Bottom Info (Always Visible) */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10 translate-y-2 group-hover:translate-y-full transition-transform duration-300">
                  <h3 className="text-3xl font-black mb-3 drop-shadow-md truncate">
                    {patient.user?.name}
                  </h3>
                  
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-gray-300" />
                      <span className={`font-bold ${adherenceColor}`}>{patient.adherenceRate}%</span>
                    </div>
                    <span className="text-sm text-gray-300">Adherence</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/40 text-purple-50 border border-purple-300/60 backdrop-blur-md">
                      {patient.prescriptionCount} Prescriptions
                    </span>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center z-20 transform scale-95 group-hover:scale-100">
                  
                  {/* Patient Photo and Name */}
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-white mb-3 shadow-xl">
                    {patient.user?.profile_image_url ? (
                      <img src={patient.user.profile_image_url} className="w-full h-full object-cover" alt={patient.user.name} />
                    ) : (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-purple-600" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-white font-black text-xl mb-4">{patient.user?.name}</h3>

                  {/* Patient Info */}
                  <div className="w-full space-y-3 mb-4">
                    {patient.user?.email && (
                      <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                        <div className="flex items-center space-x-2 text-sm text-white">
                          <Mail className="w-4 h-4 text-blue-300" />
                          <span className="truncate">{patient.user.email}</span>
                        </div>
                      </div>
                    )}
                    
                    {patient.user?.phone && (
                      <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                        <div className="flex items-center space-x-2 text-sm text-white">
                          <Phone className="w-4 h-4 text-green-300" />
                          <span>{patient.user.phone}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Adherence Stats */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/10 w-full mb-4">
                    <div className="text-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-gray-400 mb-1">Adherence</p>
                      <p className={`text-xl font-black ${adherenceColor}`}>{patient.adherenceRate}%</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-gray-400 mb-1">Prescriptions</p>
                      <p className="text-xl font-black text-white">{patient.prescriptionCount}</p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/patients/${patient.pid}`}
                    className="w-full py-3 bg-white/20 border border-white/30 text-white rounded-2xl font-bold text-sm hover:bg-white/30 transition-all"
                  >
                    View Patient Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
