import { TimeSlot, SubjectArea, ClassroomType, DayOfWeek } from "./types";

/**
 * Genera los bloques de tiempo basados en la regla de negocio:
 * Inicio: 07:00
 * Duración: 60 min
 * Break: 5 min
 * Fin Límite: 17:45
 */
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let index = 0;

  // Diurno: 7:00 a 17:45 (bloques de 60m + 5m break)
  let currentTime = 7 * 60; // 7:00 AM
  const diurnoLimit = 17 * 60 + 45; // 17:45

  while (currentTime + 60 <= diurnoLimit) {
    const startMinutes = currentTime;
    const endMinutes = currentTime + 60;

    slots.push({
      id: `slot-${index}`,
      start: formatMinutesToTime(startMinutes),
      end: formatMinutesToTime(endMinutes),
      label: `${formatMinutesToTime(startMinutes)} - ${formatMinutesToTime(endMinutes)}`,
      code: index + 1
    });

    currentTime = endMinutes + 5; // 5 min break
    index++;
  }

  // Vespertino: 17:50 a 21:50 (bloques de 60m, sin break)
  currentTime = 17 * 60 + 50; // 17:50
  const vespertinoLimit = 21 * 60 + 50; // 21:50

  while (currentTime + 60 <= vespertinoLimit) {
    const startMinutes = currentTime;
    const endMinutes = currentTime + 60;

    slots.push({
      id: `slot-${index}`,
      start: formatMinutesToTime(startMinutes),
      end: formatMinutesToTime(endMinutes),
      label: `${formatMinutesToTime(startMinutes)} - ${formatMinutesToTime(endMinutes)}`,
      code: index + 1
    });

    currentTime = endMinutes; // No break
    index++;
  }

  return slots;
};

export const DAY_NUMBER_MAP: Record<DayOfWeek, number> = {
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6
};

export const getBlockCode = (day: DayOfWeek, slotIndex: number) => {
  return DAY_NUMBER_MAP[day] * 100 + slotIndex + 1;
};

const formatMinutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Configuration for Subject Areas (Colors and Labels)
export const AREA_CONFIG: Record<SubjectArea, { label: string; color: string; bg: string; border: string; iconColor: string }> = {
  'Audiovisual': {
    label: 'Producción Audiovisual',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-500'
  },
  'Animación': {
    label: 'Animación',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconColor: 'text-purple-500'
  },
  'Interactividad': {
    label: 'Interactividad',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    iconColor: 'text-cyan-500'
  }
};

// Configuration for Classroom Types
export const CLASSROOM_CONFIG: Record<ClassroomType, { label: string; color: string; bg: string; border: string; iconColor: string }> = {
  'AULA': {
    label: 'Aula',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600'
  },
  'PC': {
    label: 'Lab PC',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  'MAC': {
    label: 'Lab Mac',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconColor: 'text-rose-600'
  }
};

export const MOCK_INITIAL_DATA = {
  teachers: [
    { id: 't1', name: 'Ana García', maxHours: 21, color: '#3B82F6', unavailableSlots: [], allowedSubjectIds: ['s1', 's4', 's9'] },
    { id: 't2', name: 'Carlos López', maxHours: 15, color: '#10B981', unavailableSlots: [], allowedSubjectIds: ['s3', 's5'] },
    { id: 't3', name: 'María Rodríguez', maxHours: 21, color: '#F59E0B', unavailableSlots: [], allowedSubjectIds: ['s1', 's8'] },
    { id: 't4', name: 'Diego Torres', maxHours: 15, color: '#8B5CF6', unavailableSlots: [], allowedSubjectIds: ['s2', 's7'] },
    { id: 't5', name: 'Lucía Méndez', maxHours: 21, color: '#EC4899', unavailableSlots: [], allowedSubjectIds: ['s10', 's2'] },
    { id: 't6', name: 'Jorge Suarez', maxHours: 21, color: '#06B6D4', unavailableSlots: [], allowedSubjectIds: ['s6', 's5'] },
    { id: 't7', name: 'Elena Ruiz', maxHours: 15, color: '#F43F5E', unavailableSlots: [], allowedSubjectIds: ['s4', 's8'] },
    { id: 't8', name: 'Pablo Costa', maxHours: 21, color: '#6366F1', unavailableSlots: [], allowedSubjectIds: ['s7', 's10'] },
    { id: 't9', name: 'Marta Silva', maxHours: 15, color: '#14B8A6', unavailableSlots: [], allowedSubjectIds: ['s3', 's6'] },
    { id: 't10', name: 'Roberto Vera', maxHours: 21, color: '#D946EF', unavailableSlots: [], allowedSubjectIds: ['s9', 's1'] },
  ],
  classrooms: [
    { id: 'c1', name: 'Aula 101', maxCapacity: 30, recommendedCapacity: 25, type: 'AULA' },
    { id: 'c2', name: 'Aula 102', maxCapacity: 30, recommendedCapacity: 25, type: 'AULA' },
    { id: 'c3', name: 'Aula 103', maxCapacity: 25, recommendedCapacity: 20, type: 'AULA' },
    { id: 'c4', name: 'Lab PC 1', maxCapacity: 25, recommendedCapacity: 25, type: 'PC' },
    { id: 'c5', name: 'Lab PC 2', maxCapacity: 20, recommendedCapacity: 20, type: 'PC' },
    { id: 'c6', name: 'Lab PC 3', maxCapacity: 15, recommendedCapacity: 15, type: 'PC' },
    { id: 'c7', name: 'Mac Lab 1', maxCapacity: 25, recommendedCapacity: 25, type: 'MAC' },
    { id: 'c8', name: 'Mac Lab 2', maxCapacity: 20, recommendedCapacity: 20, type: 'MAC' },
    { id: 'c9', name: 'Mac Lab 3', maxCapacity: 10, recommendedCapacity: 10, type: 'MAC' },
    { id: 'c10', name: 'Estudio AV', maxCapacity: 15, recommendedCapacity: 12, type: 'AULA' },
  ],
  subjects: [
    { id: 's1', name: 'Edición de Video', semester: 3, credits: 3, projectedStudents: 57, area: 'Audiovisual', preferredDays: ['Lunes', 'Miércoles', 'Viernes'] },
    { id: 's2', name: 'Programación I', semester: 1, credits: 4, projectedStudents: 40, area: 'Interactividad' },
    { id: 's3', name: 'Diseño Gráfico I', semester: 1, credits: 2, projectedStudents: 25, area: 'Animación' },
    { id: 's4', name: 'Guionismo', semester: 3, credits: 3, projectedStudents: 30, area: 'Audiovisual' },
    { id: 's5', name: 'Animación 2D', semester: 4, credits: 3, projectedStudents: 20, area: 'Animación' },
    { id: 's6', name: 'Modelado 3D', semester: 5, credits: 4, projectedStudents: 15, area: 'Animación' },
    { id: 's7', name: 'Motores de Videojuegos', semester: 6, credits: 4, projectedStudents: 22, area: 'Interactividad' },
    { id: 's8', name: 'Iluminación', semester: 4, credits: 2, projectedStudents: 18, area: 'Audiovisual' },
    { id: 's9', name: 'Post-producción', semester: 6, credits: 3, projectedStudents: 25, area: 'Audiovisual' },
    { id: 's10', name: 'UX/UI Design', semester: 5, credits: 2, projectedStudents: 35, area: 'Interactividad' },
  ],
  assignments: []
};