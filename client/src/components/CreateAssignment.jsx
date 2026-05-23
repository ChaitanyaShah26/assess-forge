import React, { useState, useEffect, useRef } from 'react';
import { useAssessStore } from './../store/useAssessStore';
import axios from 'axios';
import { 
  Plus, 
  Minus, 
  Cloud, 
  Trash2, 
  Mic, 
  Calendar, 
  ArrowLeft, 
  ArrowRight,
  FileText,
  Clock
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CreateAssignment() {
  const { createAssignment, setView } = useAssessStore();
  
  // New Global Header States
  const [assignmentType, setAssignmentType] = useState('ASSIGNMENT'); // 'ASSIGNMENT' or 'EXAM'
  const [academicYear, setAcademicYear] = useState(() => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  });
  const [classLevel, setClassLevel] = useState('Class 12th');
  const [subjectName, setSubjectName] = useState('Computer Science');

  // Conditional Assignment Fields
  const [assignmentTitle, setAssignmentTitle] = useState('Worksheet on Electricity');
  const [dueDate, setDueDate] = useState('');

  // Conditional Exam Fields
  const [examDate, setExamDate] = useState('');
  const [examTiming, setExamTiming] = useState('09:00 AM - 12:00 PM');

  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  const [configs, setConfigs] = useState([
    { type: 'Multiple Choice Questions', count: 4, marksPerQuestion: 1 },
    { type: 'Short Questions', count: 3, marksPerQuestion: 2 },
    { type: 'Diagram/Graph-Based Questions', count: 5, marksPerQuestion: 5 },
    { type: 'Numerical Problems', count: 5, marksPerQuestion: 5 }
  ]);

  const totalQuestions = configs.reduce((sum, item) => sum + item.count, 0);
  const totalMarks = configs.reduce((sum, item) => sum + (item.count * item.marksPerQuestion), 0);

  // File parsing hook
  useEffect(() => {
    if (!uploadedFile) {
      setPreviewText('');
      return;
    }

    const fetchFilePreview = async () => {
      setIsParsing(true);
      const formData = new FormData();
      formData.append('file', uploadedFile);

      try {
        const res = await axios.post(`${API_BASE}/api/assignments/parse-preview`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setPreviewText(res.data.extractedText);
        }
      } catch (err) {
        console.error('Preview parsing failed:', err);
        setPreviewText('Unable to preview content.');
      } finally {
        setIsParsing(false);
      }
    };

    fetchFilePreview();
  }, [uploadedFile]);

  // Voice Speech Captures
  const handleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAdditionalInstructions((prev) => prev ? `${prev} ${transcript}` : transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const updateCount = (index, delta) => {
    const updated = [...configs];
    updated[index].count = Math.max(0, updated[index].count + delta);
    setConfigs(updated);
  };

  const updateMarks = (index, delta) => {
    const updated = [...configs];
    updated[index].marksPerQuestion = Math.max(0, updated[index].marksPerQuestion + delta);
    setConfigs(updated);
  };

  const addConfigType = () => {
    setConfigs([...configs, { type: 'New Question Category', count: 1, marksPerQuestion: 1 }]);
  };

  const removeConfigType = (index) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Conditionally validate inputs based on selection
    if (assignmentType === 'ASSIGNMENT' && (!dueDate || !assignmentTitle)) {
      return alert('Assignment Title and Due Date are required.');
    }
    if (assignmentType === 'EXAM' && (!examDate || !examTiming)) {
      return alert('Exam Date and Exam Timings are required.');
    }

    const formData = new FormData();
    formData.append('assignmentType', assignmentType);
    formData.append('academicYear', academicYear);
    formData.append('classLevel', classLevel);
    formData.append('subjectName', subjectName);
    formData.append('totalQuestions', totalQuestions);
    formData.append('totalMarks', totalMarks);
    formData.append('additionalInstructions', additionalInstructions);
    formData.append('configs', JSON.stringify(configs));

    if (assignmentType === 'ASSIGNMENT') {
      formData.append('assignmentTitle', assignmentTitle);
      formData.append('dueDate', dueDate);
    } else {
      formData.append('examDate', examDate);
      formData.append('examTiming', examTiming);
    }

    if (uploadedFile) {
      formData.append('file', uploadedFile);
    }

    createAssignment(formData);
  };

  return (
    <div className="w-full max-w-[810px] flex flex-col gap-6 select-none mx-auto bg-transparent relative px-2 lg:px-0">
      
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-emerald-200 shadow-sm animate-pulse"></div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-brand-dark font-heading leading-tight tracking-tight">Create Assignment</h2>
              <span className="text-xs lg:text-sm text-brand-muted font-heading">Set up a new assignment for your students</span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-brand-bg-dark rounded-full"></div>
          <div className="h-1.5 flex-1 bg-brand-line-grey rounded-full"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/50 rounded-[32px] p-4 lg:p-8 flex flex-col gap-8 shadow-sm border border-gray-50">
        
        {/* Toggle between ASSIGNMENT and EXAM PAPER */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-bold text-brand-dark font-heading">Template Format</label>
          <div className="flex items-center gap-2 bg-[#F0F0F0] p-1.5 rounded-full border border-gray-200 w-full sm:w-80">
            <button
              type="button"
              onClick={() => setAssignmentType('ASSIGNMENT')}
              className={`flex-1 h-9 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-colors focus:outline-none ${
                assignmentType === 'ASSIGNMENT' 
                  ? 'bg-[#181818] text-white' 
                  : 'text-zinc-500 hover:text-brand-dark'
              }`}
            >
              Assignment
            </button>
            <button
              type="button"
              onClick={() => setAssignmentType('EXAM')}
              className={`flex-1 h-9 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-colors focus:outline-none ${
                assignmentType === 'EXAM' 
                  ? 'bg-[#181818] text-white' 
                  : 'text-zinc-500 hover:text-brand-dark'
              }`}
            >
              Exam Paper
            </button>
          </div>
        </div>

        {/* Global Metadata Inputs Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 font-heading">Academic Year</label>
            <input 
              type="text" 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 font-heading">Class</label>
            <input 
              type="text" 
              value={classLevel} 
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 font-heading">Subject</label>
            <input 
              type="text" 
              value={subjectName} 
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Conditional Inputs Block */}
        {assignmentType === 'ASSIGNMENT' ? (
          /* ASSIGNMENT CONDITIONAL FIELDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500 font-heading">Assignment Title</label>
              <input 
                type="text" 
                value={assignmentTitle} 
                onChange={(e) => setAssignmentTitle(e.target.value)}
                className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500 font-heading">Due Date</label>
              <div className="relative w-full h-11 border border-brand-line-grey rounded-full px-4 flex items-center justify-between bg-white focus-within:border-brand-orange">
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-400 focus:outline-none font-heading font-medium"
                />
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        ) : (
          /* EXAM CONDITIONAL FIELDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500 font-heading">Exam Date</label>
              <div className="relative w-full h-11 border border-brand-line-grey rounded-full px-4 flex items-center justify-between bg-white focus-within:border-brand-orange">
                <input 
                  type="date" 
                  value={examDate} 
                  onChange={(e) => setExamDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-400 focus:outline-none font-heading font-medium"
                />
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-gray-500 font-heading">Exam Timing / Duration</label>
              <div className="relative w-full h-11 border border-brand-line-grey rounded-full px-4 flex items-center justify-between bg-white focus-within:border-brand-orange">
                <input 
                  type="text" 
                  value={examTiming} 
                  onChange={(e) => setExamTiming(e.target.value)}
                  placeholder="e.g. 09:00 AM - 12:00 PM"
                  className="flex-1 bg-transparent text-sm text-brand-dark focus:outline-none font-heading font-medium"
                />
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) setUploadedFile(file);
              }}
              className="w-full h-[202px] bg-white border border-dashed border-brand-line-grey rounded-3xl flex flex-col justify-center items-center gap-4 cursor-pointer relative hover:bg-zinc-50 transition-colors"
            >
              <input 
                type="file" 
                id="file-input"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".txt,.pdf"
              />
              <div className="w-10 h-10 bg-[#F6F6F6] rounded-xl flex items-center justify-center">
                <Cloud className="w-6 h-6 text-[#1E1E1E]" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center px-4">
                <span className="text-base font-semibold text-brand-dark font-heading truncate max-w-full">
                  {uploadedFile ? uploadedFile.name : 'Choose a file or drag & drop it here'}
                </span>
                <span className="text-xs lg:text-sm text-zinc-400 font-heading">
                  {uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'TXT, PDF, upto 10MB'}
                </span>
              </div>
              {!uploadedFile && (
                <div className="h-9 px-6 bg-[#F6F6F6] hover:bg-zinc-200 rounded-full flex items-center justify-center font-heading text-sm text-brand-dark font-semibold">
                  Browse Files
                </div>
              )}
            </div>
            <span className="text-xs lg:text-base text-zinc-500 font-medium text-center font-heading px-2">
              Upload document coordinates of your preferred reference source material
            </span>
          </div>

          {uploadedFile && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-brand-line-grey flex flex-col gap-2 transition-all">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-brand-orange" />
                  Source Text Preview Block
                </span>
                <span>{isParsing ? 'Parsing Content...' : 'Parsed successfully'}</span>
              </div>
              {isParsing ? (
                <div className="h-16 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              ) : (
                <div className="text-xs text-zinc-600 font-mono bg-white p-3 rounded-lg border border-gray-100 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {previewText || 'No plain text found inside uploaded material.'}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-12">
            <div className="w-full flex-1 flex flex-col gap-4">
              <label className="text-base font-bold text-brand-dark font-heading">Question Type</label>
              
              <div className="flex flex-col gap-3">
                {configs.map((cfg, index) => (
                  <div key={index} className="flex items-center gap-2 h-11">
                    <div className="flex-1 bg-white h-full border border-brand-line-grey rounded-full px-4 flex items-center justify-between shadow-sm">
                      <input 
                        type="text" 
                        value={cfg.type}
                        onChange={(e) => {
                          const updated = [...configs];
                          updated[index].type = e.target.value;
                          setConfigs(updated);
                        }}
                        className="text-xs lg:text-sm font-semibold text-brand-dark bg-transparent focus:outline-none font-heading w-full"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeConfigType(index)}
                      className="w-11 h-11 bg-white hover:bg-red-50 border border-brand-line-grey rounded-full flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={addConfigType}
                className="flex items-center gap-2 mt-2 h-9"
              >
                <div className="w-9 h-9 bg-brand-dark rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm text-brand-dark font-heading">Add Question Type</span>
              </button>
            </div>

            <div className="w-full lg:w-auto flex gap-4 justify-between lg:justify-start">
              <div className="flex flex-col gap-4 items-center">
                <span className="text-xs lg:text-base font-medium text-brand-dark font-heading">No. of Questions</span>
                <div className="flex flex-col gap-3">
                  {configs.map((cfg, index) => (
                    <div key={index} className="w-[100px] lg:w-[120px] h-11 bg-white rounded-full border border-brand-line-grey shadow-sm flex items-center justify-between px-3 focus-within:border-brand-orange transition-all">
                      <button 
                        type="button"
                        onClick={() => updateCount(index, -1)}
                        className="text-gray-400 font-extrabold focus:outline-none"
                      >
                        <Minus className="w-4 h-4 text-brand-line-grey" />
                      </button>
                      <input 
                        type="number"
                        value={cfg.count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const updated = [...configs];
                          updated[index].count = isNaN(val) ? 0 : Math.max(0, val);
                          setConfigs(updated);
                        }}
                        className="w-10 lg:w-12 text-center bg-transparent focus:outline-none font-heading text-sm lg:text-base font-semibold text-brand-dark [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button 
                        type="button"
                        onClick={() => updateCount(index, 1)}
                        className="text-gray-400 font-extrabold focus:outline-none"
                      >
                        <Plus className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 items-center">
                <span className="text-xs lg:text-base font-medium text-brand-dark font-heading">Marks</span>
                <div className="flex flex-col gap-3">
                  {configs.map((cfg, index) => (
                    <div key={index} className="w-[100px] lg:w-[120px] h-11 bg-white rounded-full border border-brand-line-grey shadow-sm flex items-center justify-between px-3 focus-within:border-brand-orange transition-all">
                      <button 
                        type="button"
                        onClick={() => updateMarks(index, -1)}
                        className="text-brand-line-grey focus:outline-none"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input 
                        type="number"
                        value={cfg.marksPerQuestion}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const updated = [...configs];
                          updated[index].marksPerQuestion = isNaN(val) ? 0 : Math.max(0, val);
                          setConfigs(updated);
                        }}
                        className="w-10 lg:w-12 text-center bg-transparent focus:outline-none font-heading text-sm lg:text-base font-semibold text-brand-dark [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button 
                        type="button"
                        onClick={() => updateMarks(index, 1)}
                        className="text-gray-500 focus:outline-none"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 w-full border-t border-brand-line-grey pt-4 text-sm lg:text-base">
            <span className="font-semibold text-brand-dark font-heading">Total Questions : {totalQuestions}</span>
            <span className="font-semibold text-brand-dark font-heading">Total Marks : {totalMarks}</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-bold text-brand-dark font-heading">Additional Information (For better output)</label>
            <div className="w-full h-[102px] rounded-2xl border border-brand-line-grey bg-white p-4 flex flex-col justify-between">
              <textarea 
                rows="2"
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                className="w-full text-xs lg:text-sm text-zinc-500 bg-transparent focus:outline-none font-heading resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-mic border transition-all duration-200 focus:outline-none ${
                    isListening 
                      ? 'bg-brand-orange text-white border-brand-orange animate-pulse scale-105' 
                      : 'bg-zinc-100 text-brand-dark hover:bg-zinc-200 border-transparent'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="w-full flex items-center justify-between pt-4">
        <button 
          type="button"
          onClick={() => setView('LIST')}
          className="h-[46px] px-6 bg-white hover:bg-gray-50 rounded-full flex items-center gap-1 border border-brand-line-grey transition-all active:scale-95 shadow-sm text-sm lg:text-base"
        >
          <ArrowLeft className="w-5 h-5 text-brand-dark" />
          <span className="font-heading text-brand-dark font-semibold">Previous</span>
        </button>

        <button 
          type="button"
          onClick={handleSubmit}
          className="h-[46px] px-6 bg-brand-btn-dark hover:bg-zinc-800 text-white rounded-full flex items-center gap-1 transition-all active:scale-95 shadow-sidebar text-sm lg:text-base"
        >
          <span className="font-heading font-semibold">Continue</span>
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}