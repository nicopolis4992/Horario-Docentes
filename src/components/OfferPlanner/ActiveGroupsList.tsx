import React from 'react';
import { CourseGroup, Teacher, Classroom } from '../../../types';
import { Users, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../../../store';

interface ActiveGroupsListProps {
    groups: CourseGroup[];
    subjectId: string;
    subjectCredits: number;
    teachers: Teacher[];
    classrooms: Classroom[];
    getTeacherLoad: (teacherId: string, excludeGroupId?: string) => number;
    onUpdateTeacher: (group: CourseGroup, teacherId: string) => void;
    onUpdateRoom: (group: CourseGroup, roomId: string) => void;
    onDeleteClick: (groupId: string) => void;
}

const ActiveGroupsList = ({
    groups,
    subjectId,
    subjectCredits,
    teachers,
    classrooms,
    getTeacherLoad,
    onUpdateTeacher,
    onUpdateRoom,
    onDeleteClick
}: ActiveGroupsListProps) => {
    const { dispatch } = useAppStore();

    if (groups.length === 0) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Paralelos Activos ({groups.length})</h3>
                <button
                    onClick={() => {
                        dispatch({
                            type: 'ADD_COURSE_GROUP',
                            payload: {
                                id: crypto.randomUUID(),
                                subjectId: subjectId,
                                name: `Nuevo Grupo`,
                                studentCount: 0,
                                totalHours: subjectCredits,
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
                {groups.map(group => {
                    const assignedTeacher = teachers.find(t => t.id === group.teacherId);
                    const baseLoad = assignedTeacher ? getTeacherLoad(assignedTeacher.id, group.id) : 0;
                    const projectedLoadIfKept = baseLoad + group.totalHours;
                    const isOverloaded = assignedTeacher && projectedLoadIfKept > assignedTeacher.maxHours;

                    return (
                        <div key={group.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center transition-all hover:border-slate-300">
                            <div className="min-w-[120px]">
                                <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => dispatch({
                                        type: 'UPDATE_COURSE_GROUP',
                                        payload: { ...group, name: e.target.value }
                                    })}
                                    className="font-bold text-slate-800 text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full transition-colors"
                                    placeholder="Nombre del grupo"
                                />
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
                                    onChange={(e) => onUpdateTeacher(group, e.target.value)}
                                >
                                    <option value="">-- Sin Asignar --</option>
                                    {teachers.map(t => {
                                        const tBaseLoad = getTeacherLoad(t.id, group.id);
                                        const tProjected = tBaseLoad + group.totalHours;
                                        const willBeOverloaded = tProjected > t.maxHours;
                                        const currentLoad = getTeacherLoad(t.id);

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
                                    onChange={(e) => onUpdateRoom(group, e.target.value)}
                                >
                                    <option value="">-- Cualquiera --</option>
                                    {classrooms.map(c => {
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
                                onClick={() => onDeleteClick(group.id)}
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
    );
};

export default ActiveGroupsList;
