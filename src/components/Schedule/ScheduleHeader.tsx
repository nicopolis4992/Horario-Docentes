import React from 'react';
import { CalendarDays, Filter, Users, School, Sparkles, CheckCircle2, Trash2, Sidebar, SidebarClose, AlertTriangle } from 'lucide-react';
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
        pendingSessions,
        showAllPending,
        setShowAllPending,
        handleClearTeacherSchedule,
        handleClearAllSchedules,
        isSidebarOpen,
        setIsSidebarOpen,
        weekMode,
        setWeekMode,
        scheduleFilter,
        setScheduleFilter,
        timeSlots
    } = useScheduleContext();

    const pendingHours = pendingSessions.reduce((acc, s) => acc + s.hours, 0);

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
            {/* Top Bar (Static Height and consistent layout) */}
            <div className="px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex items-center gap-6 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors mr-1"
                            title={isSidebarOpen ? "Ocultar pendientes" : "Mostrar pendientes"}
                        >
                            {isSidebarOpen ? <SidebarClose size={20} /> : <Sidebar size={20} />}
                        </button>
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
                            Docente
                        </button>
                        <button
                            onClick={() => handleTabChange('classroom')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${viewMode === 'classroom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <School size={16} />
                            Aula
                        </button>
                    </div>

                    {/* Schedule Filters */}
                    <div className="hidden sm:flex items-center gap-3 border-l-2 border-slate-200 pl-6 shrink-0">
                        <select
                            value={scheduleFilter}
                            onChange={(e) => setScheduleFilter(e.target.value as 'all' | 'diurno' | 'vespertino')}
                            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer shadow-sm hover:border-slate-400 transition-colors"
                        >
                            <option value="all">Todo el Día (7:00 - 21:50)</option>
                            <option value="diurno">Diurno (hasta 17:45)</option>
                            <option value="vespertino">Vespertino (desde 17:50)</option>
                        </select>

                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setWeekMode('workweek')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${weekMode === 'workweek' ? 'bg-white text-blue-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                            >
                                Lun-Vie
                            </button>
                            <button
                                onClick={() => setWeekMode('fullweek')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${weekMode === 'fullweek' ? 'bg-white text-blue-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                            >
                                Lun-Sáb
                            </button>
                        </div>
                    </div>
                </div>

                {/* Constant Right Actions */}
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">

                    {/* Teacher Hours Badge */}
                    {viewMode === 'teacher' && selectedTeacherId && (() => {
                        const teacher = state.teachers.find(t => t.id === selectedTeacherId);
                        const assignedHours = state.assignments.filter(a => a.teacherId === selectedTeacherId).length;
                        const maxHours = teacher?.maxHours || 0;
                        const isExceeded = maxHours > 0 && assignedHours > maxHours;
                        const isComplete = maxHours > 0 && assignedHours === maxHours;
                        const isPending = assignedHours < maxHours;

                        const badgeBg = isExceeded ? 'bg-red-50 border-red-200'
                            : isComplete ? 'bg-emerald-50 border-emerald-200'
                                : isPending ? 'bg-amber-50 border-amber-200'
                                    : 'bg-slate-50 border-slate-200';
                        const hourColor = isExceeded ? 'text-red-600'
                            : isComplete ? 'text-emerald-600'
                                : isPending ? 'text-amber-600'
                                    : 'text-slate-600';

                        return (
                            <div className={`flex items-center gap-2 px-3 py-1.5 ${badgeBg} border rounded-lg shrink-0 mr-2`}>
                                {isExceeded && <AlertTriangle size={14} className="text-red-500" />}
                                <div className="text-xs font-medium text-slate-600">{isPending ? 'Por Asignar:' : 'Horas:'}</div>
                                <div className={`text-sm font-bold ${hourColor}`}>
                                    {assignedHours}/{maxHours}h
                                </div>
                                {isComplete && <CheckCircle2 size={16} className="text-emerald-500 ml-1" />}
                            </div>
                        );
                    })()}

                    <div className="flex gap-2 justify-end">
                        {viewMode === 'teacher' && selectedTeacherId && (
                            <button
                                onClick={handleAutoAssignAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-sm font-bold transition-colors border border-blue-200"
                                title="Auto-asignar horas"
                            >
                                <Sparkles size={16} />
                                <span>Auto-Asignar</span>
                            </button>
                        )}
                        <button
                            onClick={confirmClearAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                            title="Borrar absolutamente todos los horarios"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Borrar Todo</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Sub-header component for Teacher Initials Selection */}
            {viewMode === 'teacher' && (
                <div className="bg-slate-50 border-t border-slate-200 flex flex-col">
                    <div className="px-6 py-3 overflow-x-auto flex items-center justify-between gap-3 custom-scrollbar">
                        <div className="flex items-center gap-3">
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
                        {selectedTeacherId && (
                            <button
                                onClick={confirmClearTeacher}
                                className="flex items-center justify-end gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-xs font-bold transition-colors shrink-0 ml-4 border border-red-200"
                                title="Vaciar horario de este docente"
                            >
                                <Trash2 size={12} />
                                <span>Vaciar Docente</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Sub-header component for Classroom Selection */}
            {viewMode === 'classroom' && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 overflow-x-auto flex items-center gap-3 custom-scrollbar">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">Aulas:</span>
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-[220px]"
                            value={selectedClassroomId || ''}
                            onChange={(e) => setSelectedClassroomId(e.target.value)}
                        >
                            <option value="">Selecciona un aula...</option>
                            {state.classrooms.map(c => {
                                const assignedCount = state.assignments.filter(a => a.classroomId === c.id).length;
                                const totalSlots = timeSlots.length * 6; // 6 days max (Mon-Sat)
                                const percentage = Math.round((assignedCount / totalSlots) * 100);
                                return (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {assignedCount > 0 ? `(${percentage}% ocup.)` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="h-5 w-px bg-slate-300 mx-2"></div>

                    {/* Checkbox moved here */}
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-200/50 px-2 py-1 rounded transition-colors">
                        <input
                            type="checkbox" checked={showAllPending} onChange={(e) => setShowAllPending(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium">Ver todas las pendientes</span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default ScheduleHeader;
