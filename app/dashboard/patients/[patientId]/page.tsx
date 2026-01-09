'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Calendar, Phone, Mail, Activity, Pill, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientData {
  pid: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  user: {
    name: string;
    email: string;
    phone: string;
    profile_image_url: string;
  };
}

interface Appointment {
  aid: string;
  scheduled_date: string;
  scheduled_time: string;
  mode: string;
  status: string;
  chief_complaint: string;
  duration_minutes: number | null;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pid = params.patientId as string;
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (pid) {
      fetchPatientDetails();
    }
  }, [pid]);

  async function fetchPatientDetails() {
    try {
      const response = await fetch(`/api/doctor/patients/${pid}`);
      const data = await response.json();

      if (data.success) {
        setPatient(data.patient);
        setAppointments(data.appointments || []);
      } else {
        toast.error('Failed to load patient details');
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast.error('Failed to load patient');
    } finally {
      setLoading(false);
    }
  }

  function calculateAge(dob: string) {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Patient not found</p>
        <button
          onClick={() => router.push('/dashboard/patients')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.user.name}</h1>
            <p className="text-gray-600">Complete medical profile</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/prescriptions/new?pid=${pid}`)}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition"
        >
          📝 New Prescription
        </button>
      </div>

      {/* Patient Profile Card */}
      <div className="glass-card p-8 rounded-2xl">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center">
            {patient.user.profile_image_url ? (
              <img
                src={patient.user.profile_image_url}
                alt={patient.user.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary-600" />
            )}
          </div>
          
          <div className="flex-1 grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{patient.user.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{patient.user.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Age: {calculateAge(patient.date_of_birth)} years</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Activity className="w-4 h-4" />
              <span>Blood Group: {patient.blood_group || 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Gender: {patient.gender || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Information Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Allergies */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-red-600" />
            <span>Allergies</span>
          </h3>
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No known allergies</p>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Chronic Conditions</span>
          </h3>
          {patient.chronic_conditions && patient.chronic_conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.chronic_conditions.map((condition, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                >
                  {condition}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No chronic conditions</p>
          )}
        </div>

        {/* Current Medications */}
        <div className="glass-card p-6 rounded-2xl md:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <span>Current Medications</span>
          </h3>
          {patient.current_medications && patient.current_medications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.current_medications.map((medication, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {medication}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No current medications</p>
          )}
        </div>
      </div>

      {/* Appointment History */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Appointment History</h3>
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No appointments yet</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.aid}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{apt.chief_complaint}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(apt.scheduled_date).toLocaleDateString()} at {apt.scheduled_time}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {apt.duration_minutes && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {apt.duration_minutes} min call
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : apt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
