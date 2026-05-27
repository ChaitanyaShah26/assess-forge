import React, { useState } from 'react';
import { useAssessStore } from './../store/useAssessStore';
import EmptyState from './EmptyState';
import { Filter, Search, MoreVertical, FileText, Trash2, Eye, Calendar, Clock } from 'lucide-react';

/**
 * Defensive String Renderer.
 * Extract strings from nested objects to prevent React rendering crashes.
 */
const renderString = (val) => {
  if (!val) return '';
  if (typeof val === 'object') {
    return val.name || val.title || val.subjectName || val.filename || '';
  }
  return String(val);
};

export default function AssignmentList() {
  const { assignments, setDetailedAssignment, deleteAssignment, setView } = useAssessStore();
  
  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  
  const [activeDropdown, setActiveDropdown] = useState(null);

  if (assignments.length === 0) {
    return <EmptyState />;
  }

  // Dynamically extract unique Class Levels from your existing assignments database
  const uniqueClasses = Array.from(
    new Set(assignments.map(a => renderString(a.classLevel)).filter(Boolean))
  ).sort();

  // Multi-axis filter pipeline
  const filteredAssignments = assignments.filter((item) => {
    const subject = renderString(item.subjectName);
    const classLevel = renderString(item.classLevel);
    const title = renderString(item.assignmentTitle);
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = 
      subject.toLowerCase().includes(query) ||
      classLevel.toLowerCase().includes(query) ||
      title.toLowerCase().includes(query);

    const matchesType = typeFilter === 'ALL' || item.assignmentType === typeFilter;
    const matchesClass = classFilter === 'ALL' || renderString(item.classLevel) === classFilter;

    return matchesSearch && matchesType && matchesClass;
  });

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 relative select-none px-2 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-brand-dark font-heading">Assignments</h1>
          <p className="text-xs lg:text-sm text-brand-muted font-heading mt-0.5">Manage and create assignments for your classes.</p>
        </div>
      </div>

      {/* Dynamic Responsive Filter & Search Row */}
      <div className="w-full min-h-16 bg-white rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-brand-line-grey">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-bold text-gray-400 font-heading">Filter By</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 border border-brand-line-grey rounded-full px-4 text-xs font-semibold font-heading bg-white focus:outline-none text-brand-dark cursor-pointer shadow-sm focus:border-brand-orange"
          >
            <option value="ALL">All Formats</option>
            <option value="EXAM">Exam Papers</option>
            <option value="ASSIGNMENT">Worksheets</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 border border-brand-line-grey rounded-full px-4 text-xs font-semibold font-heading bg-white focus:outline-none text-brand-dark cursor-pointer shadow-sm focus:border-brand-orange"
          >
            <option value="ALL">All Classes</option>
            {uniqueClasses.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-[250px] h-11 rounded-full border border-gray-200 px-4 flex items-center gap-2 bg-white focus-within:border-brand-orange transition-all">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Subject, Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-brand-dark focus:outline-none font-heading placeholder-gray-400 w-full"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm text-zinc-400 font-heading">
            No assessments match your selected filter criteria.
          </div>
        ) : (
          filteredAssignments.map((item) => {
            const isExam = item.assignmentType === 'EXAM';
            const assignedDate = new Date(item.createdAt).toLocaleDateString('en-GB');
            const isMenuOpen = activeDropdown === item._id;

            return (
              <div 
                key={item._id}
                onClick={() => setDetailedAssignment(item)}
                className="relative bg-white rounded-3xl p-6 border border-gray-100 hover:border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-brand-orange" />
                    </div>
                    
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border font-heading ${
                          isExam 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {isExam ? 'EXAM PAPER' : 'ASSIGNMENT'}
                        </span>
                        <span className="text-xs text-zinc-400 font-semibold font-sans truncate">
                          {renderString(item.classLevel)} ({renderString(item.academicYear)})
                        </span>
                      </div>
                      
                      <h3 className="text-xl lg:text-2xl font-extrabold text-brand-dark font-heading leading-tight tracking-tight truncate max-w-[200px] sm:max-w-[340px]">
                        {renderString(item.subjectName)}
                      </h3>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => toggleDropdown(item._id, e)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-10 w-[140px] bg-white rounded-2xl p-2 shadow-dropdown border border-gray-50 z-20">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailedAssignment(item);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-brand-dark hover:bg-zinc-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                          View Paper
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAssignment(item._id);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-xl border border-gray-100/50 text-xs text-zinc-500 font-sans flex flex-col gap-1.5">
                  {isExam ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-orange" />
                        <span><b>Timings:</b> {renderString(item.examTiming)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                        <span><b>Exam Date:</b> {new Date(item.examDate).toLocaleDateString('en-GB')}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate"><b>Title:</b> {renderString(item.assignmentTitle)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span><b>Due Date:</b> {new Date(item.dueDate).toLocaleDateString('en-GB')}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-[10px] font-bold text-zinc-400 font-sans uppercase tracking-wider text-right">
                  Drafted on: {assignedDate}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div className="hidden lg:block fixed bottom-6 left-[calc(50%+152px)] -translate-x-1/2 z-40 bg-transparent">
        <button 
          onClick={() => setView('CREATE')}
          className="w-[208px] h-[46px] bg-brand-btn-dark hover:bg-zinc-800 text-white rounded-full flex items-center justify-center gap-2 shadow-sidebar transition-transform active:scale-95"
        >
          <span className="text-xl">+</span>
          <span className="font-medium text-base font-heading">Create Assignment</span>
        </button>
      </div>
    </div>
  );
}