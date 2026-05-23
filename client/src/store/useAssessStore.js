import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useAssessStore = create((set, get) => ({
  assignments: [],
  currentAssignment: null,
  activeView: 'LIST',
  isGenerating: false,
  generationProgress: { status: 'PENDING', progress: 0, error: null },
  socket: null,
  theme: 'light', 

  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  fetchAssignments: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments`);
      set({ assignments: res.data });
      if (res.data.length === 0) {
        set({ activeView: 'LIST' });
      }
    } catch (err) {
      console.error('Error querying assignments:', err);
    }
  },

  setView: (view) => set({ activeView: view }),

  setDetailedAssignment: (assignment) => set({ currentAssignment: assignment, activeView: 'VIEW_PAPER' }),

  deleteAssignment: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/assignments/${id}`);
      get().fetchAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  },

  createAssignment: async (formData) => {
    set({ isGenerating: true, activeView: 'LIST', generationProgress: { status: 'ENQUEUED', progress: 5, error: null } });

    try {
      const res = await axios.post(`${API_BASE}/api/assignments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { assignmentId } = res.data;
      const socketInstance = io(API_BASE);
      set({ socket: socketInstance });

      socketInstance.on('connect', () => {
        socketInstance.emit('join-assignment', assignmentId);
      });

      socketInstance.on('status:update', (data) => {
        set({ 
          generationProgress: { 
            status: data.status, 
            progress: data.progress || 0, 
            error: data.error || null 
          } 
        });

        if (data.status === 'COMPLETED') {
          set({ isGenerating: false, activeView: 'VIEW_PAPER', currentAssignment: { _id: assignmentId, generatedPaper: data.paper } });
          get().fetchAssignments();
          socketInstance.disconnect();
        }

        if (data.status === 'FAILED') {
          set({ isGenerating: false, generationProgress: { status: 'FAILED', progress: 0, error: data.error } });
          socketInstance.disconnect();
        }
      });

    } catch (err) {
      console.error('Generation failed:', err);
      const errorMsg = err.response?.data?.error || 'Failed to initialize request.';
      set({ isGenerating: false, generationProgress: { status: 'FAILED', progress: 0, error: errorMsg } });
    }
  }
}));