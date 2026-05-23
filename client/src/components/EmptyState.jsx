import React from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { Plus } from 'lucide-react';

export default function EmptyState() {
  const { setView } = useAssessStore();

  return (
    <div className="w-full max-w-[1100px] h-[678px] flex flex-col items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-[486px] flex flex-col items-center gap-8">
        <div className="relative w-[220px] h-[220px] lg:w-[300px] lg:h-[300px]">
          <div className="absolute w-[180px] h-[180px] lg:w-[240px] lg:h-[240px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#F2F2F2] to-[#EFEFEF]"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-28 h-28 lg:w-36 lg:h-36 bg-white rounded-full shadow-sidebar flex items-center justify-center border-4 border-[#CCC6D9]">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-tr from-white to-[#FFADAD] rounded-full flex items-center justify-center relative">
                <div className="absolute w-10 h-10 lg:w-12 lg:h-12 bg-[#FF4040] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl lg:text-3xl font-extrabold leading-none select-none">×</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-xl font-bold text-brand-dark font-heading tracking-tight">No assignments yet</h2>
          <p className="text-sm lg:text-base text-brand-muted-default leading-[140%]">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
        </div>

        <button 
          onClick={() => setView('CREATE')}
          className="w-full max-w-[277px] h-[46px] bg-brand-btn-dark hover:bg-zinc-800 text-white rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sidebar focus:outline-none text-sm lg:text-base"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white font-medium font-heading">Create Your First Assignment</span>
        </button>
      </div>
    </div>
  );
}