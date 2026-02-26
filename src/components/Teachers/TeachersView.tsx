import React, { useState } from 'react';
import { useAppStore } from '../../../store';
import { Teacher, DayOfWeek } from '../../../types';
import {
    Plus,
    Edit,
    Trash2,
    Mail,
    Clock,
    Users,
    Settings,
    Layers,
    CalendarDays,
    X
} from 'lucide-react';
import { generateTimeSlots } from '../../../utils';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

const TeachersView = () => {
    const { state, dispatch } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Teacher>>({
        name: '',
        maxHours: 21,
        color: '#3B82F6',
        unavailableSlots: [],
        allowedSubjectIds: []
    });

    // Controls if we are showing the custom input field
    const [isCustomHoursMode, setIsCustomHoursMode] = useState(false);
    const [activeRightTab, setActiveRightTab] = useState<'specialties' | 'availability'>('specialties');

    // Matrix helpers
    const timeSlots = generateTimeSlots();
    const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const colors = [
        '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
        '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
    ];

    const handleOpenModal = (teacher?: Teacher) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                ...teacher,
                allowedSubjectIds: teacher.allowedSubjectIds || []
            });
            setIsCustomHoursMode(![15, 21].includes(teacher.maxHours));
        } else {
            setEditingTeacher(null);
            setFormData({
                name: '',
                maxHours: 21,
                color: colors[Math.floor(Math.random() * colors.length)],
                unavailableSlots: [],
                allowedSubjectIds: []
            });
            setIsCustomHoursMode(false);
        }
        setIsModalOpen(true);
        setActiveRightTab('specialties');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingTeacher) {
            dispatch({
                type: 'UPDATE_TEACHER',
                payload: { ...editingTeacher, ...formData } as Teacher
            });
        } else {
            dispatch({
                type: 'ADD_TEACHER',
                payload: {
                    id: crypto.randomUUID(),
                    ...(formData as Teacher)
                } as Teacher
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Eliminar este docente?</span>
                <span className="text-sm text-slate-600">Se borrarán sus asignaciones. Esta acción no se puede deshacer.</span>
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
                            dispatch({ type: 'DELETE_TEACHER', payload: id });
                            toast.dismiss(t.id);
                            toast.success('Docente eliminado y horarios liberados.');
                        }}
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    // Matrix Logic
    const toggleSlotAvailability = (day: DayOfWeek, slotId: string) => {
        const key = `${day}-${slotId}`;
        const currentUnavailable = formData.unavailableSlots || [];
        let newUnavailable;
        if (currentUnavailable.includes(key)) {
            newUnavailable = currentUnavailable.filter(k => k !== key);
        } else {
            newUnavailable = [...currentUnavailable, key];
        }
        setFormData({ ...formData, unavailableSlots: newUnavailable });
    };

    const toggleDayAvailability = (day: DayOfWeek) => {
        const dayKeys = timeSlots.map(slot => `${day}-${slot.id}`);
        const currentUnavailable = formData.unavailableSlots || [];
        const allBlocked = dayKeys.every(key => currentUnavailable.includes(key));
        let newUnavailable;
        if (allBlocked) {
            newUnavailable = currentUnavailable.filter(k => !dayKeys.includes(k));
        } else {
            const missing = dayKeys.filter(k => !currentUnavailable.includes(k));
            newUnavailable = [...currentUnavailable, ...missing];
        }
        setFormData({ ...formData, unavailableSlots: newUnavailable });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Docentes</h2>
                    <p className="text-slate-500 text-sm">Gestiona la planta docente y sus cargas horarias.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Nuevo Docente</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.teachers.map((teacher) => {
                    const teacherAssignments = state.assignments.filter(a => a.teacherId === teacher.id);
                    const assignedHours = teacherAssignments.length;
                    const uniqueSubjectIds = Array.from(new Set(teacherAssignments.map(a => a.subjectId)));
                    const subjectNames = uniqueSubjectIds
                        .map(sid => state.subjects.find(s => s.id === sid)?.name)
                        .filter((n): n is string => !!n);

                    return (
                        <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(teacher)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(teacher.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                                    style={{ backgroundColor: teacher.color }}
                                >
                                    {teacher.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 truncate">{teacher.name}</h3>
                                    {/* Specialty Badges */}
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {teacher.allowedSubjectIds?.map(sid => {
                                            const s = state.subjects.find(sub => sub.id === sid);
                                            if (!s) return null;
                                            return (
                                                <span key={sid} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                                                    {s.name}
                                                </span>
                                            );
                                        })}
                                        {(!teacher.allowedSubjectIds || teacher.allowedSubjectIds.length === 0) && (
                                            <span className="text-[9px] text-slate-400 italic">Sin especialidades</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2 text-sm text-slate-600 shrink-0">
                                    <Clock size={16} className="text-slate-400" />
                                    <span>
                                        <span className={assignedHours > teacher.maxHours ? "text-red-600 font-bold" : "font-semibold text-slate-800"}>
                                            {assignedHours}
                                        </span>
                                        <span className="text-slate-400 mx-1">/</span>
                                        <span className="text-slate-500">{teacher.maxHours}h</span>
                                    </span>
                                </div>

                                <div className="flex-1 flex justify-end">
                                    {subjectNames.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {subjectNames.slice(0, 2).map(name => (
                                                <span key={name} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 max-w-[100px] truncate">
                                                    {name}
                                                </span>
                                            ))}
                                            {subjectNames.length > 2 && (
                                                <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-200">
                                                    +{subjectNames.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">Sin asignación</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}
                maxWidth="max-w-5xl"
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-5">
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                                    <Users size={16} className="mr-2" /> Información Personal
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                        <input
                                            autoFocus type="text" required
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-slate-200 rounded-lg">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                                    <Clock size={16} className="mr-2 text-slate-400" /> Carga Horaria
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[15, 21].map((hours) => (
                                        <button
                                            key={hours} type="button"
                                            onClick={() => { setFormData({ ...formData, maxHours: hours }); setIsCustomHoursMode(false); }}
                                            className={`p-2 border rounded-lg text-center ${!isCustomHoursMode && formData.maxHours === hours ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                        >
                                            <span className="block text-lg font-bold">{hours}h</span>
                                        </button>
                                    ))}
                                    <button
                                        type="button" onClick={() => setIsCustomHoursMode(true)}
                                        className={`p-2 border rounded-lg flex flex-col items-center justify-center ${isCustomHoursMode ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                    >
                                        <Settings size={18} />
                                    </button>
                                </div>
                                {isCustomHoursMode && (
                                    <input
                                        type="number" className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg outline-none"
                                        value={formData.maxHours || 0}
                                        onChange={(e) => setFormData({ ...formData, maxHours: parseInt(e.target.value) || 0 })}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map((c) => (
                                        <button
                                            key={c} type="button" onClick={() => setFormData({ ...formData, color: c })}
                                            className={`w-6 h-6 rounded-full ${formData.color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                            {/* Pestañas */}
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveRightTab('specialties')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeRightTab === 'specialties' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Layers size={16} /> Especialidades
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveRightTab('availability')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeRightTab === 'availability' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <CalendarDays size={16} /> Disponibilidad
                                </button>
                            </div>

                            {/* Contenido de Especialidades */}
                            {activeRightTab === 'specialties' && (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {state.subjects.map(subject => {
                                            const isChecked = formData.allowedSubjectIds?.includes(subject.id);
                                            return (
                                                <label key={subject.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                                                    <input
                                                        type="checkbox" checked={isChecked}
                                                        onChange={() => {
                                                            const current = formData.allowedSubjectIds || [];
                                                            const next = isChecked ? current.filter(id => id !== subject.id) : [...current, subject.id];
                                                            setFormData({ ...formData, allowedSubjectIds: next });
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm truncate">{subject.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Contenido de Disponibilidad */}
                            {activeRightTab === 'availability' && (
                                <div className="flex-1 overflow-auto">
                                    <div className="bg-white rounded-lg border border-slate-200 max-h-[500px] overflow-auto">
                                        <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-px bg-slate-100">
                                            <div className="bg-slate-50 sticky top-0 left-0 z-20"></div>
                                            {days.map(day => (
                                                <button key={day} type="button" onClick={() => toggleDayAvailability(day)} className="bg-slate-50 p-2 text-center text-[10px] font-bold sticky top-0 z-10">{day}</button>
                                            ))}
                                            {timeSlots.map(slot => (
                                                <React.Fragment key={slot.id}>
                                                    <div className="bg-slate-50 p-1 text-[9px] font-mono text-slate-500 text-right pr-2">{slot.start}</div>
                                                    {days.map(day => {
                                                        const isUnavailable = formData.unavailableSlots?.includes(`${day}-${slot.id}`);
                                                        return (
                                                            <button
                                                                key={`${day}-${slot.id}`} type="button"
                                                                onClick={() => toggleSlotAvailability(day, slot.id)}
                                                                className={`h-8 border-t border-l border-slate-100 flex items-center justify-center ${isUnavailable ? 'bg-red-50' : 'bg-white'}`}
                                                            >
                                                                {isUnavailable && <X size={12} className="text-red-300" />}
                                                            </button>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">
                            {editingTeacher ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TeachersView;
