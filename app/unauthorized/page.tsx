'use client';

import { useEffect } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-red-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-gray-900 text-center mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <p className="text-gray-800 text-center font-medium mb-3">
              This is the <span className="font-black text-red-600">Doctor Portal</span>
            </p>
            <p className="text-gray-700 text-center text-sm">
              Your account is registered as a <span className="font-bold">Patient</span>. 
              You cannot access the doctor portal with a patient account.
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-700 text-center">
              Please use the <span className="font-bold text-blue-600">Patient Portal</span> to access your account.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="http://localhost:3000/dashboard"
              className="w-full py-3 px-6 bg-gradient-to-r from-primary-600 to-emerald-600 text-white rounded-2xl font-bold hover:shadow-lg smooth-transition flex items-center justify-center space-x-2"
            >
              <span>Go to Patient Portal</span>
            </a>

            <Link
              href="/"
              className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 smooth-transition flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
