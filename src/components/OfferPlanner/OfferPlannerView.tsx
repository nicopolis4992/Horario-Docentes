import React from 'react';
import {
    Clock,
    GraduationCap,
    ListTodo,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { AREA_CONFIG } from '../../../utils';
import Modal from '../Common/Modal';
import { useOfferPlanner } from './useOfferPlanner';
import toast from 'react-hot-toast';

// Subcomponents
import SubjectListSidebar from './SubjectListSidebar';
import GeneratorOptions from './GeneratorOptions';
import ActiveGroupsList from './ActiveGroupsList';

const OfferPlannerView = () => {
    const planner = useOfferPlanner();
    const { state } = planner;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 pb-20 lg:pb-0">
            {/* LEFT: Subjects List via component */}
            <SubjectListSidebar
                selectedSubjectId={planner.selectedSubjectId}
                onSelectSubject={(id) => {
                    planner.setSelectedSubjectId(id);
                    planner.setPreviewGroups([]);
                    const subject = state.subjects.find(s => s.id === id);
                    planner.setBaseClassroomId(subject?.preferredClassroomId || '');
                }}
                onBulkGenerate={planner.handleBulkGenerate}
            />

            {/* RIGHT: Workspace */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
                {!planner.selectedSubject ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-fade-in">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <ListTodo size={48} className="opacity-50" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">Planificador de Oferta</h3>
                        <p className="max-w-md">Selecciona una materia de la izquierda para comenzar a definir cuántos paralelos abrir y qué docentes asignarlos.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full animate-fade-in">
                        {/* Header Details */}
                        <div className="p-6 border-b border-slate-100 bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        {planner.selectedSubject.name}
                                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                            {planner.selectedSubject.projectedStudents} Estudiantes Proyectados
                                        </span>
                                    </h2>
                                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                        <span className="flex items-center gap-1"><Clock size={14} /> {planner.selectedSubject.credits} Horas/Semana</span>
                                        <span className="flex items-center gap-1"><GraduationCap size={14} /> {AREA_CONFIG[planner.selectedSubject.area].label}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        toast((t) => (
                                            <div className="flex flex-col gap-3">
                                                <span className="font-bold text-slate-800">¿Borrar paralelos?</span>
                                                <span className="text-sm text-slate-600">Se eliminarán todos los grupos de <b>{planner.selectedSubject?.name}</b> y sus horarios asignados.</span>
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
                                                            planner.handleClearSubjectGroups();
                                                            toast.dismiss(t.id);
                                                        }}
                                                    >
                                                        Sí, borrar
                                                    </button>
                                                </div>
                                            </div>
                                        ), { duration: 5000 });
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                >
                                    <Trash2 size={14} /> Borrar Paralelos
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {/* Generator Component (Only visible if no groups yet) */}
                            {planner.existingGroups.length === 0 && (
                                <GeneratorOptions
                                    classrooms={state.classrooms}
                                    baseClassroomId={planner.baseClassroomId}
                                    setBaseClassroomId={planner.setBaseClassroomId}
                                    useMaxCapacity={planner.useMaxCapacity}
                                    setUseMaxCapacity={planner.setUseMaxCapacity}
                                    previewGroups={planner.previewGroups}
                                    onCalculate={planner.handleCalculate}
                                    onConfirmGroups={planner.handleConfirmGroups}
                                    onClearPreview={() => planner.setPreviewGroups([])}
                                />
                            )}

                            {/* Active Groups Component */}
                            <ActiveGroupsList
                                groups={planner.existingGroups}
                                subjectId={planner.selectedSubject.id}
                                subjectCredits={planner.selectedSubject.credits}
                                teachers={state.teachers}
                                classrooms={state.classrooms}
                                getTeacherLoad={planner.getTeacherTotalLoad}
                                onUpdateTeacher={planner.handleUpdateGroupTeacher}
                                onUpdateRoom={planner.handleUpdateGroupRoom}
                                onDeleteClick={planner.handleDeleteGroupClick}
                            />
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={!!planner.groupToDelete}
                    onClose={() => planner.setGroupToDelete(null)}
                    title="Eliminar Paralelo"
                    maxWidth="max-w-sm"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertTriangle size={24} className="shrink-0" />
                            <p className="text-sm font-medium">Esta acción es irreversible y eliminará todas las clases agendadas para este grupo.</p>
                        </div>
                        <p className="text-slate-600 text-sm">
                            ¿Estás seguro de que deseas eliminar este paralelo?
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => planner.setGroupToDelete(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={planner.confirmDeleteGroup}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default OfferPlannerView;
