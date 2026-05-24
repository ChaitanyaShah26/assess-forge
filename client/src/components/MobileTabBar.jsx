import React from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { Home, Users, FileText, GraduationCap, Plus } from 'lucide-react';

export default function MobileTabBar() {
  const { activeView, setView, assignments } = useAssessStore();

  const handleTabClick = (id) => {
    setView(id);
  };

  const navItems = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'GROUPS', label: 'My Groups', icon: Users },
    { id: 'CREATE_PLACEHOLDER', label: '', icon: null }, 
    { id: 'LIST', label: 'Assignments', icon: FileText, badge: assignments.length || 0 },
    { id: 'TOOLKIT', label: 'AI Toolkit', icon: GraduationCap },
  ];

  return (
    <div className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#181818] shadow-sidebar border-t border-zinc-800/50 select-none h-16">
      
      <div className="flex items-center justify-between w-full h-full px-4 relative">
        {navItems.map((item, idx) => {
          if (item.id === 'CREATE_PLACEHOLDER') {
            return <div key={idx} className="flex-1" />; // Renders spacing placeholder
          }

          const Icon = item.icon;
          const isSelected = activeView === item.id || 
                             (item.id === 'LIST' && activeView === 'VIEW_PAPER');

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative focus:outline-none h-full"
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors duration-150 ${isSelected ? 'text-brand-orange' : 'text-zinc-400'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2.5 -right-3.5 bg-brand-orange text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-heading font-semibold tracking-wide transition-colors duration-150 ${
                isSelected ? 'text-white' : 'text-zinc-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button 
          onClick={() => setView('CREATE')}
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-11 h-11 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center shadow-sidebar focus:outline-none transition-all active:scale-90"
          title="Create New Assignment"
        >
          <Plus className="w-6 h-6 text-brand-orange font-extrabold" />
        </button>
      </div>
    </div>
  );
}