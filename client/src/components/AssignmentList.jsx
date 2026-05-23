import React, { useState } from 'react';
import { useAssessStore } from './../store/useAssessStore';
import EmptyState from './EmptyState';
import { Filter, Search, MoreVertical, FileText, Trash2, Eye } from 'lucide-react';

export default function AssignmentList() {
  const { assignments, setDetailedAssignment, deleteAssignment, setView } = useAssessStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  if (assignments.length === 0) {
    return <EmptyState />;
  }

  const filteredAssignments = assignments.filter(item => {
    const subject = item.generatedPaper?.subject || 'Quiz on Electricity';
    return subject.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* Responsive Filter Row */}
      <div className="w-full min-h-16 bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-brand-line-grey">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-bold text-gray-400 font-heading">Filter By</span>
        </div>

        <div className="w-full sm:w-[228px] h-11 rounded-full border border-gray-200 px-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Assignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-brand-dark focus:outline-none font-heading placeholder-gray-400"
          />
        </div>
      </div>

      {/* Grid shifts to single-column stack on mobile viewports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map((item) => {
          const subject = item.generatedPaper?.subject || 'Quiz on Electricity';
          const assignedDate = new Date(item.createdAt).toLocaleDateString('en-GB');
          const dueDateStr = new Date(item.dueDate).toLocaleDateString('en-GB');
          const isMenuOpen = activeDropdown === item._id;

          return (
            <div 
              key={item._id}
              onClick={() => setDetailedAssignment(item)}
              className="relative bg-white rounded-3xl p-6 border border-gray-100 hover:border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all h-[162px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-brand-orange" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-extrabold text-brand-dark font-heading leading-tight tracking-tight truncate max-w-[200px] sm:max-w-[340px]">
                    {subject}
                  </h3>
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
                        View
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

              <div className="flex justify-between text-sm lg:text-base font-extrabold text-brand-dark font-heading leading-none">
                <span>Assigned: {assignedDate}</span>
                <span>Due: {dueDateStr}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button - Hidden on mobile in favor of central navigation bar */}
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