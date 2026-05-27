import React, { useState } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { getInitials } from '../utils/getInitials'; // Import from dedicated utility file
import { Save, CheckCircle2, ShieldAlert, Building, User } from 'lucide-react';

export default function Settings() {
  const { schoolName, schoolLocation, teacherName, defaultClass, defaultSubject, academicYear, savePreferences } = useAssessStore();
  
  const [name, setName] = useState(schoolName);
  const [location, setLocation] = useState(schoolLocation);
  const [teacher, setTeacher] = useState(teacherName);
  const [defClass, setDefClass] = useState(defaultClass);
  const [defSubject, setDefSubject] = useState(defaultSubject);
  const [year, setYear] = useState(academicYear);

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    savePreferences({
      schoolName: name,
      schoolLocation: location,
      teacherName: teacher,
      defaultClass: defClass,
      defaultSubject: defSubject,
      academicYear: year
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="w-full max-w-[810px] flex flex-col gap-6 select-none mx-auto bg-transparent relative px-2 lg:px-0">
      <div>
        <h1 className="text-xl font-bold text-brand-dark font-heading">Portal Preferences</h1>
        <p className="text-sm text-brand-muted font-heading mt-0.5">Customize global school branding assets and default form values.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Preferences Form */}
        <form onSubmit={handleSave} className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <h3 className="text-base font-bold text-brand-dark font-heading border-b border-gray-100 pb-2">Institutional Configuration</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500">School Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500">School Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <h3 className="text-base font-bold text-brand-dark font-heading border-b border-gray-100 pb-2 pt-2">Academic Form Defaults</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500">Teacher Name</label>
              <input 
                type="text" 
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500">Default Class</label>
              <input 
                type="text" 
                value={defClass}
                onChange={(e) => setDefClass(e.target.value)}
                className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500">Default Subject</label>
              <input 
                type="text" 
                value={defSubject}
                onChange={(e) => setDefSubject(e.target.value)}
                className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-w-[200px]">
            <label className="text-xs font-bold uppercase text-gray-500">Academic Year</label>
            <input 
              type="text" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-brand-muted italic">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              <span>Preferences are cached locally.</span>
            </div>

            <button 
              type="submit"
              className="h-11 px-6 bg-brand-btn-dark hover:bg-zinc-800 text-white font-bold rounded-full text-xs flex items-center gap-1.5 transition-transform active:scale-95 focus:outline-none"
            >
              <Save className="w-4 h-4 text-white" />
              Save Preferences
            </button>
          </div>
        </form>

        {/* Right Side: Real-time Live Initials Previews */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <h3 className="text-base font-bold text-brand-dark font-heading pb-2 border-b border-gray-100">Live Branding Previews</h3>
          
          {/* School Card Preview */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-brand-orange" />
              School Profile Avatar
            </span>
            <div className="bg-zinc-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-[59px] h-14 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-inner select-none transition-all duration-200">
                {getInitials(name)}
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-sm font-bold text-brand-dark truncate font-heading">{name || 'Unnamed Institution'}</span>
                <span className="text-[10px] text-zinc-400 font-heading mt-0.5">{location || 'No Location'}</span>
              </div>
            </div>
          </div>

          {/* User Card Preview */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-brand-orange" />
              Teacher Profile Avatar
            </span>
            <div className="bg-zinc-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md select-none transition-all duration-200">
                {getInitials(teacher)}
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-sm font-bold text-brand-dark font-heading truncate">{teacher || 'Teacher Name'}</span>
                <span className="text-[10px] text-zinc-400 font-heading mt-0.5">Academic Assessor</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-sidebar animate-bounce z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-heading text-sm font-bold">Preferences saved successfully!</span>
        </div>
      )}
    </div>
  );
}