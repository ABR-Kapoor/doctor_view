'use client';

import { useEffect, useState } from 'react';
import { Users, Search, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Patient {
  pid: string;
  uid: string;
  adherenceRate: number;
  user: {
    name: string;
    email: string;
    phone: string;
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
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch patients
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Patients</h1>
        <p className="text-gray-600">View and manage patient records</p>
      </div>

      <div className="glass-card p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by name..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No patients found' : 'No patients yet'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredPatients.map((patient) => {
            const chartData = [
              { name: 'Taken', value: patient.adherenceRate },
              { name: 'Missed', value: 100 - patient.adherenceRate },
            ];

            return (
              <Link
                key={patient.pid}
                href={`/dashboard/patients/${patient.pid}`}
                className="glass-card-hover p-6 rounded-2xl block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-primary-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {patient.user?.name || 'Patient'}
                      </h3>
                      <p className="text-sm text-gray-600">{patient.user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{patient.user?.phone}</p>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-secondary-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {patient.adherenceRate}% Adherence Rate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="w-20 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={35}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
