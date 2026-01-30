'use client';

import Link from 'next/link';
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { Activity, Stethoscope, Users, BarChart3, FileText, Shield } from 'lucide-react';
import { LanguageSwitcher } from './components/LanguageSwitcher';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-card fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold gradient-text">AuraSutra</span>
              <span className="text-sm text-gray-600 ml-2">Doctor Portal</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              <LoginLink className="px-6 py-2 text-gray-700 hover:text-primary-600 smooth-transition">
                Sign In
              </LoginLink>
              <RegisterLink className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:shadow-lg smooth-transition">
                Register as Doctor
              </RegisterLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-secondary-50 text-secondary-700 px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Professional Healthcare Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Empower Your{' '}
            <span className="gradient-text">Ayurvedic Practice</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in">
            Manage patients, conduct video consultations, create prescriptions, and track  treatment progress—all in one comprehensive platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <RegisterLink className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-2xl smooth-transition text-lg">
              Join as Doctor
            </RegisterLink>
            <Link
              href="#features"
              className="px-8 py-4 glass-card text-gray-700 rounded-xl font-semibold hover:shadow-xl smooth-transition text-lg"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Complete Practice <span className="gradient-text">Management</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to provide exceptional Ayurvedic care
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-10 h-10 text-primary-600" />,
                title: 'Patient Management',
                description: 'Complete patient records with health progress tracking',
                color: 'from-blue-500/10 to-primary-500/10',
              },
              {
                icon: <img src="/Logos/logo_emblem_total black+transparent.png" alt="AuraSutra" className="h-10" />,
                title: 'Progress Analytics',
                description: 'Visualize patient adherence and treatment outcomes',
                color: 'from-emerald-500/10 to-secondary-500/10',
              },
              {
                icon: <FileText className="w-10 h-10 text-accent-600" />,
                title: 'AI-Powered Prescriptions',
                description: 'Generate prescriptions with Google Gemini assistance',
                color: 'from-amber-500/10 to-accent-500/10',
              },
              {
                icon: <BarChart3 className="w-10 h-10 text-rose-600" />,
                title: 'Dashboard Analytics',
                description: 'Track revenue, appointments, and practice growth',
                color: 'from-rose-500/10 to-pink-500/10',
              },
              {
                icon: <Stethoscope className="w-10 h-10 text-indigo-600" />,
                title: 'Video Consultations',
                description: 'HD video calls with in-consultation prescription creation',
                color: 'from-indigo-500/10 to-purple-500/10',
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
                className="glass-card-hover p-8 rounded-2xl group"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 smooth-transition`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="glass-card p-12 rounded-3xl text-center bg-gradient-to-br from-primary-50 to-secondary-50">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform <span className="gradient-text">Your Practice?</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the AuraSutra network and provide world-class Ayurvedic care
            </p>
            <RegisterLink className="inline-flex px-10 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-2xl smooth-transition text-lg">
              Register Now - Free
            </RegisterLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Stethoscope className="w-6 h-6 text-primary-600" />
            <span className="text-xl font-bold gradient-text">AuraSutra</span>
          </div>
          <p className="text-gray-600 mb-4">
            Empowering Ayurvedic practitioners with modern technology
          </p>
          <p className="text-sm text-gray-500">
            © 2026 AuraSutra. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
