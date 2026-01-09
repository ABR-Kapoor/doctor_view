'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Pill, Plus, X, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function EditPrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const prescriptionId = params.prescription_id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [dietAdvice, setDietAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  async function fetchPrescription() {
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

      // Fetch prescription
      const response = await fetch(`/api/doctor/prescriptions?did=${profileData.doctor.did}`);
      const data = await response.json();

      if (data.success) {
        const prescription = data.prescriptions.find((p: any) => p.prescription_id === prescriptionId);
        
        if (prescription) {
          setPatientName(prescription.patients?.user?.name || '');
          setDiagnosis(prescription.diagnosis || '');
          setSymptoms(prescription.symptoms?.join(', ') || '');
          setMedicines(prescription.medicines || [{ name: '', dosage: '', frequency: '', duration: '' }]);
          setInstructions(prescription.instructions || '');
          setDietAdvice(prescription.diet_advice || '');
          setFollowUpDate(prescription.follow_up_date || '');
        } else {
          toast.error('Prescription not found');
          router.push('/dashboard/prescriptions');
        }
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      toast.error('Failed to load prescription');
    } finally {
      setLoading(false);
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

    if (!diagnosis || medicines.some(m => !m.name || !m.dosage)) {
      toast.error('Please fill in diagnosis and all medicine fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        toast.success('Prescription updated successfully!');
        router.push('/dashboard/prescriptions');
      } else {
        toast.error(data.error || 'Failed to update prescription');
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast.error('Failed to update prescription');
    } finally {
      setSaving(false);
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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/dashboard/prescriptions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Prescription</h1>
          <p className="text-gray-600">
            {patientName ? `For ${patientName}` : 'Update prescription details'}
          </p>
        </div>
      </div>

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
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/prescriptions')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 smooth-transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
