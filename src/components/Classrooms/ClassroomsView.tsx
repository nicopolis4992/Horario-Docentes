import React, { useState } from 'react';
import { useAppStore } from '../../../store';
import { Classroom, ClassroomType } from '../../../types';
import {
    Plus,
    Edit,
    Trash2,
    Monitor,
    MonitorPlay,
    Armchair,
    School
} from 'lucide-react';
import { CLASSROOM_CONFIG } from '../../../utils';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

const ClassroomsView = () => {
    const { state, dispatch } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);

    const [formData, setFormData] = useState<Partial<Classroom>>({
        name: '',
        type: 'Aula',
        recommendedCapacity: 30,
        maxCapacity: 40
    });

    const handleOpenModal = (room?: Classroom) => {
        if (room) {
            setEditingRoom(room);
            setFormData(room);
        } else {
            setEditingRoom(null);
            setFormData({ name: '', type: 'Aula', recommendedCapacity: 30, maxCapacity: 40 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        const payload = {
            ...(editingRoom || { id: crypto.randomUUID() }),
            ...formData
        } as Classroom;

        if (editingRoom) {
            dispatch({ type: 'UPDATE_CLASSROOM', payload });
        } else {
            dispatch({ type: 'ADD_CLASSROOM', payload });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-800">¿Eliminar esta aula?</span>
                <span className="text-sm text-slate-600">Se borrarán sus horarios asignados. Esta acción no se puede deshacer.</span>
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
                            dispatch({ type: 'DELETE_CLASSROOM', payload: id });
                            toast.dismiss(t.id);
                            toast.success('Aula eliminada y horarios liberados.');
                        }}
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const getClassroomIcon = (type: ClassroomType) => {
        switch (type) {
            case 'Lab PC': return Monitor;
            case 'Lab Mac': return MonitorPlay;
            default: return Armchair;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Aulas</h2>
                    <p className="text-slate-500 text-sm">Gestiona espacios físicos y sus capacidades.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Nueva Aula</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.classrooms.map((room) => {
                    const config = CLASSROOM_CONFIG[room.type] || CLASSROOM_CONFIG['Aula'];
                    const Icon = getClassroomIcon(room.type);

                    return (
                        <div key={room.id} className={`bg-white rounded-xl shadow-sm border ${config.border} p-5 hover:shadow-md transition-shadow relative group`}>
                            <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(room)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(room.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start space-x-4 mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.iconColor}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800">{room.name}</h3>
                                    <p className={`text-xs font-semibold ${config.iconColor}`}>{room.type}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Recomendado</span>
                                    <span className="font-semibold text-slate-800">{room.recommendedCapacity}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Máximo</span>
                                    <span className="font-semibold text-red-600">{room.maxCapacity}</span>
                                </div>

                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                    <div
                                        className={`h-full ${config.iconColor.replace('text', 'bg')}`}
                                        style={{ width: `${(room.recommendedCapacity / room.maxCapacity) * 100}%` }}
                                        title="Recomendado"
                                    />
                                    <div className="bg-red-200 h-full flex-1" title="Zona Crítica" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {state.classrooms.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <School size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No hay aulas registradas.</p>
                        <button onClick={() => handleOpenModal()} className="text-indigo-600 hover:underline mt-2">
                            Registrar espacio
                        </button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRoom ? 'Editar Aula' : 'Nueva Aula'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Código</label>
                        <input
                            autoFocus
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Aula 101, Lab Física"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Espacio</label>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(CLASSROOM_CONFIG) as ClassroomType[]).map((type) => {
                                const config = CLASSROOM_CONFIG[type];
                                const isSelected = formData.type === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${isSelected
                                            ? `${config.bg} ${config.border} ${config.iconColor} ring-1 ring-offset-1 ring-${config.color.split('-')[1]}-400`
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isSelected ? config.iconColor.replace('text', 'bg') : 'bg-slate-300'}`}></div>
                                        <span className="font-medium">{type}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cap. Recomendada</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                                value={formData.recommendedCapacity || 0}
                                onChange={e => setFormData({ ...formData, recommendedCapacity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cap. Máxima</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                                value={formData.maxCapacity || 0}
                                onChange={e => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">
                        * La capacidad recomendada se usará para alertas preventivas.
                    </p>

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
                            className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium shadow-sm"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ClassroomsView;
