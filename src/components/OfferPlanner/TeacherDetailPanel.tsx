import React from 'react';
import { useAppStore } from '../../../store';
import { Users, Clock, BookOpen, Trash2, AlertTriangle } from 'lucide-react';
import { AREA_CONFIG } from '../../../utils';
import toast from 'react-hot-toast';

interface TeacherDetailPanelProps {
    teacherId: string;
}

const TeacherDetailPanel = ({ teacherId }: TeacherDetailPanelProps) => {
    const { state, dispatch } = useAppStore();

    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return null;

    // All groups assigned to this teacher
    const teacherGroups = state.courseGroups.filter(g => g.teacherId === teacherId);

    // Total hours
    const totalHours = teacherGroups.reduce((acc, g) => acc + g.totalHours, 0);
    const isOverloaded = totalHours > teacher.maxHours;
    const loadPercent = Math.min(100, (totalHours / teacher.maxHours) * 100);

    // Group by subject
    const subjectIds = Array.from(new Set(teacherGroups.map(g => g.subjectId)));
    const groupedBySubject = subjectIds.map(subjectId => ({
        subject: state.subjects.find(s => s.id === subjectId)!,
        groups: teacherGroups.filter(g => g.subjectId === subjectId)
    })).filter(entry => entry.subject);

    const handleDeleteGroup = (groupId: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Eliminar este paralelo?</span>
                <span className="text-sm text-slate-600">Se eliminarán las clases agendadas de este grupo.</span>
                <div className="flex gap-2 justify-end mt-2">
                    <button
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                        onClick={() => {
                            dispatch({ type: 'DELETE_COURSE_GROUP', payload: groupId });
                            toast.dismiss(t.id);
                            toast.success('Paralelo eliminado.');
                        }}
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Teacher Header */}
            <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-4">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md"
                        style={{ backgroundColor: teacher.color }}
                    >
                        {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-slate-800 truncate">{teacher.name}</h2>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                                <Users size={14} />
                                {teacherGroups.length} {teacherGroups.length === 1 ? 'paralelo' : 'paralelos'}
                            </span>
                            <span className={`flex items-center gap-1 font-mono font-medium ${isOverloaded ? 'text-red-600' : 'text-slate-600'}`}>
                                <Clock size={14} />
                                {totalHours}/{teacher.maxHours}h
                                {isOverloaded && ' ⚠️'}
                            </span>
                        </div>
                        {/* Load Bar */}
                        <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all rounded-full ${isOverloaded ? 'bg-red-500' : loadPercent > 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                                style={{ width: `${loadPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Groups Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {groupedBySubject.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
                        <BookOpen size={48} className="opacity-50 mb-4" />
                        <h3 className="text-lg font-bold text-slate-500">Sin paralelos asignados</h3>
                        <p className="text-sm max-w-sm">Este docente no tiene paralelos asignados todavía. Usa la pestaña de Materias para asignar paralelos.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedBySubject.map(({ subject, groups }) => {
                            const config = AREA_CONFIG[subject.area];
                            return (
                                <div key={subject.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Subject Header */}
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${config.bg} ${config.color}`}>
                                                {subject.area}
                                            </span>
                                            <h4 className="font-bold text-sm text-slate-700 truncate">{subject.name}</h4>
                                        </div>
                                        <span className="text-xs text-slate-500 shrink-0 ml-2">
                                            {subject.credits}h/semana
                                        </span>
                                    </div>

                                    {/* Groups List */}
                                    <div className="divide-y divide-slate-100">
                                        {groups.map(group => {
                                            const classroom = state.classrooms.find(c => c.id === group.plannedClassroomId);
                                            return (
                                                <div key={group.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-sm text-slate-700">{group.name}</p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Users size={10} />
                                                                    {group.studentCount} est.
                                                                </span>
                                                                {classroom && (
                                                                    <span className="text-xs text-slate-500">
                                                                        📍 {classroom.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Teacher reassign selector */}
                                                    <select
                                                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 max-w-[150px]"
                                                        value={group.teacherId || ''}
                                                        onChange={(e) => {
                                                            const newTeacherId = e.target.value;
                                                            dispatch({
                                                                type: 'UPDATE_COURSE_GROUP',
                                                                payload: { ...group, teacherId: newTeacherId }
                                                            });
                                                            // Also update all schedule assignments for this group
                                                            state.assignments
                                                                .filter(a => a.courseGroupId === group.id)
                                                                .forEach(a => {
                                                                    dispatch({
                                                                        type: 'UPDATE_ASSIGNMENT',
                                                                        payload: { ...a, teacherId: newTeacherId }
                                                                    });
                                                                });
                                                            const newTeacher = state.teachers.find(t => t.id === newTeacherId);
                                                            toast.success(`Paralelo reasignado a ${newTeacher?.name || 'Sin asignar'}`);
                                                        }}
                                                    >
                                                        <option value="">-- Docente --</option>
                                                        {state.teachers.map(t => {
                                                            const tLoad = state.courseGroups
                                                                .filter(g => g.teacherId === t.id)
                                                                .reduce((acc, g) => acc + g.totalHours, 0);
                                                            const willBeOverloaded = tLoad > t.maxHours;
                                                            return (
                                                                <option key={t.id} value={t.id} className={willBeOverloaded ? 'text-red-500' : ''}>
                                                                    {t.name} (Total: {tLoad}/{t.maxHours}h) {willBeOverloaded ? '⚠️' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>

                                                    {/* Classroom selector */}
                                                    <select
                                                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 max-w-[140px]"
                                                        value={group.plannedClassroomId || ''}
                                                        onChange={(e) => dispatch({
                                                            type: 'UPDATE_COURSE_GROUP',
                                                            payload: { ...group, plannedClassroomId: e.target.value }
                                                        })}
                                                    >
                                                        <option value="">-- Aula --</option>
                                                        {state.classrooms.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>

                                                    <button
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 shrink-0"
                                                        title="Eliminar paralelo"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Overload warning */}
                {isOverloaded && (
                    <div className="mt-4 flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100">
                        <AlertTriangle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">
                            Este docente tiene <strong>{totalHours - teacher.maxHours}h</strong> por encima de su carga máxima permitida ({teacher.maxHours}h).
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDetailPanel;
