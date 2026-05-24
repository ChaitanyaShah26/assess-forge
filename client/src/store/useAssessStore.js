import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useAssessStore = create((set, get) => ({
  assignments: [],
  groups: [],
  metrics: { totalCreated: 0, assignmentsCount: 0, examsCount: 0, totalStudents: 0, totalGroups: 0, recentActivity: [] },
  currentAssignment: null,
  activeView: 'HOME',
  isGenerating: false,
  generationProgress: { status: 'PENDING', progress: 0, error: null },
  socket: null,

  setView: (view) => set({ activeView: view }),

  fetchAssignments: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments`);
      set({ assignments: res.data });
    } catch (err) {
      console.error('Error querying assignments:', err);
    }
  },

  setDetailedAssignment: (assignment) => set({ currentAssignment: assignment, activeView: 'VIEW_PAPER' }),

  deleteAssignment: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/assignments/${id}`);
      get().fetchAssignments();
      get().fetchMetrics(); 
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  },

  fetchMetrics: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments/dashboard-metrics`);
      set({ metrics: res.data });
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  },

  fetchGroups: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/class-groups`);
      set({ groups: res.data });
    } catch (err) {
      console.error('Failed to query groups:', err);
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axios.post(`${API_BASE}/api/class-groups`, groupData);
      set((state) => ({ groups: [res.data, ...state.groups] }));
      get().fetchMetrics(); 
    } catch (err) {
      console.error('Failed to create classroom:', err);
    }
  },

  dispatchPaper: async (groupId, paperId) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups/${groupId}/assign`, { paperId });
      get().fetchGroups(); 
    } catch (err) {
      console.error('Failed to dispatch paper:', err);
      alert(err.response?.data?.error || 'Failed to dispatch paper.');
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
          generationProgress: { status: data.status, progress: data.progress || 0, error: data.error || null } 
        });

        if (data.status === 'COMPLETED') {
          set({ isGenerating: false, activeView: 'VIEW_PAPER', currentAssignment: { _id: assignmentId, generatedPaper: data.paper } });
          get().fetchAssignments();
          get().fetchMetrics();
          socketInstance.disconnect();
        }

        if (data.status === 'FAILED') {
          set({ isGenerating: false, generationProgress: { status: 'FAILED', progress: 0, error: data.error } });
          socketInstance.disconnect();
        }
      });

    } catch (err) {
      console.error(err);
      set({ isGenerating: false, generationProgress: { status: 'FAILED', progress: 0, error: 'Request aborted.' } });
    }
  }
}));