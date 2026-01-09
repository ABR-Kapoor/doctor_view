'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, Pill, TrendingUp, User, Clock, CheckCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingRequests: number;
  activePrescriptions: number;
  pendingApprovals: number;
  monthlyRevenue: number;
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    activePrescriptions: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0,
  });
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [patientsData, setPatientsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Doctor');
  const [profileImage, setProfileImage] = useState('');
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Sync user first
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();
      
      if (user) {
        setUserName(user.name || 'Doctor');
        if (user.profile_image_url) {
          setProfileImage(user.profile_image_url);
        }
        
        // Fetch dashboard stats
        const response = await fetch(`/api/doctor/dashboard?uid=${user.uid}`);
        const data = await response.json();

        if (data.success) {
          setStats({
            todayAppointments: data.todayAppointments || 0,
            totalPatients: data.totalPatients || 0,
            pendingRequests: data.pendingRequests || 0,
            activePrescriptions: data.activePrescriptions || 0,
            pendingApprovals: data.pendingApprovals || 0,
            monthlyRevenue: data.monthlyRevenue || 0,
          });
          setAppointmentsData(data.appointmentsData || []); // Keep fetching for charts
          setPatientsData(data.patientsData || []); // Keep fetching for charts
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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

  return (
    <div className="space-y-6">
      {/* Welcome Header with Profile */}
      <div className="glass-card p-8 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {greeting}, Dr. {userName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your practice today</p>
          </div>
        </div>
      </div>

      {/* Pending Requests Notification */}
      {stats.pendingRequests > 0 && (
        <Link 
          href="/dashboard/appointments?tab=pending"
          className="glass-card p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 hover:shadow-lg smooth-transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">
                  {stats.pendingRequests} Pending Appointment{stats.pendingRequests !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-amber-700">Click to review and confirm requests</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 smooth-transition">
              Review Now →
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Patients</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
        </div>

        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary-600" />
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Today's Appointments</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</p>
          <Link
            href="/dashboard/appointments"
            className="text-xs text-secondary-600 hover:underline mt-2 block"
          >
            View schedule →
          </Link>
        </div>

        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-accent-600" />
            </div>
            {stats.pendingApprovals > 0 && (
              <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full">
                Action Required
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Approvals</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
          {stats.pendingApprovals > 0 && (
            <Link
              href="/dashboard/appointments"
              className="text-xs text-accent-600 hover:underline mt-2 block"
            >
              Review now →
            </Link>
          )}
        </div>

        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-rose-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">
            ₹{(stats.monthlyRevenue / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      {/* Charts Section */}
      {appointmentsData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Appointments per Month */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Appointments Overview
              </h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appointmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Patients Growth */}
          {patientsData.length > 0 && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Patient Growth
                </h2>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={patientsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
