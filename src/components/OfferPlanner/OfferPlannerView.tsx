import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../store';
import { Subject, CourseGroup } from '../../../types';
import {
    Users,
    Trash2,
    Clock,
    GraduationCap,
    Sparkles,
    Calculator,
    Plus,
    AlertTriangle,
    ListTodo,
    CheckCircle2
} from 'lucide-react';
import { AREA_CONFIG } from '../../../utils';
import Modal from '../Common/Modal';

const OfferPlannerView = () => {
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

    // Helper to get usage of a classroom in all defined groups (+ optional extra counts)
    const getClassroomUsage = (roomId: string, extraCounts?: Map<string, number>) => {
        const baseCount = state.courseGroups.filter(g => g.plannedClassroomId === roomId).length;
        return baseCount + (extraCounts?.get(roomId) || 0);
    };

    // Returns sorted list of eligible classrooms for a subject
    const getEligibleRooms = (subject: Subject, extraCounts?: Map<string, number>) => {
        let rooms = [] as typeof state.classrooms;

        if (subject.allowedClassroomIds && subject.allowedClassroomIds.length > 0) {
            rooms = state.classrooms.filter(c => subject.allowedClassroomIds?.includes(c.id));
        } else if (subject.allowedClassroomTypes && subject.allowedClassroomTypes.length > 0) {
            rooms = state.classrooms.filter(c => subject.allowedClassroomTypes?.includes(c.type));
        } else {
            rooms = [...state.classrooms];
        }

        return rooms.sort((a, b) => getClassroomUsage(a.id, extraCounts) - getClassroomUsage(b.id, extraCounts));
    };

    // Helper for Auto-Assignment
    const suggestTeacherAndRoom = (subject: Subject) => {
        // 1. Suggest Teacher
        let suggestedTeacherId = subject.preferredTeacherId;
        if (!suggestedTeacherId) {
            const eligibleTeachers = state.teachers.filter(t =>
                t.allowedSubjectIds?.includes(subject.id)
            ).sort((a, b) => getTeacherTotalLoad(a.id) - getTeacherTotalLoad(b.id));

            if (eligibleTeachers.length > 0) {
                suggestedTeacherId = eligibleTeachers[0].id;
            } else {
                const anyTeachers = [...state.teachers].sort((a, b) =>
                    getTeacherTotalLoad(a.id) - getTeacherTotalLoad(b.id)
                );
                suggestedTeacherId = anyTeachers[0]?.id;
            }
        }

        // 2. Suggest Room (first eligible, sorted by load)
        const eligibleRooms = getEligibleRooms(subject);
        const suggestedRoomId = eligibleRooms[0]?.id || '';

        return { suggestedTeacherId, suggestedRoomId, eligibleRooms };
    };

    const handleCalculate = () => {
        if (!selectedSubject) return;

        const { suggestedTeacherId, eligibleRooms } = suggestTeacherAndRoom(selectedSubject);

        // If user picked a specific base classroom, use that as the reference for capacity
        // but still round-robin across eligible rooms
        const refRoomId = baseClassroomId || eligibleRooms[0]?.id || state.classrooms[0]?.id;
        const refRoom = state.classrooms.find(c => c.id === refRoomId);
        if (!refRoom) return;

        const capacity = useMaxCapacity ? refRoom.maxCapacity : refRoom.recommendedCapacity;
        const totalStudents = selectedSubject.projectedStudents;
        const numberOfGroups = Math.ceil(totalStudents / capacity);

        // Use eligible rooms for round-robin; fallback to refRoom if none
        const roomPool = eligibleRooms.length > 0 ? eligibleRooms : [refRoom];

        const newGroups: Partial<CourseGroup>[] = [];
        let studentsRemaining = totalStudents;

        for (let i = 0; i < numberOfGroups; i++) {
            const count = Math.min(capacity, studentsRemaining);
            studentsRemaining -= count;

            // Round-robin: cycle through eligible rooms
            const assignedRoom = roomPool[i % roomPool.length];

            newGroups.push({
                id: crypto.randomUUID(),
                subjectId: selectedSubject.id,
                name: `Paralelo ${String.fromCharCode(65 + i)}`,
                studentCount: count,
                totalHours: selectedSubject.credits,
                plannedClassroomId: assignedRoom.id,
                teacherId: suggestedTeacherId,
                sessionPattern: selectedSubject.sessionPattern
            });
        }
        setPreviewGroups(newGroups);
    };

    const handleUpdatePreview = (index: number, field: keyof CourseGroup, value: any) => {
        const updated = [...previewGroups];
        updated[index] = { ...updated[index], [field]: value };
        setPreviewGroups(updated);
    };

    const handleConfirmGroups = () => {
        if (previewGroups.length === 0) return;
        dispatch({
            type: 'BULK_ADD_COURSE_GROUPS',
            payload: previewGroups as CourseGroup[]
        });
        setPreviewGroups([]);
        setBaseClassroomId('');
    };

    const handleDeleteGroupClick = (groupId: string) => {
        setGroupToDelete(groupId);
    };

    const confirmDeleteGroup = () => {
        if (groupToDelete) {
            dispatch({ type: 'DELETE_COURSE_GROUP', payload: groupToDelete });
            setGroupToDelete(null);
        }
    };

    const handleUpdateGroupTeacher = (group: CourseGroup, teacherId: string) => {
        dispatch({
            type: 'UPDATE_COURSE_GROUP',
            payload: { ...group, teacherId }
        });
    };

    const handleUpdateGroupRoom = (group: CourseGroup, roomId: string) => {
        dispatch({
            type: 'UPDATE_COURSE_GROUP',
            payload: { ...group, plannedClassroomId: roomId }
        });
    };

    const handleBulkGenerate = () => {
        const subjectsToPlan = state.subjects.filter(s => {
            const existing = state.courseGroups.filter(g => g.subjectId === s.id);
            const totalPlanned = existing.reduce((acc, g) => acc + g.studentCount, 0);
            return totalPlanned < s.projectedStudents;
        });

        if (subjectsToPlan.length === 0) return;

        const allNewGroups: CourseGroup[] = [];
        // Track extra classroom usage across the entire batch
        const batchUsageCounts = new Map<string, number>();

        subjectsToPlan.forEach(subject => {
            const { suggestedTeacherId } = suggestTeacherAndRoom(subject);

            // Get eligible rooms sorted by usage (including batch counts)
            const eligibleRooms = getEligibleRooms(subject, batchUsageCounts);
            if (eligibleRooms.length === 0) return;

            const refRoom = eligibleRooms[0];
            const capacity = refRoom.recommendedCapacity;
            const totalStudents = subject.projectedStudents;
            const numberOfGroups = Math.ceil(totalStudents / capacity);

            let studentsRemaining = totalStudents;

            for (let i = 0; i < numberOfGroups; i++) {
                const count = Math.min(capacity, studentsRemaining);
                studentsRemaining -= count;

                // Re-sort eligible rooms by current usage (base + batch) for true balancing
                const sortedRooms = [...eligibleRooms].sort((a, b) =>
                    getClassroomUsage(a.id, batchUsageCounts) - getClassroomUsage(b.id, batchUsageCounts)
                );
                const assignedRoom = sortedRooms[0];

                allNewGroups.push({
                    id: crypto.randomUUID(),
                    subjectId: subject.id,
                    name: `Paralelo ${String.fromCharCode(65 + i)}`,
                    studentCount: count,
                    totalHours: subject.credits,
                    plannedClassroomId: assignedRoom.id,
                    teacherId: suggestedTeacherId,
                    sessionPattern: subject.sessionPattern
                });

                // Increment batch usage counter
                batchUsageCounts.set(assignedRoom.id, (batchUsageCounts.get(assignedRoom.id) || 0) + 1);
            }
        });

        if (allNewGroups.length > 0) {
            dispatch({
                type: 'BULK_ADD_COURSE_GROUPS',
                payload: allNewGroups
            });
        }
    };

    // Improved Load Calculation Helper
    const getTeacherTotalLoad = (teacherId: string, excludeGroupId?: string) => {
        const groupsLoad = state.courseGroups
            .filter(g => g.teacherId === teacherId && g.id !== excludeGroupId)
            .reduce((acc, g) => acc + g.totalHours, 0);

        const manualLoad = state.assignments
            .filter(a => a.teacherId === teacherId && !a.courseGroupId)
            .length;

        return groupsLoad + manualLoad;
    };

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-6 pb-20 lg:pb-0">
            {/* LEFT: Subjects List */}
            <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 max-h-[300px] lg:max-h-none">
                <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800">Materias Ofertadas</h3>
                        <p className="text-xs text-slate-500">Planifica los paralelos aquí.</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <button
                            onClick={handleBulkGenerate}
                            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm"
                            title="Generar paralelos para todas las materias pendientes"
                        >
                            <Sparkles size={12} />
                            Generar Todo
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('¿Borrar TODA la oferta y horarios?')) {
                                    dispatch({ type: 'CLEAR_ALL_COURSE_GROUPS' });
                                }
                            }}
                            className="flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 border border-red-100 px-1 py-1 rounded text-[10px] font-bold"
                        >
                            <Trash2 size={12} />
                            Borrar Todo
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {state.subjects.map(subject => {
                        const groups = state.courseGroups.filter(g => g.subjectId === subject.id);
                        const totalPlannedStudents = groups.reduce((acc, g) => acc + g.studentCount, 0);
                        const isFullyPlanned = totalPlannedStudents >= subject.projectedStudents;
                        const config = AREA_CONFIG[subject.area];

                        return (
                            <button
                                key={subject.id}
                                onClick={() => {
                                    setSelectedSubjectId(subject.id);
                                    setPreviewGroups([]);
                                    if (subject.preferredClassroomId) {
                                        setBaseClassroomId(subject.preferredClassroomId);
                                    } else {
                                        setBaseClassroomId('');
                                    }
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedSubjectId === subject.id
                                    ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                                    : 'bg-white border-slate-100 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                        {subject.area}
                                    </span>
                                    {isFullyPlanned ? (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-slate-300 mt-1"></span>
                                    )}
                                </div>
                                <h4 className={`font-bold text-sm ${selectedSubjectId === subject.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                    {subject.name}
                                </h4>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-xs text-slate-500">
                                        {groups.length} grupos creados
                                    </span>
                                    <span className={`text-xs font-mono font-medium ${isFullyPlanned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {totalPlannedStudents}/{subject.projectedStudents} est.
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${isFullyPlanned ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                        style={{ width: `${Math.min(100, (totalPlannedStudents / subject.projectedStudents) * 100)}%` }}
                                    ></div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: Workspace */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
                {!selectedSubject ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <ListTodo size={48} className="opacity-50" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">Planificador de Oferta</h3>
                        <p className="max-w-md">Selecciona una materia de la izquierda para comenzar a definir cuántos paralelos abrir y qué docentes asignarlos.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b border-slate-100 bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        {selectedSubject.name}
                                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                            {selectedSubject.projectedStudents} Estudiantes Proyectados
                                        </span>
                                    </h2>
                                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                        <span className="flex items-center gap-1"><Clock size={14} /> {selectedSubject.credits} Horas/Semana</span>
                                        <span className="flex items-center gap-1"><GraduationCap size={14} /> {AREA_CONFIG[selectedSubject.area].label}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(`¿Borrar todos los paralelos de ${selectedSubject.name}?`)) {
                                            dispatch({ type: 'CLEAR_SUBJECT_COURSE_GROUPS', payload: selectedSubject.id });
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                >
                                    <Trash2 size={14} /> Borrar Paralelos
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {existingGroups.length === 0 && (
                                <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6 mb-8 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-4 text-blue-800">
                                        <Calculator size={20} />
                                        <h3 className="font-bold">Generador de Paralelos</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aula Base (Estrategia)</label>
                                            <select
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                                                value={baseClassroomId}
                                                onChange={(e) => {
                                                    setBaseClassroomId(e.target.value);
                                                    setPreviewGroups([]);
                                                }}
                                            >
                                                <option value="">Selecciona un aula...</option>
                                                {state.classrooms.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} (Cap: {c.recommendedCapacity}/{c.maxCapacity})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center pb-2">
                                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={useMaxCapacity}
                                                    onChange={(e) => {
                                                        setUseMaxCapacity(e.target.checked);
                                                        setPreviewGroups([]);
                                                    }}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Usar Capacidad Máxima (Riesgo)</span>
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleCalculate}
                                            disabled={!baseClassroomId}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                                        >
                                            Calcular Paralelos
                                        </button>
                                    </div>

                                    {previewGroups.length > 0 && (
                                        <div className="mt-6 border-t border-slate-100 pt-4">
                                            <h4 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                                                <span>Vista Previa: {previewGroups.length} Grupos Generados</span>
                                                <button
                                                    onClick={handleConfirmGroups}
                                                    className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                                >
                                                    Confirmar y Crear
                                                </button>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {previewGroups.map((group, idx) => (
                                                    <div key={idx} className="bg-white border-2 border-dashed border-blue-200 p-3 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
                                                        <div className="flex justify-between font-bold text-slate-700 mb-2">
                                                            <span>{group.name}</span>
                                                            <span className="bg-blue-100 text-blue-700 px-2 rounded text-xs flex items-center">{group.studentCount} est.</span>
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Aula sugerida: {state.classrooms.find(c => c.id === group.plannedClassroomId)?.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {existingGroups.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-700">Paralelos Activos ({existingGroups.length})</h3>
                                        <button
                                            onClick={() => {
                                                dispatch({
                                                    type: 'ADD_COURSE_GROUP',
                                                    payload: {
                                                        id: crypto.randomUUID(),
                                                        subjectId: selectedSubject.id,
                                                        name: `Nuevo Grupo`,
                                                        studentCount: 0,
                                                        totalHours: selectedSubject.credits,
                                                        plannedClassroomId: ''
                                                    }
                                                })
                                            }}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            <Plus size={14} /> Agregar Manualmente
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {existingGroups.map(group => {
                                            const assignedTeacher = state.teachers.find(t => t.id === group.teacherId);
                                            const baseLoad = assignedTeacher ? getTeacherTotalLoad(assignedTeacher.id, group.id) : 0;
                                            const projectedLoadIfKept = baseLoad + group.totalHours;
                                            const isOverloaded = assignedTeacher && projectedLoadIfKept > assignedTeacher.maxHours;

                                            return (
                                                <div key={group.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                                                    <div className="min-w-[120px]">
                                                        <h4 className="font-bold text-slate-800 text-lg">{group.name}</h4>
                                                        <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit mt-1">
                                                            <Users size={14} />
                                                            <input
                                                                type="number"
                                                                value={group.studentCount}
                                                                onChange={(e) => dispatch({
                                                                    type: 'UPDATE_COURSE_GROUP',
                                                                    payload: { ...group, studentCount: parseInt(e.target.value) || 0 }
                                                                })}
                                                                className="bg-transparent w-10 outline-none text-center font-bold"
                                                            />
                                                            <span>est.</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 w-full">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Docente Asignado</label>
                                                        <select
                                                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 transition-colors ${!group.teacherId
                                                                ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                                : isOverloaded
                                                                    ? 'border-red-300 bg-red-50 text-red-900'
                                                                    : 'border-slate-300 bg-white text-slate-900'
                                                                }`}
                                                            value={group.teacherId || ''}
                                                            onChange={(e) => handleUpdateGroupTeacher(group, e.target.value)}
                                                        >
                                                            <option value="">-- Sin Asignar --</option>
                                                            {state.teachers.map(t => {
                                                                const tBaseLoad = getTeacherTotalLoad(t.id, group.id);
                                                                const tProjected = tBaseLoad + group.totalHours;
                                                                const willBeOverloaded = tProjected > t.maxHours;
                                                                const currentLoad = getTeacherTotalLoad(t.id);

                                                                return (
                                                                    <option key={t.id} value={t.id} className={willBeOverloaded ? 'text-red-500' : ''}>
                                                                        {t.name} (Total: {currentLoad}/{t.maxHours}h) {willBeOverloaded ? '⚠️' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        {isOverloaded && (
                                                            <div className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                                                                <AlertTriangle size={10} /> Carga excedida ({projectedLoadIfKept}/{assignedTeacher?.maxHours}h)
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 w-full">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Aula Preferida</label>
                                                        <select
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                                                            value={group.plannedClassroomId || ''}
                                                            onChange={(e) => handleUpdateGroupRoom(group, e.target.value)}
                                                        >
                                                            <option value="">-- Cualquiera --</option>
                                                            {state.classrooms.map(c => {
                                                                const isTooSmall = c.maxCapacity < group.studentCount;
                                                                return (
                                                                    <option key={c.id} value={c.id} className={isTooSmall ? 'text-red-500' : ''}>
                                                                        {c.name} (Cap: {c.maxCapacity}) {isTooSmall ? '⚠️' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteGroupClick(group.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar paralelo"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Modal
                    isOpen={!!groupToDelete}
                    onClose={() => setGroupToDelete(null)}
                    title="Eliminar Paralelo"
                    maxWidth="max-w-sm"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertTriangle size={24} className="shrink-0" />
                            <p className="text-sm font-medium">Esta acción es irreversible y eliminará todas las clases agendadas para este grupo.</p>
                        </div>
                        <p className="text-slate-600 text-sm">
                            ¿Estás seguro de que deseas eliminar este paralelo?
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setGroupToDelete(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteGroup}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default OfferPlannerView;
