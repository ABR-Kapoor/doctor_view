'use client';

import Link from 'next/link';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import ProfilePicture from '@/app/components/ProfilePicture';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import { TranslatedText } from '@/app/components/TranslatedText';
import SidebarNavigation from '@/app/components/SidebarNavigation';

interface CollapsibleSidebarProps {
  user: any;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function CollapsibleSidebar({ user, isCollapsed, setIsCollapsed }: CollapsibleSidebarProps) {
  return (
    <aside
      className={`fixed h-screen p-6 hidden md:flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-22' : 'w-72'
        }`}
      data-collapsed={isCollapsed}
    >
      {/* Collapse Button - Positioned outside the glass panel */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-8 w-8 h-8 bg-white border-2 border-teal-300 rounded-full flex items-center justify-center hover:bg-teal-50 hover:border-teal-400 hover:scale-110 transition-all duration-300 shadow-lg z-[60] ${isCollapsed ? 'right-[10px]' : 'right-[10px]'
          }`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-teal-600" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-teal-600" />
        )}
      </button>

      <div className="glass-panel h-full flex flex-col p-4 bg-blue-theme shadow-xl relative">

        {/* Brand */}
        <div className={`py-2 mb-8 transition-all duration-300 ${isCollapsed ? 'px-0 flex justify-center' : 'px-4'}`}>
          <Link href="/dashboard" className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
            <img
              src="/Logos/logo_transparent.png"
              alt="AuraSutra"
              className={`transition-all duration-300 ${isCollapsed ? 'h-[2.1rem] w-[2.1rem]' : 'h-[3.15rem] w-auto'}`}
            />
            {!isCollapsed && (
              <span
                className="text-[1.3125rem] font-bold text-teal-900 whitespace-nowrap"
                style={{ fontFamily: 'Alatsi, sans-serif' }}
              >
                AuraSutra
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 transition-all duration-300 ${isCollapsed ? 'px-0' : ''}`}>
          <SidebarNavigation isCollapsed={isCollapsed} />
        </nav>

        {/* Language Switcher */}
        {!isCollapsed && (
          <div className="px-4 py-2">
            <LanguageSwitcher />
          </div>
        )}

        {/* Profile - Detached look at bottom */}
        <div className={`mt-auto pt-4 border-t border-teal-100/50 transition-all duration-300 ${isCollapsed ? 'px-0' : ''}`}>
          <div
            className={`glass-card-solid p-3 flex items-center rounded-2xl bg-teal-50/50 transition-all duration-300 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'
              }`}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-200 flex items-center justify-center overflow-hidden shrink-0">
              <ProfilePicture uid={user?.id} />
              {!user?.id && (
                <span className="text-teal-800 font-bold">
                  {user?.given_name?.[0] || 'D'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black truncate">
                  <TranslatedText>Dr.</TranslatedText> {user?.name || user?.given_name || 'Doctor'}
                </p>
                <Link
                  href="/api/auth/logout"
                  className="text-[10px] text-black/70 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" /> <TranslatedText>Sign out</TranslatedText>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
