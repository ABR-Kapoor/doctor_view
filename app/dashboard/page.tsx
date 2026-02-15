'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, Pill, TrendingUp, User, Clock, CheckCircle, DollarSign, Activity, FileText } from 'lucide-react';
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
import { TranslatedText } from '@/app/components/TranslatedText';

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
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    setCurrentDate(date);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      {/* Header Section */}
      <div className="glass-panel p-6 flex items-center gap-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg shrink-0 relative z-10">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-600">
              <User className="w-10 h-10" />
            </div>
          )}
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-teal-950">
            <TranslatedText>{greeting}</TranslatedText>, <TranslatedText>Dr.</TranslatedText> {userName}
          </h1>
          <p className="text-teal-700/60 font-medium mt-1 text-lg">
            <TranslatedText>Here's what's happening with your practice today</TranslatedText>
          </p>
        </div>
      </div>

      {/* Main Grid Layout - Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Upcoming Appointments */}
        <div className="glass-panel p-6 flex flex-col justify-between hover-card group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <Link href="/dashboard/appointments" className="text-gray-400 hover:text-teal-600 transition-colors">
              →
            </Link>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-bold text-gray-800 mb-1">{stats.todayAppointments}</h3>
            <p className="text-gray-500 font-medium text-sm"><TranslatedText>Upcoming Appointments</TranslatedText></p>
            <p className="text-teal-600 text-xs mt-2 font-medium"><TranslatedText>View Schedule</TranslatedText></p>
          </div>
        </div>

        {/* Card 2: Active Prescriptions */}
        <div className="glass-panel p-6 flex flex-col justify-between hover-card group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Pill className="w-6 h-6" />
            </div>
            <Link href="/dashboard/prescriptions" className="text-gray-400 hover:text-emerald-600 transition-colors">
              →
            </Link>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-bold text-gray-800 mb-1">{stats.activePrescriptions}</h3>
            <p className="text-gray-500 font-medium text-sm"><TranslatedText>Active Prescriptions</TranslatedText></p>
            <p className="text-emerald-600 text-xs mt-2 font-medium"><TranslatedText>Manage Refills</TranslatedText></p>
          </div>
        </div>

        {/* Card 3: Total Patients (Activity) */}
        <div className="glass-panel p-6 flex flex-col justify-between hover-card group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-gray-400">...</div>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-bold text-gray-800 mb-1">{stats.totalPatients}</h3>
            <p className="text-gray-500 font-medium text-sm"><TranslatedText>Total Patients</TranslatedText></p>
            <div className="h-1 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500 w-3/4 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 4: Revenue / Approvals (Adherence Style) */}
        <div className="glass-panel p-6 flex flex-col justify-between hover-card group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              {stats.pendingApprovals > 0 ? <CheckCircle className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-lg text-gray-500"><TranslatedText>Monthly</TranslatedText></span>
          </div>
          <div className="mt-4">
            {stats.pendingApprovals > 0 ? (
              <>
                <h3 className="text-4xl font-bold text-gray-800 mb-1">{stats.pendingApprovals}</h3>
                <p className="text-gray-500 font-medium text-sm"><TranslatedText>Pending Approvals</TranslatedText></p>
                <Link href="/dashboard/appointments" className="text-orange-500 text-xs mt-2 font-bold"><TranslatedText>Action Required</TranslatedText></Link>
              </>
            ) : (
              <>
                <h3 className="text-4xl font-bold text-gray-800 mb-1">{(stats.monthlyRevenue / 1000).toFixed(1)}K</h3>
                <p className="text-gray-500 font-medium text-sm"><TranslatedText>Revenue (INR)</TranslatedText></p>
                <p className="text-green-600 text-xs mt-2 font-medium"><TranslatedText>+12% this month</TranslatedText></p>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section - Charts & Additional Data */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Chart 1 */}
        <div className="lg:col-span-1 glass-panel p-6 bg-blue-theme">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-black"><TranslatedText>Appointments</TranslatedText></h3>
            <div className="p-2 bg-black/5 rounded-full text-black">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          {appointmentsData.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" hide />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: 'black' }}
                  />
                  <Bar dataKey="count" fill="#374151" radius={[6, 6, 6, 6]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm"><TranslatedText>No data</TranslatedText></div>
          )}
        </div>

        {/* Chart 2 / Info */}
        <div className="lg:col-span-2 glass-panel p-6 bg-blue-theme">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-black"><TranslatedText>Patient Growth</TranslatedText></h3>
            <Link href="/dashboard/patients" className="text-sm text-gray-700 font-medium hover:text-black hover:underline">
              <TranslatedText>View All</TranslatedText>
            </Link>
          </div>
          {patientsData.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patientsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#000000" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#000000" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: 'black' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke="#111827"
                    strokeWidth={3}
                    dot={{ fill: '#111827', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm"><TranslatedText>No data</TranslatedText></div>
          )}
        </div>
      </div>
    </div>
  );
}

