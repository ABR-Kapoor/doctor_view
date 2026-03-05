'use client';

import { useState } from 'react';
import { Sparkles, Loader2, User, Award, MapPin, Menu, X, Stethoscope, Users, BarChart3, FileText, Shield } from 'lucide-react';
import { LoginLink, RegisterLink, LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Link from 'next/link';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useKindeBrowserClient();

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/landing-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Blue/Cyan overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-50/30 to-cyan-50/35"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg relative z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/Logos/logo_transparent.png" alt="AuraSutra" className="h-10" />
              <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Alatsi, sans-serif' }}>AuraSutra</span>
              <span className="text-sm text-blue-600 ml-2 font-semibold">Doctor</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="px-4 py-2 font-medium text-blue-600 hover:text-blue-700">
                    Dashboard
                  </Link>
                  <LogoutLink className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">
                    Log out
                  </LogoutLink>
                </div>
              ) : (
                <>
                  <LoginLink className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium smooth-transition">
                    Sign In
                  </LoginLink>
                  <RegisterLink className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 smooth-transition flex items-center space-x-2">
                    <span>Register as Doctor</span>
                    <span>→</span>
                  </RegisterLink>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden pt-4 pb-4 border-t border-gray-100 mt-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="w-full text-center px-4 py-3 bg-blue-50 rounded-xl text-blue-700 font-medium">
                    Go to Dashboard
                  </Link>
                  <LogoutLink className="w-full text-center px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl">
                    Log out
                  </LogoutLink>
                </>
              ) : (
                <>
                  <LoginLink className="w-full text-center px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium">
                    Sign In
                  </LoginLink>
                  <RegisterLink className="w-full text-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                    <span>Register as Doctor</span>
                    <span>→</span>
                  </RegisterLink>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-14 md:pt-24 md:pb-20 px-4 md:px-8 w-full overflow-hidden">
        <div className="container mx-auto max-w-[1400px]">
          {/* Badge */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm border border-blue-100 text-blue-800 px-3 py-1 md:px-4 md:py-1.5 rounded-full mb-6 md:mb-8 shadow-sm hover:bg-blue-100/80 smooth-transition cursor-default select-none">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 animate-pulse" />
              <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
                Professional Healthcare Platform
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-tight break-words">
              <span className="block text-gray-900">
                Empower Your Practice,
              </span>
              <span className="block">
                <span className="text-gray-900">Transform </span>
                <span className="relative inline-block">
                  <span className="font-black text-blue-600">Patient Care.</span>
                </span>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-xl text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              Manage patients, conduct video consultations, create AI-powered prescriptions, and track treatment progress—all in one comprehensive platform
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in max-w-xl mx-auto">
            <RegisterLink className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 smooth-transition text-center">
              Join as Doctor
            </RegisterLink>
            <Link
              href="#features"
              className="w-full sm:w-auto px-10 py-4 bg-white/70 backdrop-blur-xl text-gray-700 rounded-2xl font-black text-lg hover:shadow-xl smooth-transition text-center border border-white/50"
            >
              Explore Features
            </Link>
          </div></div>
      </section>

      {/* Features Section */}
      {!isMenuOpen && (
        <section id="features" className="pt-16 pb-20 md:pt-28 md:pb-24 px-4 md:px-8 w-full overflow-hidden">
          <div className="container mx-auto max-w-[1300px]">
            {/* Centered Heading */}
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 md:mb-4">
                Complete Practice <span className="text-blue-600">Management</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg px-2">
                Everything you need to provide exceptional Ayurvedic care with modern technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: <Users className="w-6 h-6 text-blue-500" />,
                  title: 'Patient Management',
                  description: 'Complete patient records with health progress tracking and appointment history.',
                },
                {
                  icon: <Stethoscope className="w-6 h-6 text-blue-500" />,
                  title: 'Video Consultations',
                  description: 'HD video calls with in-consultation prescription creation and secure communication.',
                },
                {
                  icon: <FileText className="w-6 h-6 text-blue-500" />,
                  title: 'AI-Powered Prescriptions',
                  description: 'Generate prescriptions with Google Gemini assistance for accurate treatment plans.',
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
                  title: 'Dashboard Analytics',
                  description: 'Track revenue, appointments, and practice growth with comprehensive insights.',
                },
                {
                  icon: <Award className="w-6 h-6 text-blue-500" />,
                  title: 'Progress Analytics',
                  description: 'Visualize patient adherence and treatment outcomes with detailed reports.',
                },
                {
                  icon: <Shield className="w-6 h-6 text-blue-500" />,
                  title: 'Secure & Compliant',
                  description: 'HIPAA-compliant data encryption and privacy protection for all patient data.',
                },
              ].map((feature, index) => (
                <div key={index} className="relative bg-white/60 backdrop-blur-lg p-6 md:p-8 lg:p-10 rounded-[2rem] shadow-sm hover:shadow-md smooth-transition border border-white/40 flex flex-col items-start text-left h-full hover:bg-white/70 overflow-hidden group">
                  {/* Texture Overlay */}
                  <div className="absolute inset-0 bg-[url('/landing-bg.jpg')] bg-cover opacity-100 pointer-events-none z-0 group-hover:opacity-100 smooth-transition mix-blend-overlay"></div>
                  
                  <div className="relative z-10 p-3 rounded-2xl bg-blue-50/90 mb-4 md:mb-6 inline-flex items-center justify-center backdrop-blur-sm shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="relative z-10 text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                    {feature.title}
                  </h3>
                  <p className="relative z-10 text-gray-600 leading-relaxed text-sm font-medium">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-6 px-6 bg-[#2563EB] text-white">
        <div className="container mx-auto text-center">
          <p className="text-sm font-normal">
            © 2026 AuraSutra Doctor Portal. Professional Healthcare Simplified.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
