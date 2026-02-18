export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface TimeSlot {
  id: string;
  start: string; // "07:00"
  end: string;   // "08:00"
  label: string; // "07:00 - 08:00"
}

export interface Teacher {
  id: string;
  name: string;
  maxHours: number; // Changed from '15 | 21' to number to support custom hours
  email?: string;
  color: string; // Hex color for calendar visualization
  unavailableSlots: string[]; // Array of strings formatted as "Day-TimeSlotId" (e.g., "Lunes-slot-0") representing blocked times
}

export type ClassroomType = 'Aula' | 'Lab PC' | 'Lab Mac';

export interface Classroom {
  id: string;
  name: string; // e.g., "-510"
  maxCapacity: number;
  recommendedCapacity: number;
  type: ClassroomType;
}

export type SubjectArea = 'Audiovisual' | 'Animación' | 'Interactividad';

export interface Subject {
  id: string;
  name: string;
  credits: number; // Hours per week implies blocks
  projectedStudents: number;
  area: SubjectArea; // New field for the degree axis
}

// Represents a concrete instance of a Subject (A "Parallel" or "Group")
// Created BEFORE scheduling
export interface CourseGroup {
  id: string;
  subjectId: string;
  name: string; // "Grupo A", "Grupo 1", etc.
  teacherId?: string; // Assigned teacher
  studentCount: number; // Number of students in this specific group
  totalHours: number; // Derived from Subject.credits
  
  // The preferred or planned room. 
  // IMPORTANT: The schedule can override this, but this is used for planning capacity.
  plannedClassroomId?: string; 
}

// The actual event on the calendar
export interface ScheduleAssignment {
  id: string;
  subjectId: string; // Kept for easier querying, but logically linked to CourseGroup
  courseGroupId?: string; // Link to the specific group being scheduled
  teacherId: string;
  classroomId: string;
  day: DayOfWeek;
  timeSlotId: string;
}

export interface AppState {
  teachers: Teacher[];
  classrooms: Classroom[];
  subjects: Subject[];
  courseGroups: CourseGroup[]; // The "Bucket" of classes to schedule
  assignments: ScheduleAssignment[];
}