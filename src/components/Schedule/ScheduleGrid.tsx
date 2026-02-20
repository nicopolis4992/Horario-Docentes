import React from 'react';
import {
    Plus,
    Ban,
    User,
    MapPin,
    Clock,
    Scissors,
    Link,
    Pencil,
    X
} from 'lucide-react';
import {
    DayOfWeek,
    TimeSlot,
    ScheduleAssignment,
    AppState
} from '../../../types';
import { AREA_CONFIG } from '../../../utils';
import { DroppableCell, DraggableAssignmentBlock } from './DndComponents';
import { DAYS } from './useScheduleLogic';

interface ScheduleGridProps {
    state: AppState;
    timeSlots: TimeSlot[];
    viewMode: 'teachers' | 'classrooms';
    selectedTeacherId: string | null;
    selectedClassroomId: string | null;
    dispatch: React.Dispatch<any>;
    onCellClick: (day: DayOfWeek, slot: TimeSlot) => void;
    onEditBlock: (day: DayOfWeek, slot: TimeSlot, ids: string[]) => void;
    onDeleteAssignment: (id: string, multipleIds?: string[]) => void;
    onSplitAssignment: (id: string) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
    state,
    timeSlots,
    viewMode,
    selectedTeacherId,
    selectedClassroomId,
    dispatch,
    onCellClick,
    onEditBlock,
    onDeleteAssignment,
    onSplitAssignment
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0 relative">

            {/* Empty State Overlay if no selection */}
            {((viewMode === 'teachers' && !selectedTeacherId) || (viewMode === 'classrooms' && !selectedClassroomId)) && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        {viewMode === 'teachers' ? <User size={32} className="text-slate-400" /> : <MapPin size={32} className="text-slate-400" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">
                        {viewMode === 'teachers' ? 'Ningún docente seleccionado' : 'Ninguna aula seleccionada'}
                    </h3>
                    <p className="text-slate-500 mt-2 max-w-md">
                        Selecciona un {viewMode === 'teachers' ? 'docente' : 'aula'} de la lista superior para ver y gestionar su horario.
                    </p>
                </div>
            )}

            {/* Header Grid */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="p-3 border-r border-slate-200"></div> {/* Corner */}
                {DAYS.map(day => (
                    <div key={day} className="p-3 text-center font-bold text-slate-700 text-sm border-r border-slate-200 last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Scrollable Column-Based Body */}
            <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-[80px_repeat(6,1fr)] min-h-max">

                    {/* TIME LABELS COLUMN */}
                    <div className="bg-slate-50 border-r border-slate-200 flex flex-col">
                        {timeSlots.map(slot => (
                            <div key={slot.id} className="h-[120px] border-b border-slate-100 text-[10px] font-mono text-slate-500 flex flex-col items-center justify-center text-center p-2 shrink-0">
                                <span>{slot.start}</span>
                                <span className="w-8 h-px bg-slate-200 my-1"></span>
                                <span>{slot.end}</span>
                            </div>
                        ))}
                    </div>

                    {/* DAY COLUMNS */}
                    {DAYS.map(day => {
                        let dayAssignments: ScheduleAssignment[] = [];
                        let teacherBlockedSlots: string[] = [];

                        if (viewMode === 'teachers' && selectedTeacherId) {
                            dayAssignments = state.assignments.filter(a => a.day === day && a.teacherId === selectedTeacherId);
                            teacherBlockedSlots = state.teachers.find(t => t.id === selectedTeacherId)?.unavailableSlots || [];
                        } else if (viewMode === 'classrooms' && selectedClassroomId) {
                            dayAssignments = state.assignments.filter(a => a.day === day && a.classroomId === selectedClassroomId);
                        }

                        const blocks: { assignment: ScheduleAssignment; span: number; slotIndex: number; ids: string[] }[] = [];
                        const sorted = [...dayAssignments].sort((a, b) => {
                            return timeSlots.findIndex(s => s.id === a.timeSlotId) - timeSlots.findIndex(s => s.id === b.timeSlotId);
                        });

                        sorted.forEach(a => {
                            const idx = timeSlots.findIndex(s => s.id === a.timeSlotId);
                            const lastBlock = blocks[blocks.length - 1];

                            if (lastBlock &&
                                lastBlock.assignment.courseGroupId === a.courseGroupId &&
                                lastBlock.slotIndex + lastBlock.span === idx &&
                                !a.isSplit) {
                                lastBlock.span++;
                                lastBlock.ids.push(a.id);
                            } else {
                                blocks.push({ assignment: a, span: 1, slotIndex: idx, ids: [a.id] });
                            }
                        });

                        return (
                            <div key={day} className="relative border-r border-slate-200 last:border-r-0">

                                {/* BACKGROUND SLOT SLOTS */}
                                {timeSlots.map(slot => {
                                    const isBlocked = teacherBlockedSlots.includes(`${day}-${slot.id}`);
                                    const cellId = `cell-${day}-${slot.id}`;

                                    return (
                                        <DroppableCell key={slot.id} id={cellId} day={day} slotId={slot.id} isBlocked={isBlocked}>
                                            {!isBlocked ? (
                                                <button
                                                    onClick={() => onCellClick(day, slot)}
                                                    disabled={(!selectedTeacherId && viewMode === 'teachers') || (!selectedClassroomId && viewMode === 'classrooms')}
                                                    className="w-full h-full rounded border-2 border-dashed border-transparent transition-all hover:border-slate-300 flex items-center justify-center text-slate-200 hover:text-blue-400 disabled:opacity-0"
                                                >
                                                    <Plus size={24} />
                                                </button>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-30 cursor-not-allowed">
                                                    <Ban size={24} className="text-slate-400" />
                                                </div>
                                            )}
                                        </DroppableCell>
                                    );
                                })}

                                {/* OVERLAID DYNAMIC BLOCKS */}
                                {blocks.map(block => {
                                    const { assignment, span, slotIndex } = block;
                                    const subject = state.subjects.find(s => s.id === assignment.subjectId);
                                    const teacher = state.teachers.find(t => t.id === assignment.teacherId);
                                    const room = state.classrooms.find(c => c.id === assignment.classroomId);
                                    const group = state.courseGroups.find(g => g.id === assignment.courseGroupId);
                                    const areaConfig = subject ? AREA_CONFIG[subject.area] : AREA_CONFIG['Audiovisual'];

                                    return (
                                        <div
                                            key={`block-${assignment.id}`}
                                            className="absolute left-0 right-0 z-10"
                                            style={{
                                                top: `${slotIndex * 120}px`,
                                                height: `${span * 120}px`,
                                                padding: '2px'
                                            }}
                                        >
                                            <DraggableAssignmentBlock
                                                id={assignment.id}
                                                day={day}
                                                slotId={assignment.timeSlotId}
                                                span={span}
                                                assignmentIds={block.ids}
                                            >
                                                <div className={`w-full h-full rounded p-2 ${areaConfig?.bg} ${areaConfig?.border} border flex flex-col justify-between shadow-md group pointer-events-auto overflow-hidden`}>

                                                    <div className="relative">
                                                        <div className={`text-[9px] font-extrabold uppercase tracking-wider mb-0.5 ${areaConfig?.iconColor}`}>
                                                            {viewMode === 'teachers' ? room?.name : teacher?.name}
                                                        </div>
                                                        <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">
                                                            {subject?.name}
                                                        </div>
                                                        {group && <div className="text-[9px] bg-white/60 text-slate-700 px-1 py-0.5 rounded inline-block mt-1 font-semibold">{group.name}</div>}
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                            <Clock size={10} className="text-slate-400" />
                                                            <span>{span}h</span>
                                                        </div>

                                                        {/* ACTIONS */}
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {span > 1 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onSplitAssignment(block.ids[1]); }}
                                                                    className="p-1.5 bg-white rounded-full shadow-sm border border-amber-100 text-amber-600 hover:bg-amber-50 transition-colors"
                                                                    title="Dividir en bloques de 1h"
                                                                >
                                                                    <Scissors size={14} />
                                                                </button>
                                                            )}
                                                            {assignment.isSplit && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        dispatch({ type: 'JOIN_ASSIGNMENTS', payload: { courseGroupId: assignment.courseGroupId, day: assignment.day } });
                                                                    }}
                                                                    className="p-1.5 bg-white rounded-full shadow-sm border border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors"
                                                                    title="Unir bloques"
                                                                >
                                                                    <Link size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEditBlock(day, timeSlots[slotIndex], block.ids);
                                                                }}
                                                                className="p-1.5 bg-white rounded-full shadow-lg border border-blue-100 text-blue-600 hover:bg-blue-50 transition-all active:scale-95 z-20"
                                                                title="Editar asignación"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDeleteAssignment(assignment.id, block.ids); }}
                                                                className="p-1.5 bg-white rounded-full shadow-sm border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                                                                title="Eliminar este bloque"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>
                                            </DraggableAssignmentBlock>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ScheduleGrid;
