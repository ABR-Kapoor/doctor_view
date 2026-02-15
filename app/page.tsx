'use client';

import Link from 'next/link';
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { Activity, Stethoscope, Users, BarChart3, FileText, Shield } from 'lucide-react';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { TranslatedText } from './components/TranslatedText';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Homepage background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/homepage.png)' }}
        ></div>

        {/* Overlay to reduce intensity by 40% */}
        <div className="absolute inset-0 bg-white/40"></div>

        {/* Organic blob shapes for additional depth */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-sky-200/5 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-blue-200/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-cyan-200/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation - Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/70 border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/Logos/logo_transparent.png" alt="AuraSutra Logo" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">AuraSutra</span>
              <span className="text-sm text-gray-600 ml-2"><TranslatedText>Doctor Portal</TranslatedText></span>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              <LoginLink className="px-6 py-2 text-gray-700 hover:text-sky-600 smooth-transition font-medium">
                <TranslatedText>Sign In</TranslatedText>
              </LoginLink>
              <RegisterLink className="px-6 py-2.5 bg-gradient-to-b from-sky-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-sky-200/50 smooth-transition font-semibold">
                <TranslatedText>Register as Doctor</TranslatedText>
              </RegisterLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-24 px-6 relative">
        <div className="container mx-auto text-center">
          {/* Premium Badge with fill */}
          <div className="inline-flex items-center space-x-2 bg-sky-100/80 backdrop-blur-sm text-sky-700 px-5 py-2.5 rounded-full mb-8 animate-fade-in border border-sky-200/50 shadow-sm">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold"><TranslatedText>Professional Healthcare Platform</TranslatedText></span>
          </div>

          {/* Hero Title - Improved Typography */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-8 animate-fade-in leading-tight">
            <TranslatedText>Empower Your</TranslatedText>{' '}
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"><TranslatedText>Ayurvedic Practice</TranslatedText></span>
          </h1>

          {/* Subtitle - Increased line height */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in leading-relaxed">
            <TranslatedText>Manage patients, conduct video consultations, create prescriptions, and track treatment progress—all in one comprehensive platform.</TranslatedText>
          </p>

          {/* CTA Buttons with Enhanced Shadows */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <RegisterLink className="px-10 py-4 bg-gradient-to-b from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-sky-300/50 smooth-transition text-lg shadow-lg shadow-sky-200/40 hover:scale-105 transform">
              <TranslatedText>Join as Doctor</TranslatedText>
            </RegisterLink>
            <Link
              href="#features"
              className="px-10 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold hover:shadow-xl smooth-transition text-lg border border-gray-200/50 hover:border-sky-300 hover:bg-white"
            >
              <TranslatedText>Explore Features</TranslatedText>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              <TranslatedText>Complete Practice</TranslatedText> <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"><TranslatedText>Management</TranslatedText></span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              <TranslatedText>Everything you need to provide exceptional Ayurvedic care</TranslatedText>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-10 h-10 text-sky-600" />,
                title: 'Patient Management',
                description: 'Complete patient records with health progress tracking',
                color: 'from-sky-500/10 to-blue-500/10',
              },
              {
                icon: <img src="/Logos/logo_emblem_total black+transparent.png" alt="AuraSutra" className="h-10" />,
                title: 'Progress Analytics',
                description: 'Visualize patient adherence and treatment outcomes',
                color: 'from-cyan-500/10 to-sky-500/10',
              },
              {
                icon: <FileText className="w-10 h-10 text-blue-600" />,
                title: 'AI-Powered Prescriptions',
                description: 'Generate prescriptions with Google Gemini assistance',
                color: 'from-blue-500/10 to-indigo-500/10',
              },
              {
                icon: <BarChart3 className="w-10 h-10 text-indigo-600" />,
                title: 'Dashboard Analytics',
                description: 'Track revenue, appointments, and practice growth',
                color: 'from-indigo-500/10 to-purple-500/10',
              },
              {
                icon: <Stethoscope className="w-10 h-10 text-sky-600" />,
                title: 'Video Consultations',
                description: 'HD video calls with in-consultation prescription creation',
                color: 'from-sky-500/10 to-cyan-500/10',
              },
              {
                icon: <Shield className="w-10 h-10 text-cyan-600" />,
                title: 'Secure & Compliant',
                description: 'HIPAA-compliant data encryption and privacy',
                color: 'from-cyan-500/10 to-teal-500/10',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-md border border-white/40 p-8 rounded-2xl group hover:bg-white/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 smooth-transition shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900"><TranslatedText>{feature.title}</TranslatedText></h3>
                <p className="text-gray-600 leading-relaxed"><TranslatedText>{feature.description}</TranslatedText></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 backdrop-blur-md border border-sky-100/50 p-16 rounded-3xl text-center shadow-xl">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
              <TranslatedText>Ready to Transform</TranslatedText> <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"><TranslatedText>Your Practice?</TranslatedText></span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              <TranslatedText>Join the AuraSutra network and provide world-class Ayurvedic care</TranslatedText>
            </p>
            <RegisterLink className="inline-flex px-12 py-5 bg-gradient-to-b from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-sky-300/50 smooth-transition text-lg shadow-lg shadow-sky-200/40 hover:scale-105 transform">
              <TranslatedText>Register Now - Free</TranslatedText>
            </RegisterLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/Logos/logo_transparent.png" alt="AuraSutra Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">AuraSutra</span>
          </div>
          <p className="text-gray-600 mb-4">
            <TranslatedText>Empowering Ayurvedic practitioners with modern technology</TranslatedText>
          </p>
          <p className="text-sm text-gray-500">
            <TranslatedText>© 2026 AuraSutra. All rights reserved.</TranslatedText>
          </p>
        </div>
      </footer>
    </div>
  );
}
