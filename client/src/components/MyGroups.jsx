import React, { useState, useEffect } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import { 
  GraduationCap, Plus, Users, FileText, Send, 
  Trash2, Edit, ArrowLeft, Mail, FileUp, ShieldAlert, CheckCircle2 
} from 'lucide-react';

export default function MyGroups() {
  const { 
    groups, assignments, activeGroup, fetchGroups, fetchAssignments, 
    createGroup, updateGroup, deleteGroup, addStudentsToGroup, dispatchPaperToGroup, inspectGroup, setView 
  } = useAssessStore();

  const [showAddClass, setShowAddClass] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  
  // Forms fields
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('Grade 12');
  const [classSubject, setClassSubject] = useState('Computer Science');

  // Student directory inputs
  const [studentRoll, setStudentRoll] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Paper assignment trigger
  const [selectedPaperToAssign, setSelectedPaperToAssign] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchAssignments();
  }, [fetchGroups, fetchAssignments]);

  const handleCreateOrUpdate = (e) => {
    e.preventDefault();
    if (!className) return alert('Class Name is mandatory.');

    if (editingGroupId) {
      updateGroup(editingGroupId, { name: className, grade: classGrade, subject: classSubject });
      setEditingGroupId(null);
    } else {
      createGroup({ name: className, grade: classGrade, subject: classSubject });
    }

    setClassName('');
    setShowAddClass(false);
  };

  const handleAddSingleStudent = (e) => {
    e.preventDefault();
    if (!studentRoll || !studentName || !studentEmail) return alert('All student fields are mandatory.');

    addStudentsToGroup(activeGroup._id, [{
      rollNo: studentRoll,
      name: studentName,
      email: studentEmail
    }]);

    setStudentRoll('');
    setStudentName('');
    setStudentEmail('');
  };

  // Zero-dependency client-side CSV parser
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const studentsToUpload = [];

      // Detect header row and establish offset
      const hasHeader = lines[0].toLowerCase().includes('roll') || lines[0].toLowerCase().includes('email');
      const startIndex = hasHeader ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 3) {
          studentsToUpload.push({
            rollNo: cols[0],
            name: cols[1],
            email: cols[2]
          });
        }
      }

      if (studentsToUpload.length > 0) {
        await addStudentsToGroup(activeGroup._id, studentsToUpload);
        alert(`Successfully imported ${studentsToUpload.length} students from CSV.`);
      } else {
        alert('Parsing failed. Make sure your CSV contains 3 columns matching: Roll No, Name, Email');
      }
    };
    reader.readAsText(file);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!selectedPaperToAssign) return alert('Select a paper.');
    dispatchPaperToGroup(activeGroup._id, selectedPaperToAssign);
    setSelectedPaperToAssign('');
  };

  // Filter available assignments to exclude already dispatched ones
  const availablePapers = assignments.filter((paper) => {
    if (paper.status !== 'COMPLETED') return false;
    if (activeGroup) {
      return !activeGroup.dispatches.some(d => d.paperId?._id === paper._id);
    }
    return true;
  });

  // RENDER DEDICATED CLASSROOM VIEW STATE (ActiveGroup !== null)
  if (activeGroup) {
    return (
      <div className="w-full max-w-[1100px] flex flex-col gap-6 select-none px-2 lg:px-0 relative">
        {/* Back navigation */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => useAssessStore.setState({ activeGroup: null })}
            className="w-10 h-10 bg-white rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-brand-dark" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-brand-dark font-heading">{activeGroup.name}</h1>
            <p className="text-xs text-brand-muted font-heading mt-0.5">{activeGroup.subject} • {activeGroup.grade}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: student directory & csv importer */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* CSV Import card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-brand-dark font-heading">Student Directory ({activeGroup.students.length})</h3>
                
                {/* Custom Styled CSV Uploader */}
                <label className="h-9 px-4 bg-zinc-50 hover:bg-zinc-100 border border-brand-line-grey text-xs font-semibold text-brand-dark rounded-full flex items-center gap-1.5 cursor-pointer transition-colors">
                  <FileUp className="w-4 h-4 text-[#FF5623]" />
                  Import CSV
                  <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                </label>
              </div>

              {activeGroup.students.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 font-heading text-sm bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                  No students added. Upload a CSV file or add manually below.
                </div>
              ) : (
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-gray-100 text-zinc-400 font-heading uppercase tracking-wider h-10">
                        <th className="pl-4">Roll No</th>
                        <th>Student Name</th>
                        <th className="pr-4">Email Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGroup.students.map((student, idx) => (
                        <tr key={idx} className="border-b border-gray-50 h-11 hover:bg-zinc-50/50">
                          <td className="pl-4 font-bold text-zinc-500">{student.rollNo}</td>
                          <td className="font-semibold text-brand-dark">{student.name}</td>
                          <td className="pr-4 text-zinc-400 font-medium">{student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add manual student form */}
              <form onSubmit={handleAddSingleStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 mt-2">
                <input 
                  type="text" 
                  placeholder="Roll No" 
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                  className="h-10 border border-brand-line-grey rounded-full px-4 text-xs font-heading focus:outline-none bg-white"
                />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="h-10 border border-brand-line-grey rounded-full px-4 text-xs font-heading focus:outline-none bg-white"
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="h-10 border border-brand-line-grey rounded-full px-4 text-xs font-heading focus:outline-none bg-white"
                />
                <button type="submit" className="h-10 bg-brand-orange text-white font-bold rounded-full text-xs hover:bg-orange-600 transition-colors">
                  Add Student
                </button>
              </form>
            </div>
          </div>

          {/* Right panel: dispatch exam paper & dispatch history */}
          <div className="flex flex-col gap-6">
            
            {/* Dispatch paper form */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
              <h3 className="text-base font-bold text-brand-dark font-heading">Dispatch Assessment</h3>
              <form onSubmit={handleDispatch} className="flex flex-col gap-3">
                <select
                  value={selectedPaperToAssign}
                  onChange={(e) => setSelectedPaperToAssign(e.target.value)}
                  className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-xs font-heading focus:outline-none bg-white"
                >
                  <option value="">-- Choose Completed Paper --</option>
                  {availablePapers.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.subjectName} — {p.classLevel} ({p.assignmentType})
                    </option>
                  ))}
                </select>
                
                {availablePapers.length === 0 && (
                  <p className="text-[10px] text-red-500 italic px-2">
                    * All generated papers have been assigned to this group.
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={availablePapers.length === 0 || activeGroup.students.length === 0}
                  className="w-full h-[40px] bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                >
                  <Send className="w-4 h-4 text-white" />
                  Dispatch Papers to Class
                </button>
                {activeGroup.students.length === 0 && (
                  <span className="text-[10px] text-zinc-400 text-center italic">
                    * Add students to the directory before dispatching papers.
                  </span>
                )}
              </form>
            </div>

            {/* Dispatch Delivery Status log */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
              <h3 className="text-base font-bold text-brand-dark font-heading">Simulated Dispatch History</h3>
              {activeGroup.dispatches.length === 0 ? (
                <span className="text-xs text-zinc-400 italic">No papers dispatched to this group.</span>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                  {activeGroup.dispatches.map((log, idx) => (
                    <div key={idx} className="bg-zinc-50 border border-gray-100 p-3 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-brand-dark truncate max-w-[150px]">
                          {log.paperId?.subjectName || 'Syllabus Paper'}
                        </span>
                        {/* Status badges */}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Mock delivery triggered to {activeGroup.students.length} students.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // RENDER GRID DIRECTORY LIST (Default activeGroup === null state)
  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 select-none px-2 lg:px-0 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-dark font-heading">Classroom Directories</h1>
          <p className="text-sm text-brand-muted font-heading mt-0.5">Deploy and assign drafted assessments directly to student sections.</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingGroupId(null);
            setClassName('');
            setShowAddClass(!showAddClass);
          }}
          className="h-10 px-5 bg-[#181818] hover:bg-zinc-800 text-white rounded-full flex items-center gap-2 text-sm font-semibold shadow-sm focus:outline-none"
        >
          <Plus className="w-4 h-4 text-white" />
          Add Classroom
        </button>
      </div>

      {/* Classroom Creator Form */}
      {showAddClass && (
        <form onSubmit={handleCreateOrUpdate} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-brand-dark font-heading">
            {editingGroupId ? 'Edit Classroom Details' : 'Create Student Section'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => {
                setShowAddClass(false);
                setEditingGroupId(null);
              }}
              className="h-10 px-5 border border-brand-line-grey rounded-full text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="h-10 px-6 bg-brand-orange text-white font-bold rounded-full text-sm">
              Save Class Group
            </button>
          </div>
        </form>
      )}

      {/* Classroom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-brand-dark font-heading leading-tight truncate max-w-[120px]">
                    {g.name}
                  </h3>
                  <span className="text-xs text-zinc-400 font-semibold">{g.subject}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-muted font-sans font-semibold">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{g.students.length} Students</span>
              </div>
            </div>

            {/* Action Tools Row (Edit/Delete) */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 gap-4">
              <div className="flex gap-1.5">
                <button 
                  onClick={() => {
                    setEditingGroupId(g._id);
                    setClassName(g.name);
                    setClassGrade(g.grade);
                    setClassSubject(g.subject);
                    setShowAddClass(true);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 border border-gray-100 text-gray-500 focus:outline-none"
                  title="Edit Group"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteGroup(g._id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 border border-gray-100 text-red-500 focus:outline-none"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Enter Group Detailed View */}
              <button
                onClick={() => inspectGroup(g)}
                className="h-9 px-5 bg-zinc-50 border border-brand-line-grey hover:bg-zinc-100 rounded-full flex items-center gap-1.5 focus:outline-none"
              >
                <span className="font-heading font-bold text-xs text-brand-dark">Enter Class</span>
                <Plus className="w-3.5 h-3.5 text-[#FF5623]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}