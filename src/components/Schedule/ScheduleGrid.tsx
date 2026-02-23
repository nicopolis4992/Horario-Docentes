import React from 'react';
import { DAYS } from './useScheduleLogic';
import { useScheduleContext } from './ScheduleContext';
import ScheduleCell from './ScheduleCell';
import { DroppableCell, DraggableAssignmentBlock } from './DndComponents';
import { Clock, Plus, Ban, Edit2, Trash2, Scissors } from 'lucide-react';
import { AREA_CONFIG } from '../../../utils';

const ScheduleGrid = () => {
    const {
        viewMode,
        selectedTeacherId,
        selectedClassroomId,
        state,
        timeSlots,
        activeId,
        editingAssignmentIds,
        handleDeleteAssignment,
        handleSplitAssignment,
        openAssignmentModal
    } = useScheduleContext();

    if (viewMode === 'teacher' && !selectedTeacherId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 h-full bg-slate-50">
                <p>Selecciona un docente para ver su horario.</p>
            </div>
        );
    }

    if (viewMode === 'classroom' && !selectedClassroomId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 h-full bg-slate-50">
                <p>Selecciona un aula para ver su disponibilidad.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 flex-1 relative min-h-0 flex flex-col">
            <div className="min-w-[800px] flex-1">
                {/* Headers */}
                <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b-2 border-slate-200 bg-slate-50 sticky top-0 z-10 rounded-t-xl shrink-0">
                    <div className="p-3 border-r border-slate-200 font-bold text-slate-500 text-center text-sm shadow-[1px_0_0_0_#f1f5f9]">Hora</div>
                    {DAYS.map(day => (
                        <div key={day} className="p-3 border-r border-slate-200 font-bold text-slate-700 text-center text-sm last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="bg-slate-50 overflow-y-auto w-full relative">
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
                            const resourceId = viewMode === 'teacher' ? selectedTeacherId : selectedClassroomId;
                            let dayAssignments = [];
                            let blockedSlots: string[] = [];

                            if (viewMode === 'teacher' && selectedTeacherId) {
                                dayAssignments = state.assignments.filter(a => a.day === day && a.teacherId === selectedTeacherId);
                                blockedSlots = state.teachers.find(t => t.id === selectedTeacherId)?.unavailableSlots || [];
                            } else if (viewMode === 'classroom' && selectedClassroomId) {
                                dayAssignments = state.assignments.filter(a => a.day === day && a.classroomId === selectedClassroomId);
                            }

                            // Calculate contiguous blocks for visual rendering
                            const blocks: any[] = [];
                            const sorted = [...dayAssignments].sort((a, b) => {
                                return timeSlots.findIndex(s => s.id === a.timeSlotId) - timeSlots.findIndex(s => s.id === b.timeSlotId);
                            });

                            sorted.forEach((a: any) => {
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

                                    {/* BACKGROUND SLOTS */}
                                    {timeSlots.map(slot => {
                                        const cellId = `${day}-${slot.id}-${resourceId}`;
                                        const isBlocked = viewMode === 'teacher' && blockedSlots.includes(`${day}-${slot.id}`);

                                        return (
                                            <div key={slot.id} className="h-[120px] border-b border-slate-100 p-1">
                                                <ScheduleCell
                                                    id={cellId}
                                                    assignments={[]} /* Visual blocks are overlaid below */
                                                    day={day}
                                                    timeSlot={slot}
                                                    resourceId={resourceId!}
                                                    viewMode={viewMode}
                                                    isDraggingOver={false} /* Controlled by DndKit overlay internally if needed */
                                                    activeId={activeId}
                                                    isEditing={blocks.some(b => b.ids.some(id => editingAssignmentIds?.includes(id)))}
                                                />
                                            </div>
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
                                                    <div className={`w-full h-full rounded p-2 ${areaConfig?.bg} ${areaConfig?.border} border flex flex-col justify-between shadow-md group pointer-events-auto overflow-hidden text-left relative`}>

                                                        <div className="relative">
                                                            <div className={`text-[9px] font-extrabold uppercase tracking-wider mb-0.5 ${areaConfig?.iconColor}`}>
                                                                {viewMode === 'teacher' ? room?.name : teacher?.name}
                                                            </div>
                                                            <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight pr-12">
                                                                {subject?.name}
                                                            </div>
                                                            {group && <div className="text-[9px] bg-white/70 text-slate-700 px-1 py-0.5 rounded inline-block mt-1 font-semibold">{group.name}</div>}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-auto">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                                <Clock size={10} className="text-slate-400" />
                                                                <span>{span}h</span>
                                                            </div>
                                                        </div>

                                                        {/* Hover Actions */}
                                                        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm border border-slate-200">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openAssignmentModal(day, timeSlots[slotIndex], block.ids); }}
                                                                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors" title="Editar aula/docente">
                                                                <Edit2 size={12} />
                                                            </button>
                                                            {span > 1 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleSplitAssignment(assignment.id); }}
                                                                    className="p-1 hover:bg-amber-50 text-amber-600 rounded transition-colors" title="Desvincular primera hora">
                                                                    <Scissors size={12} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id, block.ids); }}
                                                                className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors" title="Eliminar bloque completo">
                                                                <Trash2 size={12} />
                                                            </button>
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
        </div>
    );
};

export default ScheduleGrid;
