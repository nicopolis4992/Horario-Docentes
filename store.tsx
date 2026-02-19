import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState, Teacher, Classroom, Subject, ScheduleAssignment, CourseGroup } from './types';
import { MOCK_INITIAL_DATA } from './utils';

// Actions
type Action =
  // Teachers
  | { type: 'ADD_TEACHER'; payload: Teacher }
  | { type: 'UPDATE_TEACHER'; payload: Teacher }
  | { type: 'DELETE_TEACHER'; payload: string } // id
  // Classrooms
  | { type: 'ADD_CLASSROOM'; payload: Classroom }
  | { type: 'UPDATE_CLASSROOM'; payload: Classroom }
  | { type: 'DELETE_CLASSROOM'; payload: string } // id
  // Subjects
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string } // id
  // Course Groups (Offering)
  | { type: 'ADD_COURSE_GROUP'; payload: CourseGroup }
  | { type: 'UPDATE_COURSE_GROUP'; payload: CourseGroup }
  | { type: 'DELETE_COURSE_GROUP'; payload: string } // id
  | { type: 'BULK_ADD_COURSE_GROUPS'; payload: CourseGroup[] } // Helper for the wizard
  // Assignments
  | { type: 'ADD_ASSIGNMENT'; payload: ScheduleAssignment }
  | { type: 'UPDATE_ASSIGNMENT'; payload: ScheduleAssignment }
  | { type: 'DELETE_ASSIGNMENT'; payload: string } // id
  // System
  | { type: 'RESET_DATA' };

// Initial State
const initialState: AppState = {
  teachers: [],
  classrooms: [],
  subjects: [],
  courseGroups: [],
  assignments: []
};

// Reducer
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    // --- Teachers ---
    case 'ADD_TEACHER':
      return { ...state, teachers: [...state.teachers, action.payload] };
    case 'UPDATE_TEACHER':
      return {
        ...state,
        teachers: state.teachers.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TEACHER':
      return {
        ...state,
        teachers: state.teachers.filter((t) => t.id !== action.payload),
        assignments: state.assignments.filter(a => a.teacherId !== action.payload)
      };

    // --- Classrooms ---
    case 'ADD_CLASSROOM':
      return { ...state, classrooms: [...state.classrooms, action.payload] };
    case 'UPDATE_CLASSROOM':
      return {
        ...state,
        classrooms: state.classrooms.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CLASSROOM':
      return {
        ...state,
        classrooms: state.classrooms.filter((c) => c.id !== action.payload),
        assignments: state.assignments.filter(a => a.classroomId !== action.payload)
      };

    // --- Subjects ---
    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] };
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.payload),
        courseGroups: state.courseGroups.filter((g) => g.subjectId !== action.payload),
        assignments: state.assignments.filter(a => a.subjectId !== action.payload)
      };

    // --- Course Groups ---
    case 'ADD_COURSE_GROUP':
      return { ...state, courseGroups: [...state.courseGroups, action.payload] };
    case 'UPDATE_COURSE_GROUP':
      return {
        ...state,
        courseGroups: state.courseGroups.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'DELETE_COURSE_GROUP':
      return {
        ...state,
        // 1. Remove the group itself
        courseGroups: state.courseGroups.filter((g) => g.id !== action.payload),
        // 2. Cascading delete: Remove assignments linked to this group
        assignments: state.assignments.filter((a) => a.courseGroupId !== action.payload)
      };
    case 'BULK_ADD_COURSE_GROUPS':
      return { ...state, courseGroups: [...state.courseGroups, ...action.payload] };


    // --- Assignments ---
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, action.payload] };
    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'DELETE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.filter((a) => a.id !== action.payload),
      };

    // --- System ---
    case 'RESET_DATA':
      return {
        ...MOCK_INITIAL_DATA,
        courseGroups: [] // Mock data doesn't currently have groups, initialize empty
      } as AppState;

    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or fallback to MOCK data for the MVP feel
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    const localData = localStorage.getItem('scheduler_app_v1');
    if (localData) {
      const parsed = JSON.parse(localData);
      // Migration: Ensure courseGroups exists if loading old data
      if (!parsed.courseGroups) parsed.courseGroups = [];
      return parsed;
    }
    return { ...MOCK_INITIAL_DATA, courseGroups: [] };
  });

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('scheduler_app_v1', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppStore = () => useContext(AppContext);