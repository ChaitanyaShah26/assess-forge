import React, { useEffect } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { FileText, Users, GraduationCap, Award, Calendar, ChevronRight } from 'lucide-react';

export default function HomeDashboard() {
  const { metrics, fetchMetrics, setDetailedAssignment, setView } = useAssessStore();

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const cards = [
    { title: 'Assessments Created', val: metrics.totalCreated, desc: 'Drafted examinations & worksheets', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Total Student Reach', val: metrics.totalStudents, desc: 'Active student evaluations', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Class Groups', val: metrics.totalGroups, desc: 'Active managed sections', icon: GraduationCap, color: 'text-brand-orange bg-orange-50' },
  ];

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-8 select-none px-2 lg:px-0">
      
      {/* Title Segment */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-dark font-heading">Teacher's Control Panel</h1>
        <p className="text-sm text-brand-muted font-heading mt-0.5">Track your classroom evaluations and assessment creation statistics.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-zinc-400 font-heading uppercase tracking-wide">{c.title}</span>
                <h3 className="text-4xl font-extrabold text-brand-dark font-heading">{c.val}</h3>
                <span className="text-xs text-brand-muted mt-1">{c.desc}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Paper Activity Timeline */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-brand-dark font-heading mb-6 border-b border-gray-100 pb-3">Recent Assessments Activity</h3>
        
        {metrics.recentActivity.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-heading">
            No assessments drafted yet. Let's create your first!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {metrics.recentActivity.map((item, index) => {
              const assignedDate = new Date(item.createdAt).toLocaleDateString('en-GB');
              return (
                <div 
                  key={item._id}
                  onClick={() => setDetailedAssignment(item)}
                  className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 cursor-pointer border border-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-brand-dark font-heading">
                        {item.subjectName} — {item.classLevel}
                      </span>
                      <span className="text-xs text-zinc-400 font-sans mt-0.5">
                        Generated on: {assignedDate} | {item.totalQuestions} Questions | {item.totalMarks} Marks
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      item.assignmentType === 'EXAM' 
                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {item.assignmentType}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}