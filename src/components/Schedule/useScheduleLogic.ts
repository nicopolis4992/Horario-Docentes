import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../store';
import { toast } from 'react-hot-toast';
import {
    DayOfWeek,
    TimeSlot,
    ScheduleAssignment,
    ClassroomType
} from '../../../types';
import { generateTimeSlots } from '../../../utils';
import { DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

export interface PendingSession {
    id: string;
    groupId: string;
    subjectId: string;
    groupName: string;
    hours: number;
    sessionIndex: number;
}

export const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const WEEKDAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const useScheduleLogic = () => {
    const { state, dispatch } = useAppStore();
    const timeSlots = generateTimeSlots();

    // View Mode: 'teachers' or 'classrooms'
    const [viewMode, setViewMode] = useState<'teacher' | 'classroom'>('teacher');

    // Schedule Filters
    const [weekMode, setWeekMode] = useState<'workweek' | 'fullweek'>('workweek');
    const [scheduleFilter, setScheduleFilter] = useState<'all' | 'diurno' | 'vespertino'>('all');

    const visibleDays = useMemo(() => {
        return weekMode === 'fullweek' ? DAYS : WEEKDAYS;
    }, [weekMode]);

    const visibleTimeSlots = useMemo(() => {
        if (scheduleFilter === 'all') return timeSlots;
        if (scheduleFilter === 'diurno') {
            return timeSlots.filter(s => s.start < '17:50');
        }
        if (scheduleFilter === 'vespertino') {
            return timeSlots.filter(s => s.start >= '17:50');
        }
        return timeSlots;
    }, [timeSlots, scheduleFilter]);

    // Selection State
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

    // Modal State
    const [selectedCell, setSelectedCell] = useState<{ day: DayOfWeek; slot: TimeSlot } | null>(null);

    // Modal Form State
    const [assignMode, setAssignMode] = useState<'group' | 'manual'>('group');
    const [selectedGroupId, setSelectedGroupId] = useState('');

    const [formSubjectId, setFormSubjectId] = useState('');
    const [formTeacherId, setFormTeacherId] = useState('');
    const [formClassroomId, setFormClassroomId] = useState('');
    const [editingAssignmentIds, setEditingAssignmentIds] = useState<string[] | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);

    // Toggle for showing ALL pending sessions in Aulas mode
    const [showAllPending, setShowAllPending] = useState(false);

    // Sidebar visibility
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // --- Pending Sessions (ALL, unfiltered) ---
    const allPendingSessions = useMemo(() => {
        const sessions: PendingSession[] = [];

        state.courseGroups.forEach(group => {
            const pattern = group.sessionPattern || [group.totalHours];
            const groupAssignments = state.assignments.filter(a => a.courseGroupId === group.id);

            let assignedRemaining = groupAssignments.length;

            pattern.forEach((hours, idx) => {
                if (assignedRemaining >= hours) {
                    assignedRemaining -= hours;
                } else if (assignedRemaining > 0) {
                    const remainingInSession = hours - assignedRemaining;
                    sessions.push({
                        id: `${group.id}-s${idx}`,
                        groupId: group.id,
                        subjectId: group.subjectId,
                        groupName: group.name,
                        hours: remainingInSession,
                        sessionIndex: idx
                    });
                    assignedRemaining = 0;
                } else {
                    sessions.push({
                        id: `${group.id}-s${idx}`,
                        groupId: group.id,
                        subjectId: group.subjectId,
                        groupName: group.name,
                        hours: hours,
                        sessionIndex: idx
                    });
                }
            });
        });

        return sessions;
    }, [state.courseGroups, state.assignments]);

    // --- Pending Sessions (Filtered by context) ---
    const pendingSessions = useMemo(() => {
        let filtered = allPendingSessions;

        if (showAllPending) {
            // Si el toggle "Ver Todos" está activo, devolvemos todo sin importar el recurso seleccionado
            return filtered;
        }

        if (viewMode === 'teacher' && selectedTeacherId) {
            filtered = filtered.filter(s => {
                const group = state.courseGroups.find(g => g.id === s.groupId);
                return group?.teacherId === selectedTeacherId;
            });
        } else if (viewMode === 'classroom' && selectedClassroomId) {
            filtered = filtered.filter(s => {
                const group = state.courseGroups.find(g => g.id === s.groupId);
                return group?.plannedClassroomId === selectedClassroomId;
            });
        } else {
            filtered = [];
        }

        return filtered;
    }, [allPendingSessions, state.courseGroups, viewMode, selectedTeacherId, selectedClassroomId, showAllPending]);

    const activeSession = useMemo(() =>
        pendingSessions.find(s => s.id === activeId) || allPendingSessions.find(s => s.id === activeId),
        [pendingSessions, allPendingSessions, activeId]);

    const activeAssignment = useMemo(() =>
        activeId ? state.assignments.find(a => a.id === activeId) : null,
        [state.assignments, activeId]);

    // Handle Tab Change
    const handleTabChange = (mode: 'teacher' | 'classroom') => {
        setViewMode(mode);
    };

    // Helper to open modal based on current context
    const openAssignmentModal = (day: DayOfWeek, slot: TimeSlot, existingAssignmentIds?: string[]) => {
        setSelectedCell({ day, slot });
        setEditingAssignmentIds(existingAssignmentIds || null);

        const assignment = existingAssignmentIds && existingAssignmentIds.length > 0
            ? state.assignments.find(a => a.id === existingAssignmentIds[0])
            : null;

        if (assignment) {
            setAssignMode('group');
            setSelectedGroupId(assignment.courseGroupId);
            setFormSubjectId(assignment.subjectId);
            setFormTeacherId(assignment.teacherId);
            setFormClassroomId(assignment.classroomId);
        } else {
            // Auto-fill context for NEW assignment
            if (viewMode === 'teacher' && selectedTeacherId) {
                setFormTeacherId(selectedTeacherId);
                setFormClassroomId('');
            } else if (viewMode === 'classroom' && selectedClassroomId) {
                setFormClassroomId(selectedClassroomId);
                setFormTeacherId('');
            } else {
                setFormTeacherId('');
                setFormClassroomId('');
            }
            setFormSubjectId('');
            setSelectedGroupId('');
            setAssignMode('group');
        }
    };

    const closeModal = () => {
        setSelectedCell(null);
        setFormSubjectId('');
        setFormTeacherId('');
        setFormClassroomId('');
        setSelectedGroupId('');
        setEditingAssignmentIds(null);
    };

    // Handle Group Selection change
    const handleGroupSelect = (sessionId: string) => {
        setSelectedGroupId(sessionId);
        if (!sessionId) return;

        // Search in both filtered and all sessions for the toggle case
        const session = pendingSessions.find(s => s.id === sessionId) || allPendingSessions.find(s => s.id === sessionId);
        if (session) {
            const group = state.courseGroups.find(g => g.id === session.groupId);
            if (group) {
                setFormSubjectId(group.subjectId);
                if (group.teacherId) setFormTeacherId(group.teacherId);
                if (group.plannedClassroomId) setFormClassroomId(group.plannedClassroomId);
            }
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCell || !formSubjectId || !formTeacherId || !formClassroomId) return;

        if (editingAssignmentIds && editingAssignmentIds.length > 0) {
            // UPDATE MODE: Update teacher/classroom for existing slot(s)

            const firstId = editingAssignmentIds[0];
            const original = state.assignments.find(a => a.id === firstId);

            if (original && original.courseGroupId && original.teacherId !== formTeacherId) {
                // If teacher changed, update the ENTIRE group
                handleReassignTeacher(original.courseGroupId, formTeacherId);
            }

            // Validate the FULL block span (not just the first hour) excluding the assignments being edited
            const validation = original
                ? validateMove(
                    original.day,
                    original.timeSlotId,
                    editingAssignmentIds.length,
                    formTeacherId,
                    formClassroomId,
                    formSubjectId,
                    editingAssignmentIds
                )
                : { valid: true, error: undefined };

            editingAssignmentIds.forEach(id => {
                const current = state.assignments.find(a => a.id === id);
                if (current) {
                    dispatch({
                        type: 'UPDATE_ASSIGNMENT',
                        payload: {
                            ...current,
                            teacherId: formTeacherId,
                            classroomId: formClassroomId,
                            isIncomplete: !formTeacherId || !formClassroomId || !validation.valid
                        }
                    });
                }
            });

            if (!validation.valid) {
                toast(`⚠️ Actualizado con conflicto: ${validation.error}`, { icon: '⚠️' });
            } else {
                toast.success('Horario actualizado');
            }
        } else if (assignMode === 'group' && selectedGroupId) {
            const session = pendingSessions.find(s => s.id === selectedGroupId) || allPendingSessions.find(s => s.id === selectedGroupId);
            if (session) {
                assignSessionToCell(session, selectedCell.day, selectedCell.slot.id, formTeacherId, formClassroomId);
                toast.success('Sesión asignada correctamente');
            }
        } else {
            // Manual single slot
            dispatch({
                type: 'ADD_ASSIGNMENT',
                payload: {
                    id: crypto.randomUUID(),
                    day: selectedCell.day,
                    timeSlotId: selectedCell.slot.id,
                    subjectId: formSubjectId,
                    teacherId: formTeacherId,
                    classroomId: formClassroomId,
                    courseGroupId: undefined
                }
            });
            toast.success('Clase manual asignada');
        }
        closeModal();
    };

    const assignSessionToCell = (session: PendingSession, day: DayOfWeek, slotId: string, teacherId: string, classroomId: string, isIncomplete: boolean = false) => {
        const hoursToAssign = session.hours;
        const currentSlotIndex = timeSlots.findIndex(s => s.id === slotId);

        const newAssignments: ScheduleAssignment[] = [];

        for (let i = 0; i < hoursToAssign; i++) {
            const slot = timeSlots[currentSlotIndex + i];
            if (!slot) break;

            newAssignments.push({
                id: crypto.randomUUID(),
                day: day,
                timeSlotId: slot.id,
                subjectId: session.subjectId,
                teacherId: teacherId,
                classroomId: classroomId,
                courseGroupId: session.groupId,
                isIncomplete: isIncomplete
            });
        }

        newAssignments.forEach(a => dispatch({ type: 'ADD_ASSIGNMENT', payload: a }));
    };

    const validateMove = (
        day: DayOfWeek,
        slotId: string,
        span: number,
        teacherId: string,
        classroomId: string,
        subjectId: string,
        excludeAssignmentIds?: string[]
    ) => {
        const currentSlotIndex = timeSlots.findIndex(s => s.id === slotId);
        const subject = state.subjects.find(s => s.id === subjectId);

        for (let i = 0; i < span; i++) {
            const slot = timeSlots[currentSlotIndex + i];
            if (!slot) return { valid: false, error: 'La sesión no cabe al final del día.' };

            const slotKey = `${day}-${slot.id}`;

            // 1. Teacher Overlap
            const teacherBusy = state.assignments.some(a =>
                a.day === day &&
                a.timeSlotId === slot.id &&
                a.teacherId === teacherId &&
                !excludeAssignmentIds?.includes(a.id)
            );
            if (teacherBusy) return { valid: false, error: `El docente ya tiene una clase de "${state.subjects.find(s => s.id === state.assignments.find(x => x.day === day && x.timeSlotId === slot.id && x.teacherId === teacherId)?.subjectId)?.name}" el ${day} a las ${slot.start}.` };

            // 2. Classroom Overlap
            const roomBusy = state.assignments.some(a =>
                a.day === day &&
                a.timeSlotId === slot.id &&
                a.classroomId === classroomId &&
                !excludeAssignmentIds?.includes(a.id)
            );
            if (roomBusy) return { valid: false, error: `El aula ya está ocupada el ${day} a las ${slot.start}.` };

            // 3. Teacher Restrictions
            const teacher = state.teachers.find(t => t.id === teacherId);
            if (teacher?.unavailableSlots?.includes(slotKey)) {
                return { valid: false, error: `El docente tiene bloqueado el horario ${day} ${slot.start}.` };
            }

            // 4. Subject Restrictions (Preferred Days)
            if (subject?.preferredDays && subject.preferredDays.length > 0 && !subject.preferredDays.includes(day)) {
                return { valid: false, error: `El día ${day} no está entre los días preferidos para esta materia.` };
            }

            // 5. Jornada Restriction (Diurna/Vespertina)
            if (subject?.jornada === 'vespertina' && slot.start < '17:50') {
                return { valid: false, error: 'Esta materia es vespertina y solo puede asignarse a partir de las 17:50.' };
            }
            if (subject?.jornada === 'diurna' && slot.start >= '17:50') {
                return { valid: false, error: 'Esta materia es diurna y solo puede asignarse antes de las 17:50.' };
            }

            // 6. Preferred Time Range
            if (subject?.preferredTimeRange) {
                if (slot.start < subject.preferredTimeRange.start || slot.end > subject.preferredTimeRange.end) {
                    return { valid: false, error: `Esta materia solo puede dictarse entre ${subject.preferredTimeRange.start} y ${subject.preferredTimeRange.end}.` };
                }
            }
        }

        return { valid: true };
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        if (over.data.current?.type === 'pending-zone') {
            // Dropping an existing assignment block onto the pending sidebar returns it to "pendientes"
            if (active.data.current?.type === 'assignment') {
                const { assignmentIds } = active.data.current;
                dispatch({ type: 'DELETE_MULTIPLE_ASSIGNMENTS', payload: assignmentIds });
                toast.success('Clase devuelta a pendientes');
            }
            return;
        }

        if (over.data.current?.type !== 'cell') return;

        const dropDay = over.data.current.day as DayOfWeek;
        const dropSlotId = over.data.current.slotId;

        if (active.data.current?.type === 'session') {
            const session = active.data.current.session;
            const group = state.courseGroups.find(g => g.id === session.groupId);

            // In teacher mode, ALWAYS use the selected teacher (the one being viewed)
            // This enables cross-teacher reassignment via drag & drop
            let teacherId = viewMode === 'teacher' && selectedTeacherId
                ? selectedTeacherId
                : (group?.teacherId || '');
            // In classrooms mode, ALWAYS use the selected classroom (the one being viewed)
            // This enables cross-classroom reassignment via drag & drop
            let classroomId = viewMode === 'classroom' && selectedClassroomId
                ? selectedClassroomId
                : (group?.plannedClassroomId || '');

            const validation = validateMove(dropDay, dropSlotId, session.hours, teacherId, classroomId, session.subjectId);
            const isIncomplete = !teacherId || !classroomId || !validation.valid;

            assignSessionToCell(session, dropDay, dropSlotId, teacherId, classroomId, isIncomplete);

            // If teacher changed (cross-teacher drag), update the course group
            if (group && teacherId && group.teacherId !== teacherId) {
                handleReassignTeacher(group.id, teacherId);
            }

            if (!validation.valid) {
                toast(`⚠️ Asignada con conflicto: ${validation.error}`, { icon: '⚠️' });
            } else if (!teacherId || !classroomId) {
                toast(`Sesión asignada (incompleta — falta ${!teacherId ? 'docente' : 'aula'})`, { icon: '⚠️' });
            } else {
                toast.success(`Sesión de ${session.hours}h asignada correctamente`);
            }
        } else if (active.data.current?.type === 'assignment') {
            const { span, assignmentIds } = active.data.current;
            const firstId = assignmentIds[0];
            const assignment = state.assignments.find(a => a.id === firstId);

            if (!assignment) return;

            // In classrooms mode, use the currently selected classroom as target
            const targetClassroomId = viewMode === 'classroom' && selectedClassroomId
                ? selectedClassroomId
                : assignment.classroomId;

            const validation = validateMove(
                dropDay,
                dropSlotId,
                span,
                assignment.teacherId,
                targetClassroomId,
                assignment.subjectId,
                assignmentIds
            );

            const isIncomplete = !validation.valid || !assignment.teacherId || !targetClassroomId;

            // Perform Move
            const currentSlotIndex = timeSlots.findIndex(s => s.id === dropSlotId);

            // Delete old assignments
            assignmentIds.forEach((id: string) => dispatch({ type: 'DELETE_ASSIGNMENT', payload: id }));

            // Add new ones
            for (let i = 0; i < span; i++) {
                const slot = timeSlots[currentSlotIndex + i];
                dispatch({
                    type: 'ADD_ASSIGNMENT',
                    payload: {
                        ...assignment,
                        id: crypto.randomUUID(),
                        day: dropDay,
                        timeSlotId: slot.id,
                        classroomId: targetClassroomId,
                        isSplit: undefined,
                        isIncomplete
                    }
                });
            }
            if (!validation.valid) {
                toast(`⚠️ Reubicada con conflicto: ${validation.error}`, { icon: '⚠️' });
            } else {
                toast.success('Clase reubicada exitosamente');
            }
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDeleteAssignment = (assignmentId: string, multipleIds?: string[]) => {
        toast((t) => React.createElement('div', { className: 'flex flex-col gap-3' },
            React.createElement('span', { className: 'font-bold text-slate-800' }, '¿Eliminar esta hora de clase?'),
            React.createElement('div', { className: 'flex gap-2 justify-end mt-2' },
                React.createElement('button', {
                    onClick: () => toast.dismiss(t.id),
                    className: 'px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-sm font-medium'
                }, 'Cancelar'),
                React.createElement('button', {
                    onClick: () => {
                        if (multipleIds && multipleIds.length > 0) {
                            dispatch({ type: 'DELETE_MULTIPLE_ASSIGNMENTS', payload: multipleIds });
                        } else {
                            dispatch({ type: 'DELETE_ASSIGNMENT', payload: assignmentId });
                        }
                        toast.dismiss(t.id);
                        toast.success('Clase eliminada');
                    },
                    className: 'px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium'
                }, 'Sí, eliminar')
            )
        ), { duration: 5000 });
    };

    const handleSplitAssignment = (assignmentId: string) => {
        const assignment = state.assignments.find(a => a.id === assignmentId);
        if (assignment) {
            dispatch({
                type: 'UPDATE_ASSIGNMENT',
                payload: { ...assignment, isSplit: true }
            });
            toast.success('Hora separada del bloque');
        }
    };

    const handleAutoAssignAll = () => {
        const newAssignments: ScheduleAssignment[] = [];

        // Build all pending groups
        const allPendingGroups = state.courseGroups.map(group => {
            const assignedCount = state.assignments.filter(a => a.courseGroupId === group.id).length;
            return { ...group, remaining: group.totalHours - assignedCount };
        }).filter(g => g.remaining > 0);

        // Shared tracking sets (mutated across all passes)
        const occupiedSlots = new Set<string>(state.assignments.map(a => `${a.day}-${a.timeSlotId}-${a.teacherId}`));
        const occupiedRooms = new Set<string>(state.assignments.map(a => `${a.day}-${a.timeSlotId}-${a.classroomId}`));

        // ── findBestClassroom: picks the best available room for a subject+slot ──
        const findBestClassroom = (
            subject: { allowedClassroomIds?: string[]; allowedClassroomTypes?: ClassroomType[] },
            slotId: string,
            day: DayOfWeek,
            preferredRoomId?: string
        ): string | null => {
            // Priority 1: specific allowed classrooms (from Materias config)
            if (subject.allowedClassroomIds && subject.allowedClassroomIds.length > 0) {
                for (const cId of subject.allowedClassroomIds) {
                    if (!occupiedRooms.has(`${day}-${slotId}-${cId}`)) return cId;
                }
            }
            // Priority 2: try the planned/preferred room if given
            if (preferredRoomId && !occupiedRooms.has(`${day}-${slotId}-${preferredRoomId}`)) {
                return preferredRoomId;
            }
            // Priority 3: any room matching allowed types
            if (subject.allowedClassroomTypes && subject.allowedClassroomTypes.length > 0) {
                for (const c of state.classrooms) {
                    if (subject.allowedClassroomTypes.includes(c.type)) {
                        if (!occupiedRooms.has(`${day}-${slotId}-${c.id}`)) return c.id;
                    }
                }
            }
            return null;
        };

        // ── tryAssignGroup: attempts to place a group on the schedule ──
        // mode: 'mandatory' = MUST use allowedClassroomIds (fail if none free)
        //        'flexible'  = try preferredRoom, then any compatible, skip if nothing
        const tryAssignGroup = (
            group: typeof allPendingGroups[0],
            mode: 'mandatory' | 'flexible'
        ) => {
            const subject = state.subjects.find(s => s.id === group.subjectId);
            if (!subject) return;

            const hoursToAssign = group.remaining;
            const teacherId = group.teacherId;
            if (!teacherId) return;

            const teacher = state.teachers.find(t => t.id === teacherId);
            const preferredDays = subject.preferredDays && subject.preferredDays.length > 0 ? subject.preferredDays : WEEKDAYS;
            let assigned = false;

            // Sort days by least-occupied first
            const sortedDays = [...preferredDays].sort((a, b) => {
                const arr = Array.from(occupiedSlots);
                return arr.filter(k => k.startsWith(`${a}-`)).length - arr.filter(k => k.startsWith(`${b}-`)).length;
            });

            for (const day of sortedDays) {
                if (assigned) break;

                for (let i = 0; i <= timeSlots.length - hoursToAssign; i++) {
                    if (assigned) break;

                    let canFit = true;
                    const potentialSlots: string[] = [];

                    for (let j = 0; j < hoursToAssign; j++) {
                        const slot = timeSlots[i + j];
                        const slotKey = `${day}-${slot.id}`;

                        // 1. Jornada
                        if (subject.jornada === 'vespertina' && slot.start < '17:50') { canFit = false; break; }
                        if (subject.jornada === 'diurna' && slot.start >= '17:50') { canFit = false; break; }

                        // 2. Time range
                        if (subject.preferredTimeRange) {
                            if (slot.start < subject.preferredTimeRange.start || slot.end > subject.preferredTimeRange.end) {
                                canFit = false; break;
                            }
                        }

                        // 3. Teacher availability
                        if (occupiedSlots.has(`${slotKey}-${teacherId}`) || teacher?.unavailableSlots?.includes(slotKey)) {
                            canFit = false; break;
                        }

                        potentialSlots.push(slot.id);
                    }

                    if (canFit && potentialSlots.length === hoursToAssign) {
                        // Find ONE classroom that is free for ALL slots in this block
                        let chosenRoom: string | null = null;

                        if (mode === 'mandatory' && subject.allowedClassroomIds) {
                            // Must use one of the specific allowed classrooms
                            for (const cId of subject.allowedClassroomIds) {
                                const allFree = potentialSlots.every(sId => !occupiedRooms.has(`${day}-${sId}-${cId}`));
                                if (allFree) { chosenRoom = cId; break; }
                            }
                        } else {
                            // Flexible: try planned room first, then any compatible
                            const preferredId = group.plannedClassroomId;
                            if (preferredId) {
                                const allFree = potentialSlots.every(sId => !occupiedRooms.has(`${day}-${sId}-${preferredId}`));
                                if (allFree) chosenRoom = preferredId;
                            }
                            // If planned room didn't work, try allowedClassroomIds
                            if (!chosenRoom && subject.allowedClassroomIds) {
                                for (const cId of subject.allowedClassroomIds) {
                                    const allFree = potentialSlots.every(sId => !occupiedRooms.has(`${day}-${sId}-${cId}`));
                                    if (allFree) { chosenRoom = cId; break; }
                                }
                            }
                            // If still nothing, try any room matching allowed types
                            if (!chosenRoom && subject.allowedClassroomTypes) {
                                for (const c of state.classrooms) {
                                    if (subject.allowedClassroomTypes.includes(c.type)) {
                                        const allFree = potentialSlots.every(sId => !occupiedRooms.has(`${day}-${sId}-${c.id}`));
                                        if (allFree) { chosenRoom = c.id; break; }
                                    }
                                }
                            }
                        }

                        if (chosenRoom) {
                            potentialSlots.forEach(slotId => {
                                const payload = {
                                    id: crypto.randomUUID(),
                                    day: day,
                                    timeSlotId: slotId,
                                    subjectId: group.subjectId,
                                    teacherId: teacherId,
                                    classroomId: chosenRoom!,
                                    courseGroupId: group.id
                                };
                                newAssignments.push(payload);
                                occupiedSlots.add(`${day}-${slotId}-${teacherId}`);
                                occupiedRooms.add(`${day}-${slotId}-${chosenRoom!}`);
                            });
                            assigned = true;
                        }
                    }
                }
            }
        };

        // ── Split groups into passes ──
        const pass1: typeof allPendingGroups = []; // mandatory classroom (allowedClassroomIds)
        const pass2: typeof allPendingGroups = []; // planned classroom (plannedClassroomId from offer)
        const pass3: typeof allPendingGroups = []; // everything else

        allPendingGroups.forEach(g => {
            const subject = state.subjects.find(s => s.id === g.subjectId);
            if (subject?.allowedClassroomIds && subject.allowedClassroomIds.length > 0) {
                pass1.push(g);
            } else if (g.plannedClassroomId) {
                pass2.push(g);
            } else {
                pass3.push(g);
            }
        });

        // ====== PASS 1: Mandatory classrooms ======
        pass1.forEach(g => tryAssignGroup(g, 'mandatory'));

        // ====== PASS 2: Planned classroom with fallback to compatible types ======
        pass2.forEach(g => tryAssignGroup(g, 'flexible'));

        // ====== PASS 3: Any compatible classroom ======
        pass3.forEach(g => tryAssignGroup(g, 'flexible'));

        if (newAssignments.length > 0) {
            newAssignments.forEach(a => dispatch({ type: 'ADD_ASSIGNMENT', payload: a }));
        }
    };

    const handleClearTeacherSchedule = (teacherId: string) => {
        if (!teacherId) return;
        const assignmentsToClear = state.assignments.filter(a => a.teacherId === teacherId);
        if (assignmentsToClear.length === 0) {
            toast.error('Este docente no tiene asignaciones para borrar.');
            return;
        }
        dispatch({
            type: 'DELETE_MULTIPLE_ASSIGNMENTS',
            payload: assignmentsToClear.map(a => a.id)
        });
        toast.success(`Horario liberado (${assignmentsToClear.length} horas removidas).`);
    };

    const handleReassignTeacher = (courseGroupId: string, newTeacherId: string) => {
        const groupAssignments = state.assignments.filter(a => a.courseGroupId === courseGroupId);
        groupAssignments.forEach(a => {
            dispatch({
                type: 'UPDATE_ASSIGNMENT',
                payload: { ...a, teacherId: newTeacherId, isIncomplete: !newTeacherId || !a.classroomId }
            });
        });

        const group = state.courseGroups.find(g => g.id === courseGroupId);
        if (group && group.teacherId !== newTeacherId) {
            dispatch({
                type: 'UPDATE_COURSE_GROUP',
                payload: { ...group, teacherId: newTeacherId }
            });
        }
    };

    const handleEditCourseGroup = (groupId: string, updates: { teacherId?: string; plannedClassroomId?: string }) => {
        const group = state.courseGroups.find(g => g.id === groupId);
        if (group) {
            dispatch({
                type: 'UPDATE_COURSE_GROUP',
                payload: { ...group, ...updates }
            });
            if (updates.teacherId !== undefined) {
                handleReassignTeacher(groupId, updates.teacherId);
            }
        }
    };

    const handleClearAllSchedules = () => {
        if (state.assignments.length === 0) {
            toast.error('No hay horarios agendados para borrar.');
            return;
        }
        dispatch({
            type: 'DELETE_MULTIPLE_ASSIGNMENTS',
            payload: state.assignments.map(a => a.id)
        });
        toast.success('La grilla de horarios ha sido vaciada completamente.');
    };

    return {
        // State
        state, dispatch, timeSlots, visibleTimeSlots, visibleDays,
        viewMode, selectedTeacherId, selectedClassroomId,
        selectedCell, assignMode, selectedGroupId,
        formSubjectId, formTeacherId, formClassroomId,
        editingAssignmentIds, activeId,
        showAllPending,
        isSidebarOpen,
        weekMode, scheduleFilter,

        // Setters
        setSelectedTeacherId, setSelectedClassroomId,
        setAssignMode, setFormSubjectId, setFormTeacherId, setFormClassroomId,
        setShowAllPending,
        setIsSidebarOpen,
        setWeekMode, setScheduleFilter,

        // Computed
        pendingSessions, allPendingSessions,
        activeSession, activeAssignment,
        sensors,

        // Handlers
        handleTabChange, openAssignmentModal, closeModal,
        handleCellClick: openAssignmentModal, // Exported alias expected by ScheduleCell
        handleGroupSelect, handleSave,
        handleDragEnd, handleDragStart,
        handleDeleteAssignment, handleSplitAssignment,
        handleAutoAssignAll, validateMove,
        handleClearTeacherSchedule, handleClearAllSchedules,
        handleReassignTeacher, handleEditCourseGroup
    };
};

