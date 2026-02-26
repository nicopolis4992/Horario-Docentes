import React from 'react';
import {
    Clock,
    AlertTriangle,
    Info,
    CheckCircle2
} from 'lucide-react';
import Modal from '../Common/Modal';
import {
    DayOfWeek,
    TimeSlot,
    AppState
} from '../../../types';
import { PendingSession } from './useScheduleLogic';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCell: { day: DayOfWeek; slot: TimeSlot } | null;
    assignMode: 'group' | 'manual';
    selectedGroupId: string;
    formSubjectId: string;
    formTeacherId: string;
    formClassroomId: string;
    editingAssignmentIds: string[] | null;
    pendingSessions: PendingSession[];
    state: AppState;
    viewMode: 'teacher' | 'classroom';
    selectedTeacherId: string | null;
    selectedClassroomId: string | null;
    onAssignModeChange: (mode: 'group' | 'manual') => void;
    onGroupSelect: (sessionId: string) => void;
    onSubjectChange: (id: string) => void;
    onTeacherChange: (id: string) => void;
    onClassroomChange: (id: string) => void;
    onSave: (e: React.FormEvent) => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
    isOpen,
    onClose,
    selectedCell,
    assignMode,
    selectedGroupId,
    formSubjectId,
    formTeacherId,
    formClassroomId,
    editingAssignmentIds,
    pendingSessions,
    state,
    viewMode,
    selectedTeacherId,
    selectedClassroomId,
    onAssignModeChange,
    onGroupSelect,
    onSubjectChange,
    onTeacherChange,
    onClassroomChange,
    onSave
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Asignar Materia"
        >
            {editingAssignmentIds && editingAssignmentIds.length > 0 ? null : (
                <div className="mb-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Clock size={16} />
                    <span>
                        Horario: <strong>{selectedCell?.day}</strong> de <strong>{selectedCell?.slot.start}</strong> a <strong>{selectedCell?.slot.end}</strong>
                    </span>
                </div>
            )}

            {/* Strategy Switcher */}
            {(!editingAssignmentIds || editingAssignmentIds.length === 0) && (
                <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => onAssignModeChange('group')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${assignMode === 'group' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Planificado (Recomendado)
                    </button>
                    <button
                        type="button"
                        onClick={() => onAssignModeChange('manual')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${assignMode === 'manual' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Manual / Ad-hoc
                    </button>
                </div>
            )}

            {/* Conflict Warnings */}
            {selectedCell && formSubjectId && (
                <div className="space-y-2 mb-4">
                    {formTeacherId && state.teachers.find(t => t.id === formTeacherId)?.unavailableSlots?.includes(`${selectedCell.day}-${selectedCell.slot.id}`) && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 text-xs border border-red-100 rounded">
                            <AlertTriangle size={14} /> El docente está bloqueado en este horario.
                        </div>
                    )}
                    {formSubjectId && state.subjects.find(s => s.id === formSubjectId)?.preferredDays?.length! > 0 &&
                        !state.subjects.find(s => s.id === formSubjectId)?.preferredDays?.includes(selectedCell.day) && (
                            <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 text-xs border border-amber-100 rounded">
                                <Info size={14} /> Este día no es preferido para esta materia.
                            </div>
                        )}
                </div>
            )}

            <form onSubmit={onSave} className="space-y-4">

                {/* GROUP SELECTION (If in Group Mode) */}
                {assignMode === 'group' && (!editingAssignmentIds || editingAssignmentIds.length === 0) && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-2">
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Grupo Planificado</label>
                        <select
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                            value={selectedGroupId}
                            onChange={(e) => onGroupSelect(e.target.value)}
                            required={assignMode === 'group' && !editingAssignmentIds}
                        >
                            <option value="">-- Selecciona una sesión pendiente --</option>
                            {pendingSessions.map(s => {
                                const sub = state.subjects.find(sub => sub.id === s.subjectId);
                                return (
                                    <option key={s.id} value={s.id}>
                                        {sub?.name} - {s.groupName} (Bloque {s.hours}h)
                                    </option>
                                )
                            })}
                            {pendingSessions.length === 0 && <option disabled>No hay sesiones pendientes</option>}
                        </select>
                        {selectedGroupId && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Se autocompletaron los datos del grupo.
                            </p>
                        )}
                    </div>
                )}

                {/* VALIDATION WARNINGS */}
                {formSubjectId && (formTeacherId || selectedTeacherId) && (
                    <div className="space-y-2">
                        {(() => {
                            const teacherId = viewMode === 'teacher' ? selectedTeacherId : formTeacherId;
                            const teacher = state.teachers.find(t => t.id === teacherId);
                            const subject = state.subjects.find(s => s.id === formSubjectId);

                            const warnings: { type: string; message: string }[] = [];

                            // 1. Specialty Check
                            if (teacher && subject && teacher.allowedSubjectIds && teacher.allowedSubjectIds.length > 0) {
                                if (!teacher.allowedSubjectIds.includes(subject.id)) {
                                    warnings.push({
                                        type: 'specialty',
                                        message: `El docente no tiene esta materia como especialidad.`
                                    });
                                }
                            }

                            // 2. Preferred Day Check
                            if (subject && subject.preferredDays && subject.preferredDays.length > 0 && selectedCell) {
                                if (!subject.preferredDays.includes(selectedCell.day)) {
                                    warnings.push({
                                        type: 'day',
                                        message: `Este no es un día preferido para esta materia.`
                                    });
                                }
                            }

                            if (warnings.length === 0) return null;

                            return (
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                        <AlertTriangle size={14} /> Advertencias de Reglas
                                    </div>
                                    {warnings.map((w, idx) => (
                                        <div key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                                            <div className="mt-1 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                                            {w.message}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Subject Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Materia</label>
                    {editingAssignmentIds && editingAssignmentIds.length > 0 ? (
                        <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-700 text-sm">
                            {state.subjects.find(s => s.id === formSubjectId)?.name || 'Materia Desconocida'}
                        </div>
                    ) : (
                        <select
                            className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 ${assignMode === 'group' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                }`}
                            value={formSubjectId}
                            onChange={e => onSubjectChange(e.target.value)}
                            required
                            disabled={assignMode === 'group'}
                        >
                            <option value="">Selecciona una materia...</option>
                            {state.subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.area})</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Teacher Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Docente</label>
                    {(!editingAssignmentIds || editingAssignmentIds.length === 0) && viewMode === 'teacher' && selectedTeacherId ? (
                        <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 flex items-center justify-between">
                            <span>{state.teachers.find(t => t.id === selectedTeacherId)?.name}</span>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Fijo</span>
                        </div>
                    ) : (
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            value={formTeacherId}
                            onChange={e => onTeacherChange(e.target.value)}
                            required
                        >
                            <option value="">Selecciona un docente...</option>
                            {state.teachers.map(t => {
                                if (!selectedCell) return null;

                                const unavailableKey = `${selectedCell.day}-${selectedCell.slot.id}`;
                                const isBlocked = t.unavailableSlots?.includes(unavailableKey);

                                const isBusy = state.assignments.some(a =>
                                    a.teacherId === t.id &&
                                    a.day === selectedCell.day &&
                                    a.timeSlotId === selectedCell.slot.id
                                );

                                return (
                                    <option
                                        key={t.id}
                                        value={t.id}
                                        disabled={isBlocked || isBusy}
                                        className={isBlocked || isBusy ? 'text-slate-300' : ''}
                                    >
                                        {t.name} {isBlocked ? '(Bloqueado)' : isBusy ? '(Ocupado)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>

                {/* Room Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Aula</label>
                    {(!editingAssignmentIds || editingAssignmentIds.length === 0) && viewMode === 'classroom' && selectedClassroomId ? (
                        <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 flex items-center justify-between">
                            <span>{state.classrooms.find(c => c.id === selectedClassroomId)?.name}</span>
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Fija</span>
                        </div>
                    ) : (
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            value={formClassroomId}
                            onChange={e => onClassroomChange(e.target.value)}
                            required
                        >
                            <option value="">Selecciona un aula...</option>
                            {state.classrooms.map(c => {
                                if (!selectedCell) return null;
                                const isBusy = state.assignments.some(a =>
                                    a.classroomId === c.id &&
                                    a.day === selectedCell.day &&
                                    a.timeSlotId === selectedCell.slot.id
                                );
                                return (
                                    <option
                                        key={c.id}
                                        value={c.id}
                                        disabled={isBusy}
                                        className={isBusy ? 'text-slate-300' : ''}
                                    >
                                        {c.name} {isBusy ? '(Ocupada)' : `(Cap: ${c.maxCapacity})`}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-bold shadow-sm"
                    >
                        Asignar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignmentModal;
