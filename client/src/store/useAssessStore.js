import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useAssessStore = create((set, get) => ({
  assignments: [],
  groups: [],
  metrics: { 
    totalCreated: 0, 
    assignmentsCount: 0, 
    examsCount: 0, 
    totalStudents: 0, 
    totalGroups: 0, 
    recentActivity: [] 
  },
  
  currentAssignment: null, 
  activeGroup: null,       
  activeView: 'HOME',      
  
  isGenerating: false,
  generationProgress: { status: 'PENDING', progress: 0, error: null },
  socket: null,

  setView: (view) => set({ 
    activeView: view, 
    activeGroup: null 
  }),

  setDetailedAssignment: (assignment) => set({ 
    currentAssignment: assignment, 
    activeView: 'VIEW_PAPER' 
  }),

  inspectGroup: (group) => set({ 
    activeGroup: group, 
    activeView: 'GROUPS' 
  }),

  fetchAssignments: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments`);
      set({ assignments: res.data });
    } catch (err) {
      console.error('Failed to query assignments:', err);
    }
  },

  deleteAssignment: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/assignments/${id}`);
      get().fetchAssignments();
      get().fetchMetrics(); 
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  },

  fetchMetrics: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments/dashboard-metrics`);
      set({ metrics: res.data });
    } catch (err) {
      console.error('Failed to query dashboard metrics:', err);
    }
  },

  fetchGroups: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/class-groups`);
      set({ groups: res.data });
      
      const activeId = get().activeGroup?._id;
      if (activeId) {
        const updatedGroup = res.data.find(g => g._id === activeId);
        set({ activeGroup: updatedGroup });
      }
    } catch (err) {
      console.error('Failed to query class groups:', err);
    }
  },

  createGroup: async (groupData) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups`, groupData);
      get().fetchGroups();
      get().fetchMetrics(); 
    } catch (err) {
      console.error('Failed to create class group:', err);
    }
  },

  updateGroup: async (id, groupData) => {
    try {
      await axios.put(`${API_BASE}/api/class-groups/${id}`, groupData);
      get().fetchGroups();
    } catch (err) {
      console.error('Failed to update class group:', err);
    }
  },

  deleteGroup: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/class-groups/${id}`);
      get().fetchGroups();
      get().fetchMetrics();
    } catch (err) {
      console.error('Failed to delete class group:', err);
    }
  },

  addStudentsToGroup: async (groupId, studentsList) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups/${groupId}/students`, { studentsList });
      get().fetchGroups(); 
    } catch (err) {
      console.error('Failed to import student array:', err);
    }
  },

  dispatchPaperToGroup: async (groupId, paperId) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups/${groupId}/dispatch`, { paperId });
      get().fetchGroups(); 
    } catch (err) {
      console.error('Failed to dispatch paper:', err);
      alert(err.response?.data?.error || 'Failed to dispatch paper to class.');
    }
  },

  createAssignment: async (formData) => {
    set({ 
      isGenerating: true, 
      activeView: 'LIST', 
      generationProgress: { status: 'ENQUEUED', progress: 5, error: null } 
    });

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
          set({ 
            isGenerating: false, 
            activeView: 'VIEW_PAPER', 
            currentAssignment: { _id: assignmentId, generatedPaper: data.paper } 
          });
          get().fetchAssignments(); 
          get().fetchMetrics();     
          socketInstance.disconnect();
        }

        if (data.status === 'FAILED') {
          set({ 
            isGenerating: false, 
            generationProgress: { status: 'FAILED', progress: 0, error: data.error } 
          });
          socketInstance.disconnect();
        }
      });

    } catch (err) {
      console.error('Failed to initialize assessment creation request:', err);
      const errorMsg = err.response?.data?.error || 'Request processing aborted.';
      set({ 
        isGenerating: false, 
        generationProgress: { status: 'FAILED', progress: 0, error: errorMsg } 
      });
    }
  }
}));