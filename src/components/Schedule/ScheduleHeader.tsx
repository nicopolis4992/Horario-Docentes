import React from 'react';
import {
    Sparkles,
    User,
    MapPin,
    Trash2
} from 'lucide-react';
import { CLASSROOM_CONFIG } from '../../../utils';
import { Teacher, Classroom, DayOfWeek, TimeSlot, AppState } from '../../../types';

interface ScheduleHeaderProps {
    viewMode: 'teachers' | 'classrooms';
    selectedTeacherId: string | null;
    selectedClassroomId: string | null;
    teachers: Teacher[];
    classrooms: Classroom[];
    state: AppState;
    dispatch: React.Dispatch<any>;
    onTabChange: (mode: 'teachers' | 'classrooms') => void;
    onSelectTeacher: (id: string) => void;
    onSelectClassroom: (id: string) => void;
    onAutoAssignAll: () => void;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    viewMode,
    selectedTeacherId,
    selectedClassroomId,
    teachers,
    classrooms,
    state,
    dispatch,
    onTabChange,
    onSelectTeacher,
    onSelectClassroom,
    onAutoAssignAll
}) => {
    return (
        <>
            {/* HEADER: Title + Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Planificador</h2>
                    <p className="text-slate-500 text-sm">Organiza las clases de la semana.</p>
                </div>

                {/* TABS & ACTIONS */}
                <div className="flex gap-2">
                    <button
                        onClick={onAutoAssignAll}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                        title="Asignar automáticamente todos los paralelos pendientes"
                    >
                        <Sparkles size={18} />
                        Asignar Todo
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('¿Limpiar TODO el horario de la semana? Esta acción es irreversible.')) {
                                dispatch({ type: 'CLEAR_ALL_ASSIGNMENTS' });
                            }
                        }}
                        className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                        title="Borrar todas las asignaciones de la grilla"
                    >
                        <Trash2 size={18} />
                        Limpiar Todo
                    </button>
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button
                            onClick={() => onTabChange('teachers')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'teachers'
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <User size={18} />
                            Docentes
                        </button>
                        <button
                            onClick={() => onTabChange('classrooms')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'classrooms'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <MapPin size={18} />
                            Aulas
                        </button>
                    </div>
                </div>
            </div>

            {/* SELECTION BAR (Horizontal Scroll) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 shrink-0">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">
                    {viewMode === 'teachers' ? 'Selecciona un Docente' : 'Selecciona un Aula'}
                </p>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {viewMode === 'teachers' ? (
                        teachers.length > 0 ? (
                            teachers.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => onSelectTeacher(t.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-[160px] ${selectedTeacherId === t.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${selectedTeacherId === t.id ? 'bg-white text-blue-600' : 'text-white'
                                            }`}
                                        style={{ backgroundColor: selectedTeacherId === t.id ? undefined : t.color }}
                                    >
                                        {t.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium truncate">{t.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-sm text-slate-400 italic px-2">No hay docentes registrados.</div>
                        )
                    ) : (
                        classrooms.length > 0 ? (
                            classrooms.map(c => {
                                const config = CLASSROOM_CONFIG[c.type];
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => onSelectClassroom(c.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-[140px] ${selectedClassroomId === c.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${selectedClassroomId === c.id ? 'bg-white' : config.iconColor.replace('text', 'bg')}`}></div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold leading-none">{c.name}</span>
                                            <span className={`text-[10px] leading-none mt-1 ${selectedClassroomId === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>{c.type}</span>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-sm text-slate-400 italic px-2">No hay aulas registradas.</div>
                        )
                    )}
                </div>

                {/* CONTEXT CLEAR BUTTON */}
                {(selectedTeacherId || selectedClassroomId) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => {
                                if (viewMode === 'teachers' && selectedTeacherId) {
                                    const t = state.teachers.find(x => x.id === selectedTeacherId);
                                    if (confirm(`¿Borrar TODO el horario de ${t?.name}?`)) {
                                        dispatch({ type: 'CLEAR_TEACHER_ASSIGNMENTS', payload: selectedTeacherId });
                                    }
                                } else if (viewMode === 'classrooms' && selectedClassroomId) {
                                    const c = state.classrooms.find(x => x.id === selectedClassroomId);
                                    if (confirm(`¿Borrar TODA la ocupación de ${c?.name}?`)) {
                                        dispatch({ type: 'CLEAR_CLASSROOM_ASSIGNMENTS', payload: selectedClassroomId });
                                    }
                                }
                            }}
                            className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={14} />
                            {viewMode === 'teachers' ? 'Limpiar Horario del Docente' : 'Limpiar Uso del Aula'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ScheduleHeader;
