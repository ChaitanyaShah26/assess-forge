import React from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { Home, Users, FileText, FolderOpen, Plus } from 'lucide-react';

export default function MobileTabBar() {
  const { activeView, setView, assignments } = useAssessStore();

  const handleTabClick = (id) => {
    if (id === 'LIST') setView('LIST');
  };

  const navItems = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'GROUPS', label: 'My Groups', icon: Users },
    { id: 'LIST', label: 'Assignments', icon: FileText, badge: assignments.length || 0 },
    { id: 'LIBRARY', label: 'Library', icon: FolderOpen },
  ];

  return (
    <div className="flex lg:hidden flex-col fixed bottom-0 left-0 right-0 z-50 bg-brand-btn-dark shadow-sidebar border-t border-zinc-800">
      
      {/* Tab Navigation row matches mobile layout properties */}
      <div className="flex items-center justify-between px-6 py-2 relative h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = item.id === 'LIST' && (activeView === 'LIST' || activeView === 'CREATE' || activeView === 'VIEW_PAPER');

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative focus:outline-none"
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-orange' : 'text-zinc-400'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2.5 -right-3.5 bg-brand-orange text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-heading font-semibold ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Center Floating Mobile Quick-Creation Trigger button */}
        <button 
          onClick={() => setView('CREATE')}
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center shadow-sidebar focus:outline-none transition-all active:scale-95"
        >
          <Plus className="w-6 h-6 text-brand-orange font-bold" />
        </button>
      </div>

      {/* iOS Home Indicator Bar representation */}
      <div className="h-5 bg-brand-btn-dark flex items-center justify-center pb-2">
        <div className="w-[135px] h-1.5 bg-[#DDDDDD] rounded-full"></div>
      </div>
    </div>
  );
}