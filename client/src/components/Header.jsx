import React from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  const { activeView, setView } = useAssessStore();

  const handleBack = () => {
    // Sub-views always return to the core listing grid
    if (activeView === 'CREATE' || activeView === 'VIEW_PAPER') {
      setView('LIST');
    }
  };

  // The back button is hidden on root landing views and shown only on sub-action views
  const showBackButton = activeView === 'CREATE' || activeView === 'VIEW_PAPER';

  // Dynamically renders context-aware breadcrumbs matching the active scope
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
        {/* Conditional back arrow button container */}
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="w-9 h-9 lg:w-10 lg:h-10 bg-white rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark" />
          </button>
        )}

        {/* Breadcrumbs node */}
        <div className="flex items-center">
          {renderBreadcrumbs()}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <div className="relative w-8 h-8 lg:w-9 lg:h-9 bg-[#F6F6F6] rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer">
          <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark" />
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-brand-orange rounded-full"></div>
        </div>

        <div className="flex items-center gap-2 bg-white px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer shadow-sm">
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center">
            <span role="img" aria-label="avatar">👨‍🏫</span>
          </div>
          <span className="text-sm lg:text-base font-semibold text-brand-dark font-heading tracking-tight hidden sm:inline">John Doe</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}