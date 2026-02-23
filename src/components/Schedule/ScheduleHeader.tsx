import React from 'react';
import { CalendarDays, Filter, Users, School, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import { useScheduleContext } from './ScheduleContext';
import toast from 'react-hot-toast';

const ScheduleHeader = () => {
    const {
        state,
        viewMode,
        handleTabChange,
        selectedTeacherId,
        setSelectedTeacherId,
        selectedClassroomId,
        setSelectedClassroomId,
        handleAutoAssignAll,
        allPendingSessions,
        showAllPending,
        setShowAllPending,
        handleClearTeacherSchedule,
        handleClearAllSchedules
    } = useScheduleContext();

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const confirmClearTeacher = () => {
        if (!selectedTeacherId) return;
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Vaciar horario del docente?</span>
                <span className="text-sm text-slate-600">Se eliminarán todas las clases asignadas a este profesor.</span>
                <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">Cancelar</button>
                    <button onClick={() => { handleClearTeacherSchedule(selectedTeacherId); toast.dismiss(t.id); }} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium">Sí, vaciar</button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const confirmClearAll = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Vaciar TODOS los horarios?</span>
                <span className="text-sm text-slate-600">Se eliminarán TODAS las clases de todos los docentes y aulas.</span>
                <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">Cancelar</button>
                    <button onClick={() => { handleClearAllSchedules(); toast.dismiss(t.id); }} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium">Sí, borrar todo</button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    return (
        <div className="bg-white flex flex-col border-b border-slate-200">
            {/* Top Bar */}
            <div className="px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex items-center gap-6 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 shrink-0">
                        <CalendarDays className="text-blue-600" />
                        Planificador
                    </h2>

                    {/* View Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button
                            onClick={() => handleTabChange('teacher')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${viewMode === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <Users size={16} />
                            Vista Docentes
                        </button>
                        <button
                            onClick={() => handleTabChange('classroom')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${viewMode === 'classroom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <School size={16} />
                            Vista Aulas
                        </button>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">

                    {/* Progress Indicator */}
                    {viewMode === 'teacher' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                            <div className="text-xs font-medium text-slate-600">Por Asignar:</div>
                            <div className={`text-sm font-bold ${allPendingSessions.length === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {allPendingSessions.length} hrs
                            </div>
                            {allPendingSessions.length === 0 && <CheckCircle2 size={16} className="text-emerald-500 ml-1" />}
                        </div>
                    )}

                    {viewMode === 'teacher' && selectedTeacherId && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleAutoAssignAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-sm font-bold transition-colors border border-blue-200"
                                title="Auto-asignar horas"
                            >
                                <Sparkles size={16} />
                                <span>Auto-Asignar</span>
                            </button>
                            <button
                                onClick={confirmClearTeacher}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors border border-red-100"
                                title="Vaciar horario del docente"
                            >
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Vaciar Docente</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={confirmClearAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                        title="Borrar absolutamente todos los horarios"
                    >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Borrar Todo</span>
                    </button>

                    <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>

                    {/* Classroom Selector uses Select */}
                    {viewMode === 'classroom' && (
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <Filter size={18} className="text-slate-400" />
                            <select
                                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px] w-full sm:w-auto"
                                value={selectedClassroomId || ''}
                                onChange={(e) => setSelectedClassroomId(e.target.value)}
                            >
                                <option value="">Selecciona un aula...</option>
                                {state.classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer ml-3">
                                <input
                                    type="checkbox" checked={showAllPending} onChange={(e) => setShowAllPending(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span>Ver todas las pendientes</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-header component for Teacher Initials Selection */}
            {viewMode === 'teacher' && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 overflow-x-auto flex items-center gap-3 custom-scrollbar">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">Docentes:</span>
                    {state.teachers.map(teacher => {
                        const isSelected = selectedTeacherId === teacher.id;
                        // Find if this teacher has pending hours
                        const hasPending = state.courseGroups.some(g => {
                            if (g.teacherId !== teacher.id) return false;
                            const assignedCount = state.assignments.filter(a => a.courseGroupId === g.id).length;
                            return assignedCount < g.totalHours;
                        });

                        return (
                            <button
                                key={teacher.id}
                                onClick={() => setSelectedTeacherId(teacher.id)}
                                title={teacher.name}
                                className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all shadow-sm
                                    ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 z-10' : 'hover:scale-105 border border-slate-200'}
                                `}
                                style={{
                                    backgroundColor: isSelected ? teacher.color : '#ffffff',
                                    color: isSelected ? '#ffffff' : teacher.color,
                                    borderColor: isSelected ? teacher.color : undefined
                                }}
                            >
                                {getInitials(teacher.name)}
                                {hasPending && !isSelected && (
                                    <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ScheduleHeader;
