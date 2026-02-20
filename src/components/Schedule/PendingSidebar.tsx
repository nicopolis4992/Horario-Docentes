import React from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { DraggableSession } from './DndComponents';
import { PendingSession } from './useScheduleLogic';
import { Subject } from '../../../types';

interface PendingSidebarProps {
    pendingSessions: PendingSession[];
    subjects: Subject[];
    viewMode: 'teachers' | 'classrooms';
    showAllPending: boolean;
    onToggleShowAll: (value: boolean) => void;
}

const PendingSidebar: React.FC<PendingSidebarProps> = ({
    pendingSessions,
    subjects,
    viewMode,
    showAllPending,
    onToggleShowAll
}) => {
    return (
        <div className="hidden lg:flex flex-col w-64 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Layers size={16} /> Pendientes
                </h3>
                <p className="text-xs text-slate-500">Paralelos por agendar</p>

                {/* Toggle "Ver Todos" — Only in Aulas mode */}
                {viewMode === 'classrooms' && (
                    <button
                        onClick={() => onToggleShowAll(!showAllPending)}
                        className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showAllPending
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {showAllPending ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showAllPending ? 'Solo esta aula' : 'Ver todos'}
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {pendingSessions.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 text-xs italic">
                        Todo planificado 🎉
                    </div>
                ) : (
                    pendingSessions.map(session => (
                        <DraggableSession
                            key={session.id}
                            session={session}
                            subjectName={subjects.find(s => s.id === session.subjectId)?.name || 'Materia'}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default PendingSidebar;
