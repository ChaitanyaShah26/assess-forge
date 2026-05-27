import React, { useState } from 'react';
import axios from 'axios';
import { 
  GraduationCap, CheckSquare, Users, 
  RefreshCw, Copy, Send, Sparkles, Clock 
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TeachersToolkit() {
  const [activeTab, setActiveTab] = useState('REWRITER'); // 'REWRITER', 'RUBRIC', 'ACTIVITY'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Bloom's Rewriter States
  const [originalQuestion, setOriginalQuestion] = useState('What is the role of a resistor in an electric circuit?');
  const [cognitiveLevel, setCognitiveLevel] = useState('Applying');
  const [rewrittenResult, setRewrittenResult] = useState(null);

  // 2. Rubric Generator States
  const [rubricTopic, setRubricTopic] = useState('Write an essay evaluating the environmental impacts of plastic waste.');
  const [rubricCriteria, setRubricCriteria] = useState('Grammar and syntax, Argument coherence, Research citations');
  const [rubricResult, setRubricResult] = useState(null);

  // 3. Group Activity Designer States
  const [activityTopic, setActivityTopic] = useState('Mitosis vs Meiosis: Biological Cell Division');
  const [groupSize, setGroupSize] = useState('4 Students per group');
  const [activityResult, setActivityResult] = useState(null);

  const resetAllOutputs = () => {
    setRewrittenResult(null);
    setRubricResult(null);
    setActivityResult(null);
  };

  const handleRewrite = async (e) => {
    e.preventDefault();
    if (!originalQuestion) return alert('Enter a question.');
    setLoading(true);
    resetAllOutputs();

    try {
      const res = await axios.post(`${API_BASE}/api/toolkit/rewrite-question`, {
        questionText: originalQuestion,
        cognitiveLevel
      });
      if (res.data.success) {
        setRewrittenResult(res.data.result);
      }
    } catch (err) {
      alert('Failed to rewrite question.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRubric = async (e) => {
    e.preventDefault();
    if (!rubricTopic || !rubricCriteria) return alert('All fields are mandatory.');
    setLoading(true);
    resetAllOutputs();

    try {
      const res = await axios.post(`${API_BASE}/api/toolkit/generate-rubric`, {
        topic: rubricTopic,
        criteria: rubricCriteria
      });
      if (res.data.success) {
        setRubricResult(res.data.rubric);
      }
    } catch (err) {
      alert('Failed to generate rubric.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActivity = async (e) => {
    e.preventDefault();
    if (!activityTopic || !groupSize) return alert('All fields are mandatory.');
    setLoading(true);
    resetAllOutputs();

    try {
      const res = await axios.post(`${API_BASE}/api/toolkit/generate-activity`, {
        subjectTopic: activityTopic,
        groupSize
      });
      if (res.data.success) {
        setActivityResult(res.data.result);
      }
    } catch (err) {
      alert('Failed to design class activity.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 select-none px-2 lg:px-0 relative">
      
      {/* Tab Navigation selector row (Now holds only 3 active tools) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-[#F0F0F0] p-1.5 rounded-full border border-gray-200">
          <button
            onClick={() => { setActiveTab('REWRITER'); resetAllOutputs(); }}
            className={`h-9 px-4 rounded-full flex items-center gap-1.5 text-xs lg:text-sm font-semibold transition-colors focus:outline-none ${
              activeTab === 'REWRITER' ? 'bg-[#181818] text-white' : 'text-zinc-500 hover:text-brand-dark'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Bloom's Rewriter
          </button>
          
          <button
            onClick={() => { setActiveTab('RUBRIC'); resetAllOutputs(); }}
            className={`h-9 px-4 rounded-full flex items-center gap-1.5 text-xs lg:text-sm font-semibold transition-colors focus:outline-none ${
              activeTab === 'RUBRIC' ? 'bg-[#181818] text-white' : 'text-zinc-500 hover:text-brand-dark'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Rubric Creator
          </button>

          <button
            onClick={() => { setActiveTab('ACTIVITY'); resetAllOutputs(); }}
            className={`h-9 px-4 rounded-full flex items-center gap-1.5 text-xs lg:text-sm font-semibold transition-colors focus:outline-none ${
              activeTab === 'ACTIVITY' ? 'bg-[#181818] text-white' : 'text-zinc-500 hover:text-brand-dark'
            }`}
          >
            <Users className="w-4 h-4" />
            Activity Designer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Dynamic Inputs forms */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
          
          {activeTab === 'REWRITER' && (
            <form onSubmit={handleRewrite} className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-brand-dark font-heading">Bloom's Cognitive Question Improver</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Target Cognitive Tier</label>
                <select
                  value={cognitiveLevel}
                  onChange={(e) => setCognitiveLevel(e.target.value)}
                  className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading bg-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="Remembering">Remembering (Recall, Define)</option>
                  <option value="Understanding">Understanding (Explain, Summarize)</option>
                  <option value="Applying">Applying (Execute, Implement)</option>
                  <option value="Analyzing">Analyzing (Compare, Deconstruct)</option>
                  <option value="Evaluating">Evaluating (Appraise, Critique)</option>
                  <option value="Creating">Creating (Design, Construct)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Draft Question Text</label>
                <textarea
                  rows="4"
                  value={originalQuestion}
                  onChange={(e) => setOriginalQuestion(e.target.value)}
                  className="w-full border border-brand-line-grey rounded-2xl p-4 text-sm font-heading focus:outline-none resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 focus:outline-none"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                Rewrite Question
              </button>
            </form>
          )}

          {activeTab === 'RUBRIC' && (
            <form onSubmit={handleGenerateRubric} className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-brand-dark font-heading">Grading Rubric Generator</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Evaluation Topic / Essay Prompt</label>
                <textarea
                  rows="3"
                  value={rubricTopic}
                  onChange={(e) => setRubricTopic(e.target.value)}
                  className="w-full border border-brand-line-grey rounded-2xl p-4 text-sm font-heading focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Evaluation Criteria (Comma Separated)</label>
                <input
                  type="text"
                  value={rubricCriteria}
                  onChange={(e) => setRubricCriteria(e.target.value)}
                  className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 focus:outline-none"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                Generate Rubric
              </button>
            </form>
          )}

          {activeTab === 'ACTIVITY' && (
            <form onSubmit={handleGenerateActivity} className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-brand-dark font-heading">Active Group Exercise Designer</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Subject Topic</label>
                <input
                  type="text"
                  value={activityTopic}
                  onChange={(e) => setActivityTopic(e.target.value)}
                  className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Target Group Size</label>
                <input
                  type="text"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  className="w-full h-11 border border-brand-line-grey rounded-full px-4 text-sm font-heading focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 focus:outline-none"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                Design Group Activity
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Dynamic Outputs containers */}
        <div className="flex flex-col gap-6 overflow-hidden max-w-full">
          
          {/* 1. REWRITER PREVIEW OUTPUT */}
          {rewrittenResult && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-base font-bold text-brand-dark font-heading">AI Rewritten Outcome</h3>
                <button 
                  onClick={() => handleCopyText(rewrittenResult.rewrittenQuestion)}
                  className="h-8 px-3 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold rounded-full flex items-center gap-1 border border-brand-line-grey focus:outline-none"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-base font-bold text-brand-dark leading-relaxed font-sans">
                  {rewrittenResult.rewrittenQuestion}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                  Cognitive Target analysis
                </span>
                <p className="text-xs text-zinc-500 leading-relaxed italic">
                  {rewrittenResult.explanation}
                </p>
              </div>
            </div>
          )}

          {/* 2. RUBRIC PREVIEW OUTPUT */}
          {rubricResult && (
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col gap-4 overflow-x-auto max-w-full">
              <h3 className="text-base font-bold text-brand-dark font-heading px-2 pb-2 border-b border-gray-100">AI Evaluation Rubric Matrix</h3>
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-50 border-b border-gray-100 text-zinc-400 font-heading uppercase tracking-wider h-10">
                    <th className="pl-3">Criterion</th>
                    <th>Excellent (4)</th>
                    <th>Good (3)</th>
                    <th>Fair (2)</th>
                    <th>Poor (1)</th>
                  </tr>
                </thead>
                <tbody>
                  {rubricResult.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-zinc-50/50">
                      <td className="pl-3 py-3 font-bold text-brand-dark align-top max-w-[100px]">{row.criterion}</td>
                      <td className="p-3 text-zinc-600 align-top max-w-[120px] leading-relaxed">{row.excellent}</td>
                      <td className="p-3 text-zinc-500 align-top max-w-[120px] leading-relaxed">{row.good}</td>
                      <td className="p-3 text-zinc-500 align-top max-w-[120px] leading-relaxed">{row.fair}</td>
                      <td className="p-3 text-zinc-400 align-top max-w-[120px] leading-relaxed">{row.poor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. ACTIVE GROUP ACTIVITY PREVIEW OUTPUT */}
          {activityResult && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-base font-bold text-brand-dark font-heading">{activityResult.title}</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400 font-semibold">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{activityResult.duration}</span>
                </div>
              </div>

              {/* Classroom Setup guidelines */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading">Teacher Setup Guide</span>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium italic">{activityResult.setup}</p>
              </div>

              {/* Central Debate/Challenge Question */}
              <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100/50 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider font-heading">Core Debate Prompt / Challenge Question</span>
                <p className="text-sm font-bold text-brand-dark leading-relaxed font-sans">{activityResult.prompt}</p>
              </div>

              {/* Chronological Student Steps */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading">Chronological Student Steps</span>
                <div className="flex flex-col gap-2.5 font-sans pl-1">
                  {activityResult.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs">
                      <span className="font-bold text-brand-orange">{idx + 1}.</span>
                      <span className="text-zinc-600 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty Fallback State */}
          {!rewrittenResult && !rubricResult && !activityResult && (
            <div className="bg-zinc-50/30 border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400 font-heading h-full flex items-center justify-center min-h-[350px]">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-orange" />
                  <span>AI is drafting curriculum parameters...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 text-zinc-300" />
                  <span>Configure metrics on the left panel and click execute.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}