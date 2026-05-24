import React, { useState, useEffect } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { GraduationCap, Plus, Users, FileText, Send } from 'lucide-react';

export default function MyGroups() {
  const { groups, assignments, fetchGroups, fetchAssignments, createGroup, dispatchPaper } = useAssessStore();
  
  const [showAddClass, setShowAddClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('Grade 12');
  const [classSubject, setClassSubject] = useState('Computer Science');
  const [studentCount, setStudentCount] = useState(25);

  // Dispatch States
  const [selectedGroupToAssign, setSelectedGroupToAssign] = useState(null);
  const [selectedPaperToAssign, setSelectedPaperToAssign] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchAssignments();
  }, [fetchGroups, fetchAssignments]);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!className) return alert('Please enter a class name.');

    createGroup({
      name: className,
      grade: classGrade,
      subject: classSubject,
      studentCount
    });

    setClassName('');
    setShowAddClass(false);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!selectedPaperToAssign) return alert('Please select a paper.');
    dispatchPaper(selectedGroupToAssign, selectedPaperToAssign);
    setSelectedGroupToAssign(null);
    setSelectedPaperToAssign('');
  };

  // Find the currently selected class group object from global state
  const activeGroupObj = groups.find(g => g._id === selectedGroupToAssign);

  // Filter out any papers that are already assigned to this group, or are not COMPLETED
  const availablePapers = assignments.filter((paper) => {
    // 1. Hide incomplete or failed paper drafts
    if (paper.status !== 'COMPLETED') return false;

    // 2. Hide papers already assigned to the selected classroom section
    if (activeGroupObj) {
      const isAlreadyAssigned = activeGroupObj.assignedPapers.some(
        (assigned) => assigned._id === paper._id
      );
      if (isAlreadyAssigned) return false;
    }

    return true;
  });

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 select-none px-2 lg:px-0 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-dark font-heading">Classroom Directories</h1>
          <p className="text-sm text-brand-muted font-heading mt-0.5">Deploy and assign drafted assessments directly to student sections.</p>
        </div>
        
        <button 
          onClick={() => setShowAddClass(!showAddClass)}
          className="h-10 px-5 bg-[#181818] hover:bg-zinc-800 text-white rounded-full flex items-center gap-2 text-sm font-semibold shadow-sm focus:outline-none"
        >
          <Plus className="w-4 h-4 text-white" />
          Add Classroom
        </button>
      </div>

      {/* Classroom Creator Form */}
      {showAddClass && (
        <form onSubmit={handleCreateGroup} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-brand-dark font-heading">Create Student Section</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input 
              type="text" 
              placeholder="e.g. Class 12 - Section A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
            />
            <input 
              type="text" 
              placeholder="e.g. Grade 12"
              value={classGrade}
              onChange={(e) => setClassGrade(e.target.value)}
              className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
            />
            <input 
              type="text" 
              placeholder="e.g. Computer Science"
              value={classSubject}
              onChange={(e) => setClassSubject(e.target.value)}
              className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
            />
            <input 
              type="number" 
              value={studentCount}
              onChange={(e) => setStudentCount(parseInt(e.target.value, 10))}
              className="h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
            />
          </div>
          <button type="submit" className="self-end h-10 px-6 bg-brand-orange text-white font-bold rounded-full text-sm">
            Save Class Group
          </button>
        </form>
      )}

      {/* Paper Dispatch Dialog */}
      {selectedGroupToAssign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleDispatch} className="bg-white w-full max-w-md p-6 rounded-3xl shadow-sidebar border border-gray-50 flex flex-col gap-4">
            <h3 className="text-base font-bold text-brand-dark font-heading">Dispatch Exam Paper to Section</h3>
            
            <select
              value={selectedPaperToAssign}
              onChange={(e) => setSelectedPaperToAssign(e.target.value)}
              className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none bg-white"
            >
              <option value="">-- Choose a Generated Paper --</option>
              {availablePapers.map(a => (
                <option key={a._id} value={a._id}>
                  {a.subjectName} — {a.classLevel} ({a.assignmentType})
                </option>
              ))}
            </select>

            {availablePapers.length === 0 && (
              <p className="text-[10px] text-red-500 italic px-2">
                * No available papers to dispatch. All generated papers are already assigned to this group.
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => {
                  setSelectedGroupToAssign(null);
                  setSelectedPaperToAssign('');
                }}
                className="h-10 px-4 border border-brand-line-grey text-brand-dark font-semibold rounded-full text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={availablePapers.length === 0}
                className="h-10 px-5 bg-brand-orange text-white font-bold rounded-full text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classroom Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-brand-dark font-heading leading-tight truncate max-w-[150px]">
                    {g.name}
                  </h3>
                  <span className="text-xs text-zinc-400 font-semibold">{g.subject}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-muted font-sans font-semibold">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{g.studentCount} Students</span>
              </div>
            </div>

            {/* Deployed assignments block */}
            <div className="bg-zinc-50 p-4 rounded-xl flex flex-col gap-2 border border-gray-100">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                Deployed Assessments ({g.assignedPapers.length})
              </span>
              {g.assignedPapers.length === 0 ? (
                <span className="text-xs text-zinc-400 italic">No papers deployed yet.</span>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {g.assignedPapers.map((paper, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-brand-dark truncate">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{paper.subjectName} — {paper.classLevel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deploy Trigger Button */}
            <button
              onClick={() => setSelectedGroupToAssign(g._id)}
              className="w-full h-[38px] border border-brand-line-grey bg-white hover:bg-zinc-50 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 focus:outline-none"
            >
              <Send className="w-4 h-4 text-[#FF5623]" />
              <span className="font-heading font-bold text-xs text-brand-dark">Deploy Paper</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}