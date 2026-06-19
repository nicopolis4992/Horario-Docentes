import { useState, useMemo } from 'react';
import { useAppStore } from '../../../store';
import { Subject, CourseGroup } from '../../../types';
import toast from 'react-hot-toast';

export const useOfferPlanner = () => {
    const { state, dispatch } = useAppStore();
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    // Generator State
    const [baseClassroomId, setBaseClassroomId] = useState<string>('');
    const [useMaxCapacity, setUseMaxCapacity] = useState(false);
    const [previewGroups, setPreviewGroups] = useState<Partial<CourseGroup>[]>([]);

    // Delete Confirmation State
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    const selectedSubject = useMemo(() =>
        state.subjects.find(s => s.id === selectedSubjectId),
        [state.subjects, selectedSubjectId]
    );

    const existingGroups = useMemo(() =>
        state.courseGroups.filter(g => g.subjectId === selectedSubjectId),
        [state.courseGroups, selectedSubjectId]
    );

    // Helper to get usage of a classroom
    const getClassroomUsage = (roomId: string, extraCounts?: Map<string, number>) => {
        const baseCount = state.courseGroups.filter(g => g.plannedClassroomId === roomId).length;
        return baseCount + (extraCounts?.get(roomId) || 0);
    };

    // Returns sorted list of eligible classrooms
    const getEligibleRooms = (subject: Subject, extraCounts?: Map<string, number>) => {
        let rooms = [] as typeof state.classrooms;

        if (subject.allowedClassroomIds && subject.allowedClassroomIds.length > 0) {
            // Subject requests specific classrooms — use only those
            rooms = state.classrooms.filter(c => subject.allowedClassroomIds?.includes(c.id));
        } else if (subject.allowedClassroomTypes && subject.allowedClassroomTypes.length > 0) {
            // Subject requests classroom TYPES — exclude classrooms reserved by other subjects
            const reservedByOthers = new Set<string>();
            state.subjects.forEach(s => {
                if (s.id !== subject.id && s.allowedClassroomIds && s.allowedClassroomIds.length > 0) {
                    s.allowedClassroomIds.forEach(id => reservedByOthers.add(id));
                }
            });
            rooms = state.classrooms.filter(c =>
                subject.allowedClassroomTypes?.includes(c.type) && !reservedByOthers.has(c.id)
            );
            // Fallback: if no non-reserved rooms of this type exist, include reserved ones
            if (rooms.length === 0) {
                rooms = state.classrooms.filter(c => subject.allowedClassroomTypes?.includes(c.type));
            }
        } else {
            rooms = [...state.classrooms];
        }

        return rooms.sort((a, b) => getClassroomUsage(a.id, extraCounts) - getClassroomUsage(b.id, extraCounts));
    };

    const suggestTeacherAndRoom = (subject: Subject) => {
        let suggestedTeacherId: string | undefined = undefined;
        const eligibleTeachers = state.teachers.filter(t =>
            t.allowedSubjectIds?.includes(subject.id)
        ).sort((a, b) => getTeacherTotalLoad(a.id) - getTeacherTotalLoad(b.id));

        if (eligibleTeachers.length > 0) {
            suggestedTeacherId = eligibleTeachers[0].id;
        }

        const eligibleRooms = getEligibleRooms(subject);
        const suggestedRoomId = eligibleRooms[0]?.id || '';

        return { suggestedTeacherId, suggestedRoomId, eligibleRooms };
    };

    const handleCalculate = () => {
        if (!selectedSubject) return;

        const { suggestedTeacherId, eligibleRooms } = suggestTeacherAndRoom(selectedSubject);
        const refRoomId = baseClassroomId || eligibleRooms[0]?.id || state.classrooms[0]?.id;
        const refRoom = state.classrooms.find(c => c.id === refRoomId);

        if (!refRoom) {
            toast.error('No hay aulas disponibles para calcular.');
            return;
        }

        const capacity = useMaxCapacity ? refRoom.maxCapacity : refRoom.recommendedCapacity;
        const totalStudents = selectedSubject.projectedStudents;
        const numberOfGroups = Math.ceil(totalStudents / capacity);

        const roomPool = eligibleRooms.length > 0 ? eligibleRooms : [refRoom];
        const newGroups: Partial<CourseGroup>[] = [];

        // Equalize student counts as much as possible
        const baseCount = numberOfGroups > 0 ? Math.floor(totalStudents / numberOfGroups) : 0;
        const remainder = numberOfGroups > 0 ? totalStudents % numberOfGroups : 0;

        for (let i = 0; i < numberOfGroups; i++) {
            const count = baseCount + (i < remainder ? 1 : 0);
            const assignedRoom = roomPool[i % roomPool.length];

            newGroups.push({
                id: crypto.randomUUID(),
                subjectId: selectedSubject.id,
                name: `Paralelo ${existingGroups.length + i + 1}`,
                studentCount: count,
                totalHours: selectedSubject.credits,
                plannedClassroomId: assignedRoom.id,
                teacherId: suggestedTeacherId,
                sessionPattern: selectedSubject.sessionPattern
            });
        }
        setPreviewGroups(newGroups);
        toast.success(`${newGroups.length} paralelos calculados.`);
    };

    const handleConfirmGroups = () => {
        if (previewGroups.length === 0) return;
        dispatch({
            type: 'BULK_ADD_COURSE_GROUPS',
            payload: previewGroups as CourseGroup[]
        });
        toast.success(`Se crearon ${previewGroups.length} grupos exitosamente.`);
        setPreviewGroups([]);
        setBaseClassroomId('');
    };

    const handleDeleteGroupClick = (groupId: string) => {
        setGroupToDelete(groupId);
    };

    const confirmDeleteGroup = () => {
        if (groupToDelete) {
            dispatch({ type: 'DELETE_COURSE_GROUP', payload: groupToDelete });
            toast.success('Paralelo y horarios asociados eliminados.');
            setGroupToDelete(null);
        }
    };

    const handleUpdateGroupTeacher = (group: CourseGroup, teacherId: string) => {
        dispatch({
            type: 'UPDATE_COURSE_GROUP',
            payload: { ...group, teacherId }
        });
        toast.success(`Docente actualizado para ${group.name}`);
    };

    const handleUpdateGroupRoom = (group: CourseGroup, roomId: string) => {
        dispatch({
            type: 'UPDATE_COURSE_GROUP',
            payload: { ...group, plannedClassroomId: roomId }
        });
        toast.success(`Aula actualizada para ${group.name}`);
    };

    const handleBulkGenerate = () => {
        const subjectsToPlan = state.subjects.filter(s => {
            const existing = state.courseGroups.filter(g => g.subjectId === s.id);
            const totalPlanned = existing.reduce((acc, g) => acc + g.studentCount, 0);
            return totalPlanned < s.projectedStudents;
        });

        if (subjectsToPlan.length === 0) {
            toast.error('Toda la oferta ya está planificada.');
            return;
        }

        const allNewGroups: CourseGroup[] = [];
        const batchUsageCounts = new Map<string, number>();

        subjectsToPlan.forEach(subject => {
            const { suggestedTeacherId } = suggestTeacherAndRoom(subject);
            const eligibleRooms = getEligibleRooms(subject, batchUsageCounts);
            if (eligibleRooms.length === 0) return;

            const refRoom = eligibleRooms[0];
            const capacity = refRoom.recommendedCapacity;
            const totalStudents = subject.projectedStudents;
            const numberOfGroups = Math.ceil(totalStudents / capacity);

            const existingCount = state.courseGroups.filter(g => g.subjectId === subject.id).length;

            // Equalize student counts as much as possible
            const baseCount = numberOfGroups > 0 ? Math.floor(totalStudents / numberOfGroups) : 0;
            const remainder = numberOfGroups > 0 ? totalStudents % numberOfGroups : 0;

            for (let i = 0; i < numberOfGroups; i++) {
                const count = baseCount + (i < remainder ? 1 : 0);

                const sortedRooms = [...eligibleRooms].sort((a, b) =>
                    getClassroomUsage(a.id, batchUsageCounts) - getClassroomUsage(b.id, batchUsageCounts)
                );
                const assignedRoom = sortedRooms[0];

                allNewGroups.push({
                    id: crypto.randomUUID(),
                    subjectId: subject.id,
                    name: `Paralelo ${existingCount + i + 1}`,
                    studentCount: count,
                    totalHours: subject.credits,
                    plannedClassroomId: assignedRoom.id,
                    teacherId: suggestedTeacherId,
                    sessionPattern: subject.sessionPattern
                });

                batchUsageCounts.set(assignedRoom.id, (batchUsageCounts.get(assignedRoom.id) || 0) + 1);
            }
        });

        if (allNewGroups.length > 0) {
            dispatch({
                type: 'BULK_ADD_COURSE_GROUPS',
                payload: allNewGroups
            });
            toast.success(`Generación automática completada: ${allNewGroups.length} paralelos nuevos.`);
        }
    };

    const handleClearSubjectGroups = () => {
        if (!selectedSubject) return;
        dispatch({ type: 'CLEAR_SUBJECT_COURSE_GROUPS', payload: selectedSubject.id });
        toast.success(`Paralelos de ${selectedSubject.name} eliminados.`);
    };

    const getTeacherTotalLoad = (teacherId: string, excludeGroupId?: string) => {
        const groupsLoad = state.courseGroups
            .filter(g => g.teacherId === teacherId && g.id !== excludeGroupId)
            .reduce((acc, g) => acc + g.totalHours, 0);

        const manualLoad = state.assignments
            .filter(a => a.teacherId === teacherId && !a.courseGroupId)
            .length;

        return groupsLoad + manualLoad;
    };

    return {
        state,
        dispatch,

        selectedSubjectId,
        setSelectedSubjectId,
        selectedSubject,
        existingGroups,

        baseClassroomId,
        setBaseClassroomId,
        useMaxCapacity,
        setUseMaxCapacity,
        previewGroups,
        setPreviewGroups,

        groupToDelete,
        setGroupToDelete,

        handleCalculate,
        handleConfirmGroups,
        handleDeleteGroupClick,
        confirmDeleteGroup,
        handleUpdateGroupTeacher,
        handleUpdateGroupRoom,
        handleBulkGenerate,
        handleClearSubjectGroups,
        getTeacherTotalLoad
    };
};
