
export type CityCode = 'MDA' | 'NGP';

export interface Center {
  id: string;
  name: string;
  cityCode: CityCode;
  shortCode: string; // Added for ID generation
}

export interface User {
  volunteerId: string;
  name: string;
  centerId: string;
  centerName: string;
}

export interface Student {
  id: string; // Generated ID
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  age: number;
  classLevel: string;
  schoolName: string;
  parentName: string;
  parentOccupation: string;
  aadhaar: string;
  contact: string;
  registrationNumber: string;
  admissionDate: string;
  centerId: string; // Track which center admitted them
}

export interface AttendanceRecord {
  id: string;
  date: string;
  presentStudentIds: string[];
  mode: 'QR' | 'MANUAL';
  totalStudents: number;
}

export interface DiaryVolunteerEntry {
  name: string;
  inTime: string;
  outTime: string;
  status: 'Present' | 'Absent';
  classHandled: string;
  subject: string;
  topic: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  studentCount: number;
  inTime: string;
  outTime: string;
  thought: string;
  subjectTaught: string;
  topicTaught: string;
  volunteers: DiaryVolunteerEntry[];
}

export interface SyllabusTopic {
  subject: string;
  topics: string[];
}

export interface ClassSyllabus {
  className: string;
  subjects: SyllabusTopic[];
}

export interface SyllabusProgress {
  id: string;
  centerId: string;
  week: string;
  className: string;
  subject: string;
  percentage: number;
  lastUpdated: string;
}

export interface Feedback {
  id: string;
  volunteerId: string;
  volunteerName: string;
  centerId: string;
  subject: string;
  message: string;
  date: string;
}

export type ViewState = 
  | 'LOGIN' 
  | 'REGISTER'
  | 'CENTER_SELECT' 
  | 'DASHBOARD' 
  | 'ADMISSION' 
  | 'GENERATE_QR'
  | 'QR_SCAN' 
  | 'MANUAL_ATTENDANCE' 
  | 'DIARY' 
  | 'SYLLABUS' 
  | 'PERFORMANCE' 
  | 'HISTORY'
  | 'SETTINGS';
