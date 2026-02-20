import React, { useMemo } from 'react';
import { useAppStore } from '../../../store';
import { generateTimeSlots } from '../../../utils';
import {
    Users,
    BookOpen,
    School,
    CalendarDays,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    BarChart3
} from 'lucide-react';
import StatCard from './StatCard';

const DashboardView = () => {
    const { state } = useAppStore();
    const timeSlots = generateTimeSlots();

    // --- Computed Stats ---
    const stats = useMemo(() => {
        const totalTeachers = state.teachers.length;
        const totalClassrooms = state.classrooms.length;
        const totalSubjects = state.subjects.length;
        const totalStudents = state.subjects.reduce((acc, s) => acc + s.projectedStudents, 0);
        const totalCapacity = state.classrooms.reduce((acc, c) => acc + c.maxCapacity, 0);

        // Assignment metrics
        const totalAssignments = state.assignments.length;
        const totalGroupHours = state.courseGroups.reduce((acc, g) => acc + g.totalHours, 0);
        const assignedHours = totalAssignments; // Each assignment = 1 hour slot
        const assignmentPercent = totalGroupHours > 0
            ? Math.round((assignedHours / totalGroupHours) * 100)
            : 0;

        // Classroom occupation: unique classrooms that have at least 1 assignment
        const usedClassroomIds = new Set(state.assignments.map(a => a.classroomId));
        const classroomOccupationPercent = totalClassrooms > 0
            ? Math.round((usedClassroomIds.size / totalClassrooms) * 100)
            : 0;

        // Teacher load
        const teacherLoads = state.teachers.map(t => {
            const hours = state.assignments.filter(a => a.teacherId === t.id).length;
            return { ...t, assignedHours: hours, percent: t.maxHours > 0 ? Math.round((hours / t.maxHours) * 100) : 0 };
        });
        const teachersAtCapacity = teacherLoads.filter(t => t.assignedHours >= t.maxHours).length;
        const teachersOverloaded = teacherLoads.filter(t => t.assignedHours > t.maxHours).length;
        const avgLoad = totalTeachers > 0
            ? Math.round(teacherLoads.reduce((acc, t) => acc + t.percent, 0) / totalTeachers)
            : 0;

        // Course groups progress
        const totalGroups = state.courseGroups.length;
        const completedGroups = state.courseGroups.filter(g => {
            const assigned = state.assignments.filter(a => a.courseGroupId === g.id).length;
            return assigned >= g.totalHours;
        }).length;

        return {
            totalTeachers, totalClassrooms, totalSubjects, totalStudents, totalCapacity,
            totalAssignments, totalGroupHours, assignedHours, assignmentPercent,
            classroomOccupationPercent, usedClassroomIds,
            teacherLoads, teachersAtCapacity, teachersOverloaded, avgLoad,
            totalGroups, completedGroups
        };
    }, [state]);

    // Calculate slots info
    const firstSlot = timeSlots[0]?.start;
    const lastSlot = timeSlots[timeSlots.length - 1]?.end;

    const teacherSubtext = stats.teachersOverloaded > 0
        ? `⚠️ ${stats.teachersOverloaded} sobrecargado${stats.teachersOverloaded > 1 ? 's' : ''}`
        : stats.teachersAtCapacity > 0
            ? `${stats.teachersAtCapacity} con carga completa`
            : 'Capacidad disponible';

    const groupsSubtext = stats.totalGroups > 0
        ? `${stats.completedGroups}/${stats.totalGroups} paralelos completos`
        : 'Sin paralelos generados';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Panel General</h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Semestre 2026-1
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Docentes Activos"
                    value={stats.totalTeachers}
                    icon={Users}
                    color="bg-blue-500"
                    subtext={teacherSubtext}
                />
                <StatCard
                    title="Materias Ofertadas"
                    value={stats.totalSubjects}
                    icon={BookOpen}
                    color="bg-emerald-500"
                    subtext={`${stats.totalStudents} estudiantes proyectados`}
                />
                <StatCard
                    title="Aulas Disponibles"
                    value={stats.totalClassrooms}
                    icon={School}
                    color="bg-indigo-500"
                    subtext={`Capacidad total: ${stats.totalCapacity}`}
                />
                <StatCard
                    title="Bloques Horarios"
                    value={timeSlots.length}
                    icon={CalendarDays}
                    color="bg-amber-500"
                    subtext={`De ${firstSlot} a ${lastSlot}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Planning Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-slate-500" />
                        Estado de la Planificación
                    </h3>
                    <div className="space-y-5">
                        {/* Assignment Progress */}
                        <div>
                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                                <span className="font-medium">Horas Asignadas</span>
                                <span className="font-bold">{stats.assignedHours}/{stats.totalGroupHours}h ({stats.assignmentPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ${stats.assignmentPercent >= 100 ? 'bg-emerald-500' : stats.assignmentPercent >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(stats.assignmentPercent, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Classroom Occupation */}
                        <div>
                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                                <span className="font-medium">Aulas en Uso</span>
                                <span className="font-bold">{stats.usedClassroomIds.size}/{stats.totalClassrooms} ({stats.classroomOccupationPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(stats.classroomOccupationPercent, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Average Teacher Load */}
                        <div>
                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                                <span className="font-medium">Carga Docente Promedio</span>
                                <span className="font-bold">{stats.avgLoad}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ${stats.avgLoad > 90 ? 'bg-red-500' : stats.avgLoad > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(stats.avgLoad, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teacher Load Overview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-slate-500" />
                        Carga por Docente
                    </h3>
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                        {stats.teacherLoads.length > 0 ? (
                            stats.teacherLoads
                                .sort((a, b) => b.percent - a.percent)
                                .map(t => (
                                    <div key={t.id} className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                            style={{ backgroundColor: t.color }}
                                        >
                                            {t.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-xs font-medium text-slate-700 truncate">{t.name}</span>
                                                <span className={`text-[10px] font-bold ml-2 shrink-0 ${t.percent > 100 ? 'text-red-600' : t.percent >= 100 ? 'text-amber-600' : 'text-slate-500'
                                                    }`}>
                                                    {t.assignedHours}/{t.maxHours}h
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-500 ${t.percent > 100 ? 'bg-red-500' : t.percent >= 100 ? 'bg-amber-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${Math.min(t.percent, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        {t.percent >= 100 && (
                                            t.percent > 100
                                                ? <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                                : <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                        )}
                                    </div>
                                ))
                        ) : (
                            <div className="text-sm text-slate-400 italic text-center py-4">No hay docentes registrados.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
