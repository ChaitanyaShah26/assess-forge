import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Defensive LocalStorage Helper.
 * Rejects corrupt object-like strings in the browser cache to prevent React rendering crashes.
 */
const getSafeLocalStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(key);
  if (!val) return fallback;
  
  const trimmed = val.trim();
  // Reject JSON objects or arrays disguised as strings
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    console.warn(`Defensive Store Alert: Rejected corrupt object cache for key "${key}".`);
    return fallback;
  }
  return val;
};

export const useAssessStore = create((set, get) => ({
  // Global Database States
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
  library: [], // Master document repository
  
  // Navigation & Detail Inspector States
  currentAssignment: null, // Tracks the paper being inspected in PaperViewer
  activeGroup: null,        // Tracks the classroom being inspected in MyGroups
  activeView: 'HOME',       // 'HOME', 'GROUPS', 'LIST', 'CREATE', 'VIEW_PAPER'
  
  // Persistent Preferences States (Synced with LocalStorage via defensive safety loader)
  schoolName: getSafeLocalStorage('AF_SCHOOL_NAME', 'Delhi Public School, Sector-4, Bokaro'),
  schoolLocation: getSafeLocalStorage('AF_SCHOOL_LOCATION', 'Bokaro Steel City'),
  teacherName: getSafeLocalStorage('AF_TEACHER_NAME', 'John Doe'),
  defaultClass: getSafeLocalStorage('AF_DEFAULT_CLASS', 'Class 12th'),
  defaultSubject: getSafeLocalStorage('AF_DEFAULT_SUBJECT', 'Computer Science'),
  academicYear: getSafeLocalStorage('AF_ACADEMIC_YEAR', '2026-2027'),

  // Real-time WebSockets Progress States
  isGenerating: false,
  generationProgress: { status: 'PENDING', progress: 0, error: null },
  socket: null,

  // Direct tab views router
  setView: (view) => set({ 
    activeView: view, 
    activeGroup: null // Clears any active group inspection when switching tabs
  }),

  // Transitions view to full paper sheet preview
  setDetailedAssignment: (assignment) => set({ 
    currentAssignment: assignment, 
    activeView: 'VIEW_PAPER' 
  }),

  // Inspects a classroom group detail panel
  inspectGroup: (group) => set({ 
    activeGroup: group, 
    activeView: 'GROUPS' 
  }),

  // Update persistent preferences and sync with LocalStorage
  savePreferences: (prefs) => {
    if (typeof window !== 'undefined') {
      if (prefs.schoolName) localStorage.setItem('AF_SCHOOL_NAME', prefs.schoolName);
      if (prefs.schoolLocation) localStorage.setItem('AF_SCHOOL_LOCATION', prefs.schoolLocation);
      if (prefs.teacherName) localStorage.setItem('AF_TEACHER_NAME', prefs.teacherName);
      if (prefs.defaultClass) localStorage.setItem('AF_DEFAULT_CLASS', prefs.defaultClass);
      if (prefs.defaultSubject) localStorage.setItem('AF_DEFAULT_SUBJECT', prefs.defaultSubject);
      if (prefs.academicYear) localStorage.setItem('AF_ACADEMIC_YEAR', prefs.academicYear);
    }
    set({
      schoolName: prefs.schoolName || get().schoolName,
      schoolLocation: prefs.schoolLocation || get().schoolLocation,
      teacherName: prefs.teacherName || get().teacherName,
      defaultClass: prefs.defaultClass || get().defaultClass,
      defaultSubject: prefs.defaultSubject || get().defaultSubject,
      academicYear: prefs.academicYear || get().academicYear
    });
  },

  /* ==========================================================================
     VECTOR 1: Assignments Operations (CRUD)
     ========================================================================== */

  // Query all drafted papers
  fetchAssignments: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments`);
      set({ assignments: res.data });
    } catch (err) {
      console.error('Failed to query assignments:', err);
    }
  },

  // Delete drafted paper from DB
  deleteAssignment: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/assignments/${id}`);
      get().fetchAssignments();
      get().fetchMetrics(); // Refresh dashboard counts
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  },

  // Query real-time dashboard aggregate statistics from MongoDB
  fetchMetrics: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments/dashboard-metrics`);
      set({ metrics: res.data });
    } catch (err) {
      console.error('Failed to query dashboard metrics:', err);
    }
  },

  /* ==========================================================================
     VECTOR 2: My Library CRUD Handlers
     ========================================================================== */

  // Fetch all documents uploaded into the My Library repository
  fetchLibrary: async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/assignments/library`);
      set({ library: res.data });
    } catch (err) {
      console.error('Failed to query library:', err);
    }
  },

  // Upload a document directly to the My Library vault
  uploadToLibrary: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_BASE}/api/assignments/library`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      get().fetchLibrary();
    } catch (err) {
      console.error('Failed to upload library doc:', err);
    }
  },

  // Delete a document from the My Library repository
  deleteFromLibrary: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/assignments/library/${id}`);
      get().fetchLibrary();
    } catch (err) {
      console.error('Failed to delete library doc:', err);
    }
  },

  /* ==========================================================================
     VECTOR 3: Classroom Directories Operations (CRUD & Bulk Uploads)
     ========================================================================== */

  // Query all student classrooms
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

  // Create new classroom group
  createGroup: async (groupData) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups`, groupData);
      get().fetchGroups();
      get().fetchMetrics(); // Refresh reach counts
    } catch (err) {
      console.error('Failed to create class group:', err);
    }
  },

  // Update classroom metadata details
  updateGroup: async (id, groupData) => {
    try {
      await axios.put(`${API_BASE}/api/class-groups/${id}`, groupData);
      get().fetchGroups();
    } catch (err) {
      console.error('Failed to update class group:', err);
    }
  },

  // Delete classroom group
  deleteGroup: async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/class-groups/${id}`);
      get().fetchGroups();
      get().fetchMetrics();
    } catch (err) {
      console.error('Failed to delete class group:', err);
    }
  },

  // Bulk add manual or CSV parsed student directory arrays to MongoDB
  addStudentsToGroup: async (groupId, studentsList) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups/${groupId}/students`, { studentsList });
      get().fetchGroups(); // Reload the active section list and count
    } catch (err) {
      console.error('Failed to import student array:', err);
    }
  },

  // Deploy an existing completed paper to a classroom
  dispatchPaperToGroup: async (groupId, paperId) => {
    try {
      await axios.post(`${API_BASE}/api/class-groups/${groupId}/dispatch`, { paperId });
      get().fetchGroups(); // Hot-reloads the group's dispatched logs
    } catch (err) {
      console.error('Failed to dispatch paper:', err);
      alert(err.response?.data?.error || 'Failed to dispatch paper to class.');
    }
  },

  // Create dynamic assignment request and establish WebSocket tracking stream
  createAssignment: async (formData) => {
    set({ 
      isGenerating: true, 
      activeView: 'LIST', // Shift view to the listing area so the progress banner is visible
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
          get().fetchAssignments(); // Reload listing grid
          get().fetchMetrics();     // Reload dashboard metrics
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