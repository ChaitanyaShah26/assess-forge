'use client';

import React, { useEffect } from 'react';
import { useAssessStore } from '../store/useAssessStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import AssignmentList from '../components/AssignmentList';
import CreateAssignment from '../components/CreateAssignment';
import PaperViewer from '../components/PaperViewer';
import MobileTabBar from '../components/MobileTabBar';

export default function Home() {
  const { activeView, isGenerating, generationProgress, fetchAssignments } = useAssessStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'CREATE':
        return <CreateAssignment />;
      case 'VIEW_PAPER':
        return <PaperViewer />;
      case 'LIST':
      default:
        return <AssignmentList />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* Sidebar - Visible on Desktop, Hidden on Mobile */}
      <Sidebar />

      {/* Main Content Wrapper - Shifts left-margin dynamically on larger viewports */}
      <main className="flex-1 min-h-screen w-full lg:pl-[344px] px-4 lg:pr-8 pt-4 lg:pt-6 pb-28 lg:pb-24 flex flex-col gap-6 items-center">
        <Header />

        {/* WebSocket Progress Indicator */}
        {isGenerating && (
          <div className="w-full max-w-[1100px] bg-brand-btn-dark text-white p-4 rounded-2xl flex flex-col gap-2 shadow-sidebar">
            <div className="flex justify-between items-center text-sm font-semibold font-heading">
              <span className="flex items-center gap-2">
                <span className="animate-spin text-yellow-400">✨</span>
                AI Processing: <span className="text-indigo-400">{generationProgress.status}</span>
              </span>
              <span>{generationProgress.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-300"
                style={{ width: `${generationProgress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Central Fluid content boundary */}
        <div className="w-full max-w-[1100px] flex-1 flex flex-col items-center">
          {renderMainContent()}
        </div>
      </main>

      {/* Bottom App Bar - Visible on Mobile, Hidden on Desktop */}
      <MobileTabBar />
    </div>
  );
}