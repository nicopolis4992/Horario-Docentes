import React, { useState } from 'react';
import { Subject } from '../../../types';
import { AREA_CONFIG } from '../../../utils';
import { Sparkles, Trash2, CheckCircle2, Search, Users, ChevronLeft, Clock } from 'lucide-react';
import { useAppStore } from '../../../store';
import toast from 'react-hot-toast';

interface SidebarProps {
    selectedSubjectId: string | null;
    onSelectSubject: (id: string) => void;
    onBulkGenerate: () => void;
}

type FilterMode = 'materias' | 'docentes';

const SubjectListSidebar = ({ selectedSubjectId, onSelectSubject, onBulkGenerate }: SidebarProps) => {
    const { state, dispatch } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<FilterMode>('materias');
    const [selectedFilterTeacherId, setSelectedFilterTeacherId] = useState<string | null>(null);

    // --- Materias mode filtering ---
    const filteredSubjects = state.subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Docentes mode helpers ---
    const getTeacherGroupCount = (teacherId: string) =>
        state.courseGroups.filter(g => g.teacherId === teacherId).length;

    const getTeacherLoad = (teacherId: string) =>
        state.courseGroups
            .filter(g => g.teacherId === teacherId)
            .reduce((acc, g) => acc + g.totalHours, 0);

    const filteredTeachers = state.teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Subjects assigned to the selected teacher (via courseGroups)
    const teacherSubjects = selectedFilterTeacherId
        ? (() => {
            const groupsForTeacher = state.courseGroups.filter(g => g.teacherId === selectedFilterTeacherId);
            const subjectIds = Array.from(new Set(groupsForTeacher.map(g => g.subjectId)));
            return state.subjects
                .filter(s => subjectIds.includes(s.id))
                .filter(s =>
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.area.toLowerCase().includes(searchTerm.toLowerCase())
                );
        })()
        : [];

    const handleClearAll = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Borrar TODA la oferta y horarios?</span>
                <span className="text-sm text-slate-600">Esta acción no se puede deshacer.</span>
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
                            dispatch({ type: 'CLEAR_ALL_COURSE_GROUPS' });
                            toast.dismiss(t.id);
                            toast.success('Oferta académica reseteada por completo.');
                        }}
                    >
                        Sí, borrar todo
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleModeChange = (mode: FilterMode) => {
        setFilterMode(mode);
        setSearchTerm('');
        setSelectedFilterTeacherId(null);
    };

    const handleBackToTeachers = () => {
        setSelectedFilterTeacherId(null);
        setSearchTerm('');
    };

    // --- Render subject list item (reused in both modes) ---
    const renderSubjectItem = (subject: Subject) => {
        const groups = state.courseGroups.filter(g => g.subjectId === subject.id);
        const totalPlannedStudents = groups.reduce((acc, g) => acc + g.studentCount, 0);
        const isFullyPlanned = totalPlannedStudents >= subject.projectedStudents;
        const config = AREA_CONFIG[subject.area];

        // If in docentes mode, show how many groups belong to this teacher
        const teacherGroupCount = selectedFilterTeacherId
            ? groups.filter(g => g.teacherId === selectedFilterTeacherId).length
            : groups.length;

        return (
            <button
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
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
                        {teacherGroupCount} {teacherGroupCount === 1 ? 'grupo' : 'grupos'}
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
    };

    return (
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 max-h-[400px] lg:max-h-none">
            <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800">
                            {filterMode === 'materias' ? 'Materias Ofertadas' : 'Por Docente'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {filterMode === 'materias' ? 'Planifica los paralelos aquí.' : 'Filtra materias por docente.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <button
                            onClick={onBulkGenerate}
                            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm"
                            title="Generar paralelos para todas las materias pendientes"
                        >
                            <Sparkles size={12} />
                            Generar Todo
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 border border-red-100 px-1 py-1 rounded text-[10px] font-bold"
                        >
                            <Trash2 size={12} />
                            Borrar Todo
                        </button>
                    </div>
                </div>

                {/* Toggle: Materias / Docentes */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => handleModeChange('materias')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'materias'
                            ? 'bg-white shadow text-blue-700'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Materias
                    </button>
                    <button
                        onClick={() => handleModeChange('docentes')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'docentes'
                            ? 'bg-white shadow text-blue-700'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Docentes
                    </button>
                </div>

                {/* Back button when viewing teacher's subjects */}
                {filterMode === 'docentes' && selectedFilterTeacherId && (
                    <button
                        onClick={handleBackToTeachers}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
                    >
                        <ChevronLeft size={14} />
                        Volver a docentes
                    </button>
                )}

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder={
                            filterMode === 'materias'
                                ? 'Buscar materia o área...'
                                : selectedFilterTeacherId
                                    ? 'Buscar materia...'
                                    : 'Buscar docente...'
                        }
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {/* === MATERIAS MODE === */}
                {filterMode === 'materias' && (
                    filteredSubjects.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No se encontraron materias.</div>
                    ) : (
                        filteredSubjects.map(subject => renderSubjectItem(subject))
                    )
                )}

                {/* === DOCENTES MODE: Teacher List === */}
                {filterMode === 'docentes' && !selectedFilterTeacherId && (
                    filteredTeachers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No se encontraron docentes.</div>
                    ) : (
                        filteredTeachers.map(teacher => {
                            const groupCount = getTeacherGroupCount(teacher.id);
                            const load = getTeacherLoad(teacher.id);
                            const isOverloaded = load > teacher.maxHours;

                            return (
                                <button
                                    key={teacher.id}
                                    onClick={() => { setSelectedFilterTeacherId(teacher.id); setSearchTerm(''); }}
                                    className="w-full text-left p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                            style={{ backgroundColor: teacher.color }}
                                        >
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-slate-700 truncate">{teacher.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Users size={10} />
                                                    {groupCount} {groupCount === 1 ? 'paralelo' : 'paralelos'}
                                                </span>
                                                <span className={`text-xs font-mono font-medium flex items-center gap-1 ${isOverloaded ? 'text-red-600' : 'text-slate-500'}`}>
                                                    <Clock size={10} />
                                                    {load}/{teacher.maxHours}h
                                                    {isOverloaded && ' ⚠️'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )
                )}

                {/* === DOCENTES MODE: Teacher's Subjects === */}
                {filterMode === 'docentes' && selectedFilterTeacherId && (
                    teacherSubjects.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">Este docente no tiene paralelos asignados.</div>
                    ) : (
                        teacherSubjects.map(subject => renderSubjectItem(subject))
                    )
                )}
            </div>
        </div>
    );
};

export default SubjectListSidebar;
