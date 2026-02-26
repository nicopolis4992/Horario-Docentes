import React, { useState } from 'react';
import { useAppStore } from '../../../store';
import { Subject, SubjectArea, DayOfWeek, ClassroomType } from '../../../types';
import {
    Plus,
    Edit,
    Trash2,
    BookOpen,
    Clapperboard,
    Sparkles,
    Calculator,
    MousePointer2,
    Clock,
    Users,
    School,
    Settings,
    Check
} from 'lucide-react';
import { AREA_CONFIG, CLASSROOM_CONFIG, generateTimeSlots } from '../../../utils';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

// Extension for form state
interface SubjectFormData extends Partial<Subject> {
    sessionPatternString?: string;
}

const SubjectsView = () => {
    const { state, dispatch } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    // Controls if we are showing the custom input field for credits
    const [isCustomCreditsMode, setIsCustomCreditsMode] = useState(false);

    const [formData, setFormData] = useState<SubjectFormData>({
        name: '',
        credits: 2,
        projectedStudents: 30,
        area: 'Audiovisual',
        preferredDays: []
    });

    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                ...subject,
                preferredDays: subject.preferredDays || [],
                sessionPatternString: subject.sessionPattern ? subject.sessionPattern.join(', ') : subject.credits.toString()
            });
            setIsCustomCreditsMode(![1, 2, 3].includes(subject.credits));
        } else {
            setEditingSubject(null);
            setFormData({
                name: '',
                credits: 2,
                projectedStudents: 30,
                area: 'Audiovisual',
                preferredDays: [],
                sessionPatternString: '2'
            });
            setIsCustomCreditsMode(false);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        const sessionPattern = formData.sessionPatternString
            ? formData.sessionPatternString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            : [formData.credits || 0];

        const patternSum = sessionPattern.reduce((acc, n) => acc + n, 0);
        if (patternSum !== (formData.credits || 0)) {
            alert(`La suma del patrón de sesiones (${patternSum}h) debe coincidir con el total de horas (${formData.credits}h).`);
            return;
        }

        const { sessionPatternString, ...rest } = formData;
        const payload = {
            ...(editingSubject || { id: crypto.randomUUID() }),
            ...rest,
            sessionPattern
        } as Subject;

        if (editingSubject) {
            dispatch({ type: 'UPDATE_SUBJECT', payload });
        } else {
            dispatch({ type: 'ADD_SUBJECT', payload });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Eliminar esta materia?</span>
                <span className="text-sm text-slate-600">Se borrarán sus paralelos y asignaciones. Esta acción no se puede deshacer.</span>
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
                            dispatch({ type: 'DELETE_SUBJECT', payload: id });
                            toast.dismiss(t.id);
                            toast.success('Materia, paralelos y horarios eliminados.');
                        }}
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const getAreaIcon = (area: SubjectArea) => {
        switch (area) {
            case 'Audiovisual': return Clapperboard;
            case 'Animación': return Sparkles;
            case 'Interactividad': return MousePointer2;
            default: return BookOpen;
        }
    };

    const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Materias</h2>
                    <p className="text-slate-500 text-sm">Define el plan académico y sus áreas.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Nueva Materia</span>
                </button>
            </div>

            <div className="space-y-10">
                {(() => {
                    if (state.subjects.length === 0) {
                        return (
                            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No hay materias registradas.</p>
                                <button onClick={() => handleOpenModal()} className="text-emerald-600 hover:underline mt-2">
                                    Crear la primera
                                </button>
                            </div>
                        );
                    }

                    const grouped = new Map<number | 'none', typeof state.subjects>();
                    state.subjects.forEach(s => {
                        const key = s.semester ?? 'none';
                        if (!grouped.has(key)) grouped.set(key, []);
                        grouped.get(key)!.push(s);
                    });

                    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
                        if (a[0] === 'none') return 1;
                        if (b[0] === 'none') return -1;
                        return (a[0] as number) - (b[0] as number);
                    });

                    return sortedGroups.map(([semester, subjects]) => (
                        <div key={semester} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
                                {semester === 'none' ? 'Sin Semestre Asignado' : `Semestre ${semester}`}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subjects.map((subject) => {
                                    const config = AREA_CONFIG[subject.area] || AREA_CONFIG['Audiovisual'];
                                    const AreaIcon = getAreaIcon(subject.area);

                                    return (
                                        <div key={subject.id} className={`bg-white rounded-xl shadow-sm border ${config.border} p-5 hover:shadow-md transition-shadow relative group`}>
                                            <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(subject)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex items-start space-x-4 mb-4">
                                                <div className={`w-10 h-10 rounded-lg ${config.bg} ${config.iconColor} flex items-center justify-center shrink-0`}>
                                                    <AreaIcon size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{subject.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`text-[10px] uppercase font-bold tracking-wider ${config.iconColor}`}>
                                                            {subject.area}
                                                        </div>
                                                        {subject.semester && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                                                                Sem {subject.semester}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preferred Days Display */}
                                            {subject.preferredDays && subject.preferredDays.length > 0 && (
                                                <div className="mb-4 flex flex-wrap gap-1">
                                                    {subject.preferredDays.map(day => (
                                                        <span key={day} className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                                                            {day.substring(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase font-semibold">Duración</span>
                                                    <div className="flex items-center space-x-1 text-slate-700 font-medium">
                                                        <Clock size={14} className="text-slate-400" />
                                                        <span>{subject.credits} horas</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase font-semibold">Proyección</span>
                                                    <div className="flex items-center space-x-1 text-slate-700 font-medium">
                                                        <Users size={14} className="text-slate-400" />
                                                        <span>{subject.projectedStudents} est.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSubject ? 'Editar Materia' : 'Nueva Materia'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Materia</label>
                            <input
                                autoFocus
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Edición de Video"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Semestre</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white"
                                value={formData.semester || ''}
                                onChange={e => setFormData({ ...formData, semester: e.target.value ? parseInt(e.target.value) : undefined })}
                            >
                                <option value="">Sin semestre</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                    <option key={s} value={s}>Semestre {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Eje / Área</label>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(AREA_CONFIG) as SubjectArea[]).map((area) => {
                                const config = AREA_CONFIG[area];
                                const isSelected = formData.area === area;
                                return (
                                    <button
                                        key={area}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, area })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${isSelected
                                            ? `${config.bg} ${config.border} ${config.iconColor} ring-1 ring-offset-1 ring-${config.color.split('-')[1]}-400`
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isSelected ? config.iconColor.replace('text', 'bg') : 'bg-slate-300'}`}></div>
                                        {area}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <School size={16} className="text-slate-400" /> Preferencias de Aulas
                        </h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipos de Aula Permitidos</label>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(CLASSROOM_CONFIG) as ClassroomType[]).map(type => {
                                    const isSelected = formData.allowedClassroomTypes?.includes(type);
                                    const config = CLASSROOM_CONFIG[type];
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.allowedClassroomTypes || [];
                                                const next = isSelected
                                                    ? current.filter(t => t !== type)
                                                    : [...current, type];
                                                setFormData({ ...formData, allowedClassroomTypes: next });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected
                                                ? `${config.bg} ${config.border} ${config.color}`
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            {isSelected && <Check size={12} />}
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aulas Específicas (Opcional)</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                {state.classrooms.map(c => {
                                    const isSelected = formData.allowedClassroomIds?.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.allowedClassroomIds || [];
                                                const next = isSelected
                                                    ? current.filter(id => id !== c.id)
                                                    : [...current, c.id];
                                                setFormData({ ...formData, allowedClassroomIds: next });
                                            }}
                                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isSelected
                                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            {c.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Docente Preferido (Opcional)</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-slate-900"
                                value={formData.preferredTeacherId || ''}
                                onChange={e => setFormData({ ...formData, preferredTeacherId: e.target.value })}
                            >
                                <option value="">-- Sin asignar --</option>
                                {state.teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Días Preferidos (Opcional)</label>
                        <div className="flex flex-wrap gap-2">
                            {days.map(day => {
                                const isSelected = formData.preferredDays?.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            const current = formData.preferredDays || [];
                                            const next = isSelected
                                                ? current.filter(d => d !== day)
                                                : [...current, day];
                                            setFormData({ ...formData, preferredDays: next });
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Si no selecciona ninguno, se asume que puede dictarse cualquier día.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Horas por Sesión</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3].map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, credits: h });
                                        setIsCustomCreditsMode(false);
                                    }}
                                    className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-all ${!isCustomCreditsMode && formData.credits === h
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="font-bold mr-1">{h}</span>
                                    {!isCustomCreditsMode && formData.credits === h && <Check size={14} className="ml-0.5" />}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsCustomCreditsMode(true)}
                                className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-all ${isCustomCreditsMode
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                title="Personalizado"
                            >
                                <Settings size={16} />
                            </button>
                        </div>

                        {isCustomCreditsMode && (
                            <div className="mt-3 animate-fade-in">
                                <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-white">
                                    <input
                                        type="number"
                                        min="1"
                                        max="8"
                                        className="w-full outline-none text-slate-900 bg-transparent placeholder-slate-400"
                                        value={formData.credits || 0}
                                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                        placeholder="Ingrese horas"
                                    />
                                    <span className="text-slate-400 text-sm ml-2">Horas</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Patrón de Sesiones (Opcional)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                            value={formData.sessionPatternString || ''}
                            onChange={e => setFormData({ ...formData, sessionPatternString: e.target.value })}
                            placeholder="Ej: 2, 1 para una materia de 3h"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Define cómo se dividen las horas. Ej: "2, 1" crea un bloque de 2h y uno de 1h.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estudiantes Proyectados</label>
                        <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-white">
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full outline-none text-slate-900 bg-transparent placeholder-slate-400"
                                value={formData.projectedStudents || 0}
                                onChange={e => setFormData({ ...formData, projectedStudents: parseInt(e.target.value) || 0 })}
                            />
                            <span className="text-slate-400 text-sm ml-2">Alumnos</span>
                        </div>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium shadow-sm"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SubjectsView;
