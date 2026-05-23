import React from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { 
  Home, 
  Users, 
  FileText, 
  GraduationCap, 
  FolderOpen, 
  Settings, 
  Plus 
} from 'lucide-react';

export default function Sidebar() {
  const { activeView, setView, assignments } = useAssessStore();

  const navigationItems = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'GROUPS', label: 'My Groups', icon: Users },
    { id: 'LIST', label: 'Assignments', icon: FileText, badge: assignments.length || 0 },
    { id: 'TOOLKIT', label: 'AI Teacher\'s Toolkit', icon: GraduationCap },
    { id: 'LIBRARY', label: 'My Library', icon: FolderOpen, badge: 32 },
  ];

  return (
    <aside className="hidden lg:flex w-[304px] bg-white flex-col h-screen fixed left-0 top-0 justify-between py-6 px-6 select-none z-30 shadow-sidebar">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[15px] bg-gradient-to-b from-[#E56820] to-[#D45E3E] flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-2xl font-heading">V</span>
          </div>
          <span className="text-[28px] leading-[20px] font-bold tracking-tight text-[#303030] font-heading">VedaAI</span>
        </div>

        <button 
          onClick={() => setView('CREATE')}
          className="w-full h-[42px] bg-[#272727] shadow-[inset_0px_-1px_3.5px_rgba(177,177,177,0.6),inset_0px_0px_34.5px_rgba(255,255,255,0.25)] hover:bg-zinc-800 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 text-white focus:outline-none"
        >
          <span className="text-base">✨</span>
          <span className="text-white font-medium text-base font-sans tracking-wide">Create Assignment</span>
        </button>

        <nav className="flex flex-col gap-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isSelected = item.id === 'LIST' && (activeView === 'LIST' || activeView === 'CREATE' || activeView === 'VIEW_PAPER');

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'LIST') setView('LIST');
                }}
                className={`flex items-center justify-between px-3 py-2.5 h-[40px] rounded-lg text-sm transition-colors focus:outline-none ${
                  isSelected 
                    ? 'bg-[#F0F0F0] text-brand-dark font-semibold' 
                    : 'text-brand-muted-default hover:bg-gray-50 hover:text-brand-dark'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-dark' : 'text-gray-400'}`} />
                  <span className="font-heading text-base leading-[140%] tracking-tight">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <div className="bg-brand-orange h-5 px-2 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs font-heading">{item.badge}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-brand-muted-default hover:bg-gray-50 hover:text-brand-dark transition-colors focus:outline-none">
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="font-heading text-base">Settings</span>
        </button>

        <div className="bg-[#F0F0F0] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-[59px] h-14 rounded-full bg-zinc-200 flex items-center justify-center text-2xl overflow-hidden border border-gray-300">
            <span role="img" aria-label="avatar">🙊</span>
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-base font-bold text-brand-dark truncate font-heading leading-[140%]">Delhi Public School</span>
            <span className="text-sm text-brand-bg-dark truncate font-heading leading-[140%]">Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}