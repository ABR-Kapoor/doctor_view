'use client';

import { useEffect, useState } from 'react';
import { User, Save, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AYURVEDIC_SPECIALIZATIONS = [
  'General Ayurveda',
  'Panchakarma Specialist',
  'Rasayana (Rejuvenation)',
  'Kayachikitsa (Internal Medicine)',
  'Shalya Tantra (Surgery)',
  'Shalakya Tantra (ENT & Ophthalmology)',
  'Kaumara Bhritya (Pediatrics)',
  'Prasuti Tantra (Gynecology & Obstetrics)',
  'Agada Tantra (Toxicology)',
  'Swasthavritta (Preventive Medicine)',
  'Ayurvedic Dietetics & Nutrition',
  'Yoga & Meditation Therapy',
  'Marma Chikitsa (Vital Points Therapy)',
  'Vajikarana (Aphrodisiac Therapy)',
  'Ayurvedic Dermatology',
  'Ayurvedic Cardiology',
  'Ayurvedic Diabetes Management',
  'Stress & Anxiety Management',
  'Weight Management',
  'Digestive Health Specialist',
  'Joint & Pain Management',
  'Detoxification Expert',
];

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Gujarati'];

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // User data
    name: '',
    phone: '',
    email: '',
    // Doctor data
    specialization: [] as string[],
    custom_specializations: '', // Comma-separated custom specializations
    qualification: '',
    registration_number: '',
    years_of_experience: 0,
    consultation_fee: 500,
    bio: '',
    clinic_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    languages: [] as string[],
  });

  const [uid, setUid] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', uid);

      const response = await fetch('/api/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProfileImage(data.url);
        toast.success('Profile picture updated!');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) {
        setLoading(false);
        return;
      }

      setUid(user.uid);

      // Fetch profile
      const response = await fetch(`/api/doctor/profile?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setProfileImage(data.user?.profile_image_url || '');
        setFormData({
          name: data.user?.name || '',
          phone: data.user?.phone || '',
          email: data.user?.email || '',
          specialization: data.doctor?.specialization || ['General Ayurveda'],
          custom_specializations: data.doctor?.custom_specializations || '',
          qualification: data.doctor?.qualification || '',
          registration_number: data.doctor?.registration_number || '',
          years_of_experience: data.doctor?.years_of_experience || 0,
          consultation_fee: data.doctor?.consultation_fee || 500,
          bio: data.doctor?.bio || '',
          clinic_name: data.doctor?.clinic_name || '',
          address_line1: data.doctor?.address_line1 || '',
          address_line2: data.doctor?.address_line2 || '',
          city: data.doctor?.city || '',
          state: data.doctor?.state || '',
          postal_code: data.doctor?.postal_code || '',
          languages: data.doctor?.languages || ['English', 'Hindi'],
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          user: {
            name: formData.name,
            phone: formData.phone,
          },
          doctor: {
            specialization: formData.specialization,
            custom_specializations: formData.custom_specializations,
            qualification: formData.qualification,
            registration_number: formData.registration_number,
            years_of_experience: formData.years_of_experience,
            consultation_fee: formData.consultation_fee,
            bio: formData.bio,
            clinic_name: formData.clinic_name,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            languages: formData.languages,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function toggleSpecialization(spec: string) {
    if (formData.specialization.includes(spec)) {
      setFormData({
        ...formData,
        specialization: formData.specialization.filter((s) => s !== spec),
      });
    } else {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, spec],
      });
    }
  }

  function toggleLanguage(lang: string) {
    if (formData.languages.includes(lang)) {
      setFormData({
        ...formData,
        languages: formData.languages.filter((l) => l !== lang),
      });
    } else {
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
      });
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Update your professional information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Picture</h2>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-primary-600" />
                )}
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <div
                  onClick={() => document.getElementById('profile-picture-upload')?.click()}
                  className="cursor-pointer px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition inline-flex items-center space-x-2"
                >
                  <User className="w-5 h-5" />
                  <span>{profileImage ? 'Change Picture' : 'Upload Picture'}</span>
                </div>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 5MB. Recommended: Square image, at least 400x400px
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Read-only)
              </label>
              <input
                type="email"
                value={formData.email}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Details</h2>
          
          <div className="grid gap-6">
            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations * (Select multiple)
              </label>
              <div className="grid md:grid-cols-2 gap-2">
                {AYURVEDIC_SPECIALIZATIONS.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium smooth-transition ${
                      formData.specialization.includes(spec)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Specializations (SEO Keywords) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Specializations (SEO Keywords) 💡
              </label>
              <textarea
                value={formData.custom_specializations}
                onChange={(e) => setFormData({ ...formData, custom_specializations: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Chronic Pain Management, Arthritis Treatment, Skin Disorders, Hair Loss Treatment, PCOS, Acidity, Constipation, etc."
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                <strong>💡 SEO Tip:</strong> Add specific conditions, symptoms, or treatments you specialize in (comma-separated). 
                This helps patients find you when they search! Examples: "Migraine, Insomnia, Fertility Issues, Digestive Problems"
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification *
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="BAMS, MD (Ayurveda)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  min="0"
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages (Select multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium smooth-transition ${
                      formData.languages.includes(lang)
                        ? 'bg-secondary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio / About Me
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Tell patients about yourself and your practice..."
              />
            </div>
          </div>
        </div>

        {/* Clinic Details */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Clinic Details</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Name
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
