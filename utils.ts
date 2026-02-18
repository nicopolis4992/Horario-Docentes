import { TimeSlot, SubjectArea, ClassroomType } from "./types";

/**
 * Genera los bloques de tiempo basados en la regla de negocio:
 * Inicio: 07:00
 * Duración: 60 min
 * Break: 5 min
 * Fin Límite: 17:45
 */
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let currentTime = 7 * 60; // 7:00 AM in minutes
  const endTimeLimit = 17 * 60 + 45; // 17:45 in minutes
  const blockDuration = 60;
  const breakDuration = 5;

  let index = 0;

  while (currentTime + blockDuration <= endTimeLimit) {
    const startMinutes = currentTime;
    const endMinutes = currentTime + blockDuration;

    slots.push({
      id: `slot-${index}`,
      start: formatMinutesToTime(startMinutes),
      end: formatMinutesToTime(endMinutes),
      label: `${formatMinutesToTime(startMinutes)} - ${formatMinutesToTime(endMinutes)}`
    });

    // Advance time + break
    currentTime = endMinutes + breakDuration;
    index++;
  }

  return slots;
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
  'Aula': { 
    label: 'Aula', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600'
  },
  'Lab PC': { 
    label: 'Lab PC', 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  'Lab Mac': { 
    label: 'Lab Mac', 
    color: 'text-rose-700', 
    bg: 'bg-rose-50', 
    border: 'border-rose-200', 
    iconColor: 'text-rose-600'
  }
};

export const MOCK_INITIAL_DATA = {
  teachers: [
    { id: 't1', name: 'Ana García', maxHours: 21, color: '#3B82F6', unavailableSlots: [] },
    { id: 't2', name: 'Carlos López', maxHours: 15, color: '#10B981', unavailableSlots: [] },
    { id: 't3', name: 'María Rodríguez', maxHours: 21, color: '#F59E0B', unavailableSlots: [] },
  ],
  classrooms: [
    { id: 'c1', name: '-510', maxCapacity: 30, recommendedCapacity: 20, type: 'Aula' },
    { id: 'c2', name: '-509', maxCapacity: 25, recommendedCapacity: 15, type: 'Aula' },
    { id: 'c3', name: 'Lab 1', maxCapacity: 20, recommendedCapacity: 20, type: 'Lab PC' },
    { id: 'c4', name: 'Mac Lab A', maxCapacity: 15, recommendedCapacity: 15, type: 'Lab Mac' },
  ],
  subjects: [
    { id: 's1', name: 'Edición de Video', credits: 3, projectedStudents: 57, area: 'Audiovisual' },
    { id: 's2', name: 'Introducción a la Programación', credits: 4, projectedStudents: 40, area: 'Interactividad' },
    { id: 's3', name: 'Diseño Gráfico I', credits: 2, projectedStudents: 25, area: 'Animación' },
  ],
  assignments: []
};