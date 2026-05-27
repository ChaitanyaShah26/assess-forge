import React, { useState, useEffect } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { getInitials } from '../utils/getInitials';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  const { activeView, setView, teacherName } = useAssessStore();
  const [mounted, setMounted] = useState(false);

  // Sync client-side mounting state to resolve Next.js hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    if (activeView === 'CREATE' || activeView === 'VIEW_PAPER') {
      setView('LIST');
    }
  };

  const showBackButton = activeView === 'CREATE' || activeView === 'VIEW_PAPER';

  const renderBreadcrumbs = () => {
    switch (activeView) {
      case 'HOME':
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            Dashboard
          </span>
        );
      case 'GROUPS':
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            My Groups
          </span>
        );
      case 'LIST':
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            Assignments
          </span>
        );
      case 'TOOLKIT':
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            AI Teacher's Toolkit
          </span>
        );
      case 'LIBRARY':
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            My Library
          </span>
        );
      case 'SETTINGS':
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            Portal Settings
          </span>
        );
      case 'CREATE':
        return (
          <div className="flex items-center gap-1.5 lg:gap-2">
            <span 
              onClick={() => setView('LIST')}
              className="text-sm lg:text-base font-semibold text-zinc-400 font-heading tracking-tight cursor-pointer hover:text-brand-dark transition-colors"
            >
              Assignments
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-sm lg:text-base font-extrabold text-brand-dark font-heading tracking-tight">
              Create New
            </span>
          </div>
        );
      case 'VIEW_PAPER':
        return (
          <div className="flex items-center gap-1.5 lg:gap-2">
            <span 
              onClick={() => setView('LIST')}
              className="text-sm lg:text-base font-semibold text-zinc-400 font-heading tracking-tight cursor-pointer hover:text-brand-dark transition-colors"
            >
              Assignments
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-sm lg:text-base font-extrabold text-brand-dark font-heading tracking-tight">
              Output Paper
            </span>
          </div>
        );
      default:
        return (
          <span className="text-base font-extrabold text-brand-dark font-heading tracking-tight">
            VedaAI Portal
          </span>
        );
    }
  };

  return (
    <header className="w-full max-w-[1100px] h-14 bg-white/75 backdrop-blur-md rounded-2xl px-4 lg:px-6 py-2 flex items-center justify-between shadow-sm select-none border border-gray-100/50">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="w-9 h-9 lg:w-10 lg:h-10 bg-white rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark" />
          </button>
        )}

        <div className="flex items-center">
          {renderBreadcrumbs()}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <div className="relative w-8 h-8 lg:w-9 lg:h-9 bg-[#F6F6F6] rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer">
          <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark" />
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-brand-orange rounded-full"></div>
        </div>

        {/* Dynamic User Profile */}
        <div className="flex items-center gap-2 bg-white px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer shadow-sm">
          {/* Hydration-safe initial-based avatar */}
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-brand-orange text-white font-extrabold text-[10px] lg:text-xs flex items-center justify-center shrink-0 shadow-inner select-none">
            {mounted ? getInitials(teacherName) : 'JD'}
          </div>
          <span className="text-sm lg:text-base font-semibold text-brand-dark font-heading tracking-tight hidden sm:inline">
            {mounted ? teacherName : 'John Doe'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}