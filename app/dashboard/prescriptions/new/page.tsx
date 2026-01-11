'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Pill, Plus, X, ArrowLeft, Sparkles, Loader2, User, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function NewPrescriptionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const pid = searchParams.get('pid');
  const aid = searchParams.get('aid');
  
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(pid || '');
  const [patientName, setPatientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [dietAdvice, setDietAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientName();
    }
  }, [selectedPatientId]);

  async function fetchPatients() {
    try {
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) return;

      // Get doctor profile
      const profileResponse = await fetch(`/api/doctor/profile?uid=${user.uid}`);
      const profileData = await profileResponse.json();
      
      if (!profileData.success) return;

      // Fetch doctor's patients
      const response = await fetch(`/api/doctor/patients?did=${profileData.doctor.did}`);
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }

  async function fetchPatientName() {
    try {
      const response = await fetch(`/api/doctor/patients/${selectedPatientId}`);
      const data = await response.json();
      if (data.success && data.patient) {
        setPatientName(data.patient.user.name);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  }

  function addMedicine() {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  }

  function removeMedicine(index: number) {
    setMedicines(medicines.filter((_, i) => i !== index));
  }

  function updateMedicine(index: number, field: keyof Medicine, value: string) {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!diagnosis || medicines.some(m => !m.name || !m.dosage)) {
      toast.error('Please fill in diagnosis and all medicine fields');
      return;
    }

    setLoading(true);
    try {
      // Sync user first
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      // Get doctor ID
      const profileResponse = await fetch(`/api/doctor/profile?uid=${user.uid}`);
      const profileData = await profileResponse.json();
      
      if (!profileData.success) {
        toast.error('Failed to get doctor profile');
        return;
      }

      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pid: selectedPatientId,
          did: profileData.doctor.did,
          aid: aid || null,
          diagnosis,
          symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
          medicines,
          instructions,
          diet_advice: dietAdvice,
          follow_up_date: followUpDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Prescription created successfully!');
        router.push('/dashboard/prescriptions');
      } else {
        toast.error(data.error || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    } finally {
      setLoading(false);
    }
  }

  async function generateWithAI() {
    if (!selectedPatientId) {
      toast.error('Please select a patient for AI generation');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: selectedPatientId, aid: aid || null }),
      });

      const data = await response.json();

      if (data.success) {
        // Populate form with AI-generated data
        setDiagnosis(data.diagnosis || '');
        setSymptoms(data.symptoms?.join(', ') || '');
        setMedicines(data.medicines || [{ name: '', dosage: '', frequency: '', duration: '' }]);
        setInstructions(data.instructions || '');
        setDietAdvice(data.dietAdvice || '');
        setFollowUpDate(data.followUpDate || '');
        
        toast.success('✨ Prescription generated by Dr. Manas AI!');
      } else {
        toast.error(data.error || 'Failed to generate prescription');
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      toast.error('Failed to generate prescription with AI');
    } finally {
      setAiGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Prescription</h1>
          <p className="text-gray-600">
            {patientName ? `For ${patientName}` : 'Create prescription for patient'}
          </p>
        </div>
      </div>

      {/* AI Loading Overlay */}
      {aiGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm">
          <div className="text-center">
            {/* Floating Pills Animation */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-12 h-6 rounded-full animate-float"
                  style={{
                    background: `linear-gradient(135deg, ${['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'][i]}, ${['#FF8E8E', '#6EDDD5', '#67C9E3', '#FFB89C', '#BADEDA', '#F9E896', '#CDA5D8', '#A7D3F4'][i]})`,
                    left: `${Math.random() * 200}px`,
                    top: `${Math.random() * 200}px`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
              <Loader2 className="w-20 h-20 text-white animate-spin mx-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            {/* Loading Text */}
            <div className="text-white space-y-3">
              <h3 className="text-2xl font-bold flex items-center justify-center space-x-2">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span>Dr. Manas AI is analyzing...</span>
              </h3>
              <p className="text-purple-200 animate-pulse">
                Reviewing patient history, symptoms, and creating personalized prescription
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Selector */}
      {!pid && (
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-primary-600" />
            <span>Select Patient</span>
          </h2>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patients by name..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {/* Patient List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {patients
                .filter(p => p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((patient) => (
                  <button
                    key={patient.pid}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(patient.pid);
                      setSearchTerm('');
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPatientId === patient.pid
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        {patient.user?.profile_image_url ? (
                          <img
                            src={patient.user.profile_image_url}
                            alt={patient.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{patient.user?.name}</p>
                        <p className="text-sm text-gray-500">{patient.user?.email}</p>
                      </div>
                      {selectedPatientId === patient.pid && (
                        <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              {patients.filter(p => p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <p className="text-center text-gray-500 py-8">No patients found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Button */}
      <button
        type="button"
        onClick={generateWithAI}
        disabled={aiGenerating || !selectedPatientId}
        className="w-full p-6 glass-card rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
      >
        <Sparkles className="w-6 h-6" />
        <span>Generate with Dr. Manas AI</span>
        {!selectedPatientId && <span className="text-sm font-normal">(Select a patient first)</span>}
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Diagnosis */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Diagnosis & Symptoms</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis *
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Enter diagnosis"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms (comma separated)
              </label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Fever, Cough, Headache"
              />
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <Pill className="w-5 h-5 text-primary-600" />
              <span>Medicines</span>
            </h2>
            <button
              type="button"
              onClick={addMedicine}
              className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((medicine, index) => (
              <div key={index} className="relative p-4 bg-gray-50 rounded-xl">
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50"
                      placeholder="e.g., Paracetamol"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50"
                      placeholder="e.g., Twice daily"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50"
                      placeholder="e.g., 7 days"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions & Diet */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Instructions</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Any special instructions for the patient..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Advice
              </label>
              <textarea
                value={dietAdvice}
                onChange={(e) => setDietAdvice(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Dietary recommendations..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 smooth-transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
