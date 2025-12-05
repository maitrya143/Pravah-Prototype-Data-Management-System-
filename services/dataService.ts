
import { Student, DiaryEntry, AttendanceRecord, User, Center, Feedback, SyllabusProgress } from '../types';
import { CENTERS } from '../constants';

// Helper for LocalStorage
const getStorage = <T>(key: string, initial: T): T => {
  try {
    const saved = localStorage.getItem(`pravah_${key}`);
    return saved ? JSON.parse(saved) : (Array.isArray(initial) ? [...initial] as unknown as T : initial);
  } catch (e) {
    console.error('Storage access error', e);
    return initial;
  }
};

const setStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(`pravah_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
};

// Default Mock Data
const DEFAULT_STUDENTS: Student[] = [];
const DEFAULT_USERS = [
    { volunteerId: '25MDA177', name: 'Demo Volunteer', password: 'password' }
];

// In-memory state
let students: Student[] = getStorage('students', DEFAULT_STUDENTS);
let diaries: DiaryEntry[] = getStorage('diaries', []);
let attendanceHistory: AttendanceRecord[] = getStorage('attendance', []);
let users: any[] = getStorage('users', DEFAULT_USERS);
let feedbacks: Feedback[] = getStorage('feedbacks', []);
let syllabusProgress: SyllabusProgress[] = getStorage('syllabus_progress', []);

export const DataService = {
  getStudents: () => [...students],
  
  // Updated addStudent to generate custom ID: 25 + City + ShortCode + Random
  addStudent: (student: Omit<Student, 'id' | 'centerId'>, user: User) => {
    const currentYear = new Date().getFullYear().toString().slice(-2); // "25"
    
    // Find Center ShortCode
    const center = CENTERS.find(c => c.id === user.centerId);
    const cityCode = center?.cityCode || 'XX';
    const shortCode = center?.shortCode || 'XX';
    
    // Random 3 digit number
    const randomNum = Math.floor(100 + Math.random() * 900); // 100-999
    
    const newId = `${currentYear}${cityCode}${shortCode}${randomNum}`;

    const newStudent: Student = {
      ...student,
      id: newId,
      centerId: user.centerId
    };
    
    students.push(newStudent);
    setStorage('students', students);
    return newStudent;
  },

  saveDiary: (entry: DiaryEntry) => {
    diaries.push(entry);
    setStorage('diaries', diaries);
    return entry;
  },

  getDiaries: () => [...diaries],

  saveAttendance: (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
        ...record,
        id: `ATT-${Date.now()}`
    };
    attendanceHistory.push(newRecord);
    setStorage('attendance', attendanceHistory);
    return newRecord;
  },

  getAttendanceHistory: () => [...attendanceHistory],
  
  getAllHistory: () => {
    const admissionRecords = students.map(s => ({
        id: s.id,
        type: 'Admission',
        date: s.admissionDate,
        details: `Student: ${s.name}`,
        data: s
    }));

    const attRecords = attendanceHistory.map(a => ({
        id: a.id,
        type: 'Attendance',
        date: a.date.split('T')[0],
        details: `${a.totalStudents} Students Present (${a.mode})`,
        data: a
    }));

    const diaryRecords = diaries.map(d => ({
        id: d.id,
        type: 'Diary',
        date: d.date,
        details: `Subject: ${d.subjectTaught}`,
        data: d
    }));

    return [...admissionRecords, ...attRecords, ...diaryRecords].sort((a,b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  deleteHistoryItem: (id: string, type: string) => {
      if (type === 'Admission') {
          students = students.filter(s => s.id !== id);
          setStorage('students', students);
      } else if (type === 'Attendance') {
          attendanceHistory = attendanceHistory.filter(a => a.id !== id);
          setStorage('attendance', attendanceHistory);
      } else if (type === 'Diary') {
          diaries = diaries.filter(d => d.id !== id);
          setStorage('diaries', diaries);
      }
      return true;
  },

  // Syllabus Progress Methods
  saveSyllabusProgress: (progressList: SyllabusProgress[]) => {
      // Remove existing entries for the same center, week, class, and subject to update them
      const newProgressList = syllabusProgress.filter(existing => 
          !progressList.some(newItem => 
              newItem.centerId === existing.centerId &&
              newItem.week === existing.week &&
              newItem.className === existing.className &&
              newItem.subject === existing.subject
          )
      );
      
      // Add new/updated entries
      syllabusProgress = [...newProgressList, ...progressList];
      setStorage('syllabus_progress', syllabusProgress);
      return true;
  },

  getSyllabusProgress: (centerId: string, week: string) => {
      return syllabusProgress.filter(p => p.centerId === centerId && p.week === week);
  },

  // Simplified logic for dashboard stats - now pulling from real tracking if available, else mock
  getPerformanceStats: () => {
      // In a real app, this would aggregate `syllabusProgress`
      // For now, returning mock structure but could be enhanced
      return [
        { name: 'Week 1', completion: 80, attendance: 90 },
        { name: 'Week 2', completion: 65, attendance: 85 },
        { name: 'Week 3', completion: 75, attendance: 88 },
        { name: 'Week 4', completion: 90, attendance: 92 },
      ];
  },

  // Auth Methods
  registerUser: (volunteerId: string, name: string, password: string) => {
      const vId = volunteerId.toUpperCase().trim();
      
      if (users.find(u => u.volunteerId === vId)) {
          return { success: false, message: 'Volunteer ID already registered' };
      }
      
      const newUser = { volunteerId: vId, name, password };
      users.push(newUser);
      setStorage('users', users);
      return { success: true };
  },

  authenticate: (volunteerId: string, password: string) => {
      const vId = volunteerId.toUpperCase().trim();
      const user = users.find(u => u.volunteerId === vId && u.password === password);
      
      if (user) {
          return { success: true, user };
      }
      return { success: false, message: 'Invalid Volunteer ID or Password' };
  },

  updateUser: (volunteerId: string, updates: { name?: string, password?: string }) => {
     const vId = volunteerId.toUpperCase().trim();
     const userIndex = users.findIndex(u => u.volunteerId === vId);
     
     if (userIndex !== -1) {
         users[userIndex] = { ...users[userIndex], ...updates };
         setStorage('users', users);
         return { success: true, user: users[userIndex] };
     }
     return { success: false, message: 'User not found' };
  },

  saveFeedback: (feedback: Omit<Feedback, 'id' | 'date'>) => {
      const newFeedback: Feedback = {
          ...feedback,
          id: Date.now().toString(),
          date: new Date().toISOString()
      };
      feedbacks.push(newFeedback);
      setStorage('feedbacks', feedbacks);
      return { success: true };
  }
};
