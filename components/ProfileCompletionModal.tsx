'use client';

import { useRouter } from 'next/navigation';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  percentage: number;
  missingFields: string[];
  userType: 'doctor' | 'clinic' | 'patient';
  onDismiss?: () => void; // Only for patients
  onProfileUpdate?: () => void; // Callback to re-check profile after updates
  onCompleteProfile?: () => void; // Custom handler for Complete Profile button
}

export default function ProfileCompletionModal({
  isOpen,
  percentage,
  missingFields,
  userType,
  onDismiss,
  onProfileUpdate,
  onCompleteProfile,
}: ProfileCompletionModalProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 100);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canDismiss = userType === 'patient' && onDismiss;
  const isBlocking = userType === 'doctor' || userType === 'clinic';

  const handleCompleteProfile = () => {
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      router.push('/dashboard/profile?incomplete=true');
    }
  };

  const handleDismiss = () => {
    if (canDismiss && onDismiss) {
      setShow(false);
      setTimeout(() => onDismiss(), 300);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        show ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={canDismiss ? handleDismiss : undefined}
    >
      <div
        className={`relative max-w-md w-full bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-600 to-emerald-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            {canDismiss && (
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-black">
                {isBlocking ? 'Complete Your Profile' : 'Profile Incomplete'}
              </h2>
            </div>
            <p className="text-white/90 text-sm">
              {isBlocking
                ? 'Please complete your profile to access all features'
                : 'Complete your profile for a better experience'}
            </p>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center -mt-12 mb-6 relative z-20">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                className="text-primary-600 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-lg">
                <div>
                  <div className="text-3xl font-black text-primary-600">{percentage}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Fields */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Missing Information:</h3>
          <div className="space-y-2 mb-6">
            {missingFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
                <span>{field}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCompleteProfile}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
            >
              Complete Profile Now
            </button>
            {canDismiss && (
              <button
                onClick={handleDismiss}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Remind Me Later
              </button>
            )}
          </div>

          {isBlocking && (
            <p className="text-xs text-center text-gray-500 mt-4">
              ⚠️ You must complete your profile to use the application
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
