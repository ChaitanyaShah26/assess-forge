import React, { useState } from 'react';
import { useAssessStore } from './../store/useAssessStore';
import { Download, RefreshCw, FileText, CheckSquare } from 'lucide-react';

export default function PaperViewer() {
  const { currentAssignment, setView } = useAssessStore();
  const [printCopyType, setPrintCopyType] = useState('STUDENT'); // 'STUDENT' or 'TEACHER'

  if (!currentAssignment || !currentAssignment.generatedPaper) {
    return (
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-sm">
        <span className="text-zinc-400 font-heading">Select or generate an assignment to render.</span>
        <button onClick={() => setView('LIST')} className="mt-4 text-brand-orange underline font-heading">
          Return to List
        </button>
      </div>
    );
  }

  const paper = currentAssignment.generatedPaper;
  const isExam = currentAssignment.assignmentType === 'EXAM';

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleRegenerate = () => {
    setView('CREATE');
  };

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 relative select-none px-2 lg:px-0">
      {/* Outer gray container */}
      <div className="bg-brand-bg-dark rounded-[32px] p-3 sm:p-5 flex flex-col gap-6">
        
        {/* Header action control bar */}
        <div className="bg-[#181818]/80 backdrop-blur-md rounded-[32px] p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-full border border-zinc-800">
            <button
              onClick={() => setPrintCopyType('STUDENT')}
              className={`h-8 lg:h-9 px-3 lg:px-4 rounded-full flex items-center gap-1.5 text-xs lg:text-sm font-semibold transition-colors focus:outline-none ${
                printCopyType === 'STUDENT' 
                  ? 'bg-brand-orange text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Student Copy
            </button>
            <button
              onClick={() => setPrintCopyType('TEACHER')}
              className={`h-8 lg:h-9 px-3 lg:px-4 rounded-full flex items-center gap-1.5 text-xs lg:text-sm font-semibold transition-colors focus:outline-none ${
                printCopyType === 'TEACHER' 
                  ? 'bg-brand-orange text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Answer Key
            </button>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button 
              onClick={handleRegenerate}
              className="h-9 lg:h-11 px-4 lg:px-6 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center gap-1.5 text-white border border-zinc-700 transition-all active:scale-95 shadow-sm focus:outline-none text-xs lg:text-sm"
            >
              <RefreshCw className="w-4 h-4 text-yellow-400" />
              <span className="font-heading font-semibold">Regenerate</span>
            </button>

            <button 
              onClick={handlePrint}
              className="h-9 lg:h-11 px-4 lg:px-6 bg-white hover:bg-gray-50 rounded-full flex items-center gap-1.5 text-brand-dark transition-all active:scale-95 shadow-sidebar focus:outline-none text-xs lg:text-sm"
            >
              <Download className="w-4 h-4 text-brand-dark" />
              <span className="font-heading font-semibold">
                {printCopyType === 'STUDENT' ? 'Print Student' : 'Print Solution'}
              </span>
            </button>
          </div>
        </div>

        {/* White Exam Card */}
        <div className="bg-white rounded-[32px] p-4 sm:p-12 flex flex-col gap-8 shadow-sidebar print-paper">
          
          <div className="flex flex-col items-center gap-1 pb-4 border-b-2 border-brand-dark text-center">
            <h1 className="text-xl lg:text-3xl font-extrabold tracking-wider text-brand-dark uppercase font-heading">
              Delhi Public School, Sector-4, Bokaro
            </h1>
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="text-sm lg:text-lg font-bold text-zinc-600 font-heading">
                {isExam 
                  ? `Annual Examination (${currentAssignment.academicYear})` 
                  : `Assignment: ${currentAssignment.assignmentTitle}`
                }
              </span>
              {printCopyType === 'TEACHER' && (
                <span className="text-sm lg:text-base font-bold text-brand-orange tracking-widest uppercase font-heading mt-1">
                  — Official Marking Scheme & Solutions Guide —
                </span>
              )}
              <div className="flex gap-3 mt-1.5 text-xs lg:text-sm text-zinc-500 font-semibold">
                <span>Subject: {currentAssignment.subjectName}</span>
                <span>•</span>
                <span>Class: {currentAssignment.classLevel}</span>
              </div>
            </div>
          </div>

          {printCopyType === 'STUDENT' ? (
            <div className="flex flex-col gap-8">
              {/* Metadata Panel */}
              <div className="flex justify-between items-center bg-zinc-50 px-4 py-3 rounded-2xl border border-gray-100 print-break-avoid text-xs sm:text-base">
                {isExam ? (
                  <span className="font-semibold text-brand-dark font-sans">
                    Exam Timings: {currentAssignment.examTiming} (Date: {new Date(currentAssignment.examDate).toLocaleDateString('en-GB')})
                  </span>
                ) : (
                  <span className="font-semibold text-brand-dark font-sans">
                    Due Date: {new Date(currentAssignment.dueDate).toLocaleDateString('en-GB')}
                  </span>
                )}
                <span className="font-semibold text-brand-dark font-sans">Maximum Marks: {paper.maxMarks}</span>
              </div>

              <p className="text-xs lg:text-base font-semibold text-brand-dark font-sans italic">
                All questions are compulsory unless stated otherwise.
              </p>

              {/* Student detail blanks */}
              <div className="flex flex-col gap-2 bg-zinc-50 p-4 rounded-2xl border border-gray-100 font-sans font-semibold text-xs sm:text-base print-break-avoid">
                <div className="flex items-center gap-1">
                  <span>Name:</span>
                  <div className="flex-1 border-b border-dashed border-gray-400 h-5"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span>Roll Number:</span>
                  <div className="flex-1 border-b border-dashed border-gray-400 h-5"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span>Class: {currentAssignment.classLevel} Section:</span>
                  <div className="flex-1 border-b border-dashed border-gray-400 h-5"></div>
                </div>
              </div>

              {/* Question list for Student Copy */}
              {paper.sections.map((sec, secIdx) => (
                <div key={secIdx} className="flex flex-col gap-6 mt-4">
                  <div className="flex flex-col gap-1 border-b border-zinc-200 pb-2">
                    <h3 className="text-lg lg:text-2xl font-bold text-brand-orange font-heading">{sec.sectionName}</h3>
                    {sec.instruction && (
                      <span className="text-xs lg:text-sm font-semibold text-brand-muted italic">{sec.instruction}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-6 pl-1 sm:pl-2">
                    {sec.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex flex-col gap-4 p-2 sm:p-4 rounded-xl hover:bg-zinc-50/50 transition-colors print-break-avoid">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <span className="font-bold text-brand-dark text-sm sm:text-base">{q.questionNumber}.</span>
                            <span className="text-sm sm:text-base font-semibold text-brand-dark leading-relaxed">
                              {q.questionText}
                            </span>
                          </div>
                          <span className="font-bold text-brand-orange text-xs sm:text-sm whitespace-nowrap">
                            [{q.marks} Marks]
                          </span>
                        </div>

                        {/* Renders MCQ Options in a beautiful structured grid */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 mt-2">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="bg-zinc-50 border border-zinc-200/60 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-brand-dark font-medium leading-none flex items-center shadow-sm select-none hover:bg-zinc-100/50 transition-colors">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Renders crisp, responsive inline SVG vector diagrams if present */}
                        {q.diagramSvg && (
                          <div className="my-4 p-4 bg-zinc-50/30 border border-brand-line-grey rounded-2xl max-w-md mx-auto flex justify-center items-center print-break-avoid overflow-hidden shadow-inner">
                            <div 
                              className="w-full h-auto flex justify-center select-none"
                              dangerouslySetInnerHTML={{ __html: q.diagramSvg }} 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="w-full flex items-center justify-center my-6 no-print">
                <div className="border-t border-brand-line-grey flex-1"></div>
                <span className="mx-4 text-xs font-bold text-brand-muted uppercase tracking-widest font-sans">
                  End of Question Paper
                </span>
                <div className="border-t border-brand-line-grey flex-1"></div>
              </div>
            </div>
          ) : (
            /* Render clean, dedicated ANSWER KEY COPY (Teacher Mode) */
            <div className="flex flex-col gap-8">
              {paper.answerKey && paper.answerKey.length > 0 ? (
                <div className="flex flex-col gap-8">
                  {paper.answerKey.map((ans, ansIdx) => {
                    let matchedQuestion = '';
                    let matchedDifficulty = 'Easy';
                    let matchedMarks = 1;
                    let matchedOptions = [];
                    let matchedDiagram = '';
                    
                    for (const sec of paper.sections) {
                      const found = sec.questions.find(q => q.questionNumber === ans.questionNumber);
                      if (found) {
                        matchedQuestion = found.questionText;
                        matchedDifficulty = found.difficulty || 'Easy';
                        matchedMarks = found.marks || 1;
                        matchedOptions = found.options || [];
                        matchedDiagram = found.diagramSvg || '';
                        break;
                      }
                    }

                    return (
                      <div key={ansIdx} className="flex flex-col gap-4 border-b border-gray-100 pb-6 last:border-0 print-break-avoid">
                        <div className="flex flex-col gap-1.5 border-l-4 border-brand-orange pl-3 bg-zinc-50 py-2 rounded-r-lg">
                          <div className="flex items-center justify-between pr-2">
                            <span className="text-[10px] sm:text-xs font-bold text-brand-orange uppercase tracking-wider font-heading">
                              Question {ans.questionNumber}
                            </span>
                            <div className="flex gap-2">
                              <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                                matchedDifficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                                matchedDifficulty === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {matchedDifficulty}
                              </span>
                              <span className="text-xs font-bold text-zinc-500">[{matchedMarks} Marks]</span>
                            </div>
                          </div>
                          
                          <p className="text-sm sm:text-base font-semibold text-brand-dark leading-relaxed mt-1">
                            {matchedQuestion}
                          </p>

                          {/* Options list also visible on teacher keys */}
                          {matchedOptions && matchedOptions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-w-xl">
                              {matchedOptions.map((opt, optIdx) => (
                                <div key={optIdx} className="bg-white/80 border border-zinc-200/60 px-3 py-1.5 rounded-lg text-xs text-zinc-600 font-medium">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Diagrams visible on teacher keys as well */}
                          {matchedDiagram && (
                            <div className="my-2 p-2 bg-white/60 border border-brand-line-grey rounded-xl max-w-sm flex justify-center items-center">
                              <div 
                                className="w-full h-auto flex justify-center select-none scale-90"
                                dangerouslySetInnerHTML={{ __html: matchedDiagram }} 
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 pl-3">
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 self-start px-2 py-0.5 rounded-md tracking-wide">
                            SUGGESTED SOLUTION & EVALUATION GUIDELINE:
                          </span>
                          <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {ans.answer.split('\n').map((line, idx) => (
                              <p key={idx} className="mb-1.5 last:mb-0">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400 font-heading">
                  No solutions array generated by AI.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}