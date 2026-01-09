'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Pill, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PrescriptionProgressPage() {
  const params = useParams();
  const prescriptionId = params.prescription_id as string;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchProgressData();

    // Poll for real-time updates every 5 seconds
    const interval = setInterval(() => {
        fetchProgressData();
    }, 5000);

    return () => clearInterval(interval);
  }, [prescriptionId]);

  async function fetchProgressData() {
    try {
      const response = await fetch(`/api/doctor/adherence/${prescriptionId}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats || stats.total_doses === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/prescriptions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Adherence Progress</h1>
            <p className="text-gray-600">Track patient medication adherence</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Adherence Data Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Adherence tracking will appear once records are created for this prescription.
              Make sure the adherence function is enabled in the database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/prescriptions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center space-x-4">
           {stats.patient?.profile_image_url && (
              <img src={stats.patient.profile_image_url} alt="Patient" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
           )}
           <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {stats.patient?.name ? `${stats.patient.name}'s Progress` : 'Adherence Progress'}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-gray-600">Patient medication tracking</p>
                <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live • Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-xl text-center">
          <Pill className="w-12 h-12 text-blue-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.total_doses}</p>
          <p className="text-sm text-gray-600 mt-1">Total Doses</p>
        </div>
        <div className="glass-card p-6 rounded-xl text-center bg-green-50">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-green-700">{stats.taken}</p>
          <p className="text-sm text-gray-600 mt-1">Taken</p>
        </div>
        <div className="glass-card p-6 rounded-xl text-center bg-red-50">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-red-700">{stats.skipped}</p>
          <p className="text-sm text-gray-600 mt-1">Skipped</p>
        </div>
        <div className="glass-card p-6 rounded-xl text-center bg-primary-50">
          <TrendingUp className="w-12 h-12 text-primary-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-primary-700">{stats.adherence_rate}%</p>
          <p className="text-sm text-gray-600 mt-1">Adherence Rate</p>
        </div>
      </div>

      {/* Medicine-wise Breakdown */}
      {stats.medicine_breakdown && stats.medicine_breakdown.length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Pill className="w-5 h-5 text-primary-600" />
            <span>Medicine-wise Adherence</span>
          </h2>
          <div className="space-y-3">
            {stats.medicine_breakdown.map((med: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{med.medicine_name}</h3>
                  <span className="text-primary-700 font-bold">{med.adherence_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${med.adherence_rate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {med.taken} of {med.total} doses taken
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      {stats.daily_breakdown && stats.daily_breakdown.length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Adherence</h2>
          <div className="space-y-2">
            {stats.daily_breakdown.map((day: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 w-32">
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className="flex-1 flex items-center space-x-2">
                  {day.taken > 0 && (
                    <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{day.taken}</span>
                    </div>
                  )}
                  {day.skipped > 0 && (
                    <div className="flex items-center space-x-1 bg-red-100 px-3 py-1 rounded">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">{day.skipped}</span>
                    </div>
                  )}
                  {day.pending > 0 && (
                    <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{day.pending}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {stats.recent_activity.slice(0, 5).map((activity: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {activity.is_taken ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900">{activity.medicine_name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(activity.taken_at || activity.skipped_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
