import React, { useState } from 'react';
// Remove DAYS import since we use visibleDays from context
// import { DAYS } from './useScheduleLogic';
import { useScheduleContext } from './ScheduleContext';
import ScheduleCell from './ScheduleCell';
import { DroppableCell, DraggableAssignmentBlock } from './DndComponents';
import { Clock, Plus, Ban, Edit2, Trash2, Scissors, Link, AlertTriangle, Sparkles, CalendarDays } from 'lucide-react';
import { AREA_CONFIG } from '../../../utils';
import toast from 'react-hot-toast';

const ScheduleGrid = () => {
    const {
        viewMode,
        selectedTeacherId,
        selectedClassroomId,
        state,
        dispatch,
        visibleTimeSlots,
        visibleDays,
        activeId,
        editingAssignmentIds,
        handleDeleteAssignment,
        handleSplitAssignment,
        openAssignmentModal,
        handleAutoAssignAll,
        allPendingSessions
    } = useScheduleContext();

    const [activeSplitMenuId, setActiveSplitMenuId] = useState<string | null>(null);

    if (viewMode === 'teacher' && !selectedTeacherId) {
        const totalPending = allPendingSessions.length;
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 h-full bg-slate-50">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <CalendarDays size={48} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 mb-2">Planificador de Horarios</h3>
                <p className="text-sm text-slate-500 text-center max-w-md mb-6">
                    Selecciona un docente arriba para ver y editar su horario, o auto-asigna todos los paralelos pendientes de una vez.
                </p>
                {totalPending > 0 && (
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs text-slate-500 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
                            {totalPending} {totalPending === 1 ? 'sesión pendiente' : 'sesiones pendientes'} por agendar
                        </span>
                        <button
                            onClick={handleAutoAssignAll}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
                        >
                            <Sparkles size={16} />
                            Auto-Asignar Todo
                        </button>
                    </div>
                )}
                {totalPending === 0 && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">
                        ✅ Todos los paralelos están agendados
                    </span>
                )}
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
                <div
                    style={{ gridTemplateColumns: `80px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
                    className="grid border-b-2 border-slate-200 bg-slate-50 sticky top-0 z-20 rounded-t-xl shrink-0"
                >
                    <div className="p-3 border-r border-slate-200 font-bold text-slate-500 text-center text-sm shadow-[1px_0_0_0_#f1f5f9]">Hora</div>
                    {visibleDays.map(day => (
                        <div key={day} className="p-3 border-r border-slate-200 font-bold text-slate-700 text-center text-sm last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="bg-slate-50 w-full relative">
                    <div
                        style={{ gridTemplateColumns: `80px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
                        className="grid min-h-max"
                    >
                        {/* TIME LABELS COLUMN */}
                        <div className="bg-slate-50 border-r border-slate-200 flex flex-col">
                            {visibleTimeSlots.map(slot => (
                                <div key={slot.id} className="h-[80px] border-b border-slate-100 text-[10px] font-mono text-slate-500 flex flex-col items-center justify-center text-center p-2 shrink-0">
                                    <span>{slot.start}</span>
                                    <span className="w-8 h-px bg-slate-200 my-1"></span>
                                    <span>{slot.end}</span>
                                </div>
                            ))}
                        </div>

                        {/* DAY COLUMNS */}
                        {visibleDays.map(day => {
                            const resourceId = viewMode === 'teacher' ? selectedTeacherId : selectedClassroomId;
                            let dayAssignments = [];
                            let blockedSlots: string[] = [];

                            if (viewMode === 'teacher' && selectedTeacherId) {
                                dayAssignments = state.assignments.filter(a => a.day === day && a.teacherId === selectedTeacherId);
                                blockedSlots = state.teachers.find(t => t.id === selectedTeacherId)?.unavailableSlots || [];
                            } else if (viewMode === 'classroom' && selectedClassroomId) {
                                dayAssignments = state.assignments.filter(a => a.day === day && a.classroomId === selectedClassroomId);
                            }

                            // Filter out assignments that are outside the visible time range
                            // This fixes the bug where morning blocks appear at the top in vespertina view
                            const timeSlotIds = new Set(visibleTimeSlots.map(s => s.id));
                            const visibleAssignments = dayAssignments.filter(a => timeSlotIds.has(a.timeSlotId));

                            // Calculate contiguous blocks for visual rendering
                            const blocks: any[] = [];
                            const sorted = [...visibleAssignments].sort((a, b) => {
                                // Primary sort: group by courseGroupId so contiguous merging works correctly
                                const groupCompare = (a.courseGroupId || '').localeCompare(b.courseGroupId || '');
                                if (groupCompare !== 0) return groupCompare;
                                // Secondary sort: by time slot index within each group
                                return visibleTimeSlots.findIndex(s => s.id === a.timeSlotId) - visibleTimeSlots.findIndex(s => s.id === b.timeSlotId);
                            });

                            sorted.forEach((a: any) => {
                                const idx = visibleTimeSlots.findIndex(s => s.id === a.timeSlotId);
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
                                    {visibleTimeSlots.map(slot => {
                                        const cellId = `${day}-${slot.id}-${resourceId}`;
                                        const isBlocked = viewMode === 'teacher' && blockedSlots.includes(`${day}-${slot.id}`);

                                        return (
                                            <div key={slot.id} className="h-[80px] border-b border-slate-100 p-1">
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

                                        const isBlockIncomplete = block.ids.some(id => {
                                            const a = state.assignments.find(x => x.id === id);
                                            return a?.isIncomplete || !a?.teacherId || !a?.classroomId;
                                        });

                                        const bgClass = isBlockIncomplete ? 'bg-red-50' : areaConfig?.bg;
                                        const borderClass = isBlockIncomplete ? 'border-red-400' : areaConfig?.border;
                                        // Detect overlap: check if any other blocks occupy the same slots
                                        const blockSlots = new Set<string>();
                                        for (let s = slotIndex; s < slotIndex + span; s++) {
                                            blockSlots.add(String(s));
                                        }
                                        const overlappingBlocks = blocks.filter(other => {
                                            if (other === block) return false;
                                            for (let s = other.slotIndex; s < other.slotIndex + other.span; s++) {
                                                if (blockSlots.has(String(s))) return true;
                                            }
                                            return false;
                                        });
                                        const hasOverlap = overlappingBlocks.length > 0;
                                        // Calculate horizontal position for stacking
                                        const allOverlapping = hasOverlap ? [block, ...overlappingBlocks].sort((a, b) => a.assignment.id.localeCompare(b.assignment.id)) : [block];
                                        const overlapIndex = allOverlapping.indexOf(block);
                                        const overlapTotal = allOverlapping.length;

                                        return (
                                            <div
                                                key={`block-${assignment.id}`}
                                                className={`absolute z-10 ${hasOverlap ? '' : 'left-0 right-0'}`}
                                                style={{
                                                    top: `${slotIndex * 80}px`,
                                                    height: `${span * 80}px`,
                                                    padding: '2px',
                                                    ...(hasOverlap ? {
                                                        left: `${(overlapIndex / overlapTotal) * 100}%`,
                                                        width: `${(1 / overlapTotal) * 100}%`
                                                    } : {})
                                                }}
                                            >
                                                <DraggableAssignmentBlock
                                                    id={assignment.id}
                                                    day={day}
                                                    slotId={assignment.timeSlotId}
                                                    span={span}
                                                    assignmentIds={block.ids}
                                                >
                                                    <div
                                                        onClick={(e) => {
                                                            if (isBlockIncomplete || hasOverlap) {
                                                                e.stopPropagation();
                                                                openAssignmentModal(day, visibleTimeSlots[slotIndex], block.ids);
                                                            }
                                                        }}
                                                        className={`w-full h-full rounded p-2 ${bgClass} ${borderClass} border flex flex-col justify-between shadow-md group pointer-events-auto text-left relative ${isBlockIncomplete || hasOverlap ? 'cursor-pointer hover:ring-2 hover:ring-red-200' : ''}`}
                                                    >
                                                        {hasOverlap && (
                                                            <div className="absolute -top-1 -right-1 z-30 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center" title="Conflicto: solapamiento de horario">
                                                                <AlertTriangle size={10} />
                                                            </div>
                                                        )}

                                                        <div className="relative pointer-events-auto">
                                                            <div className={`text-[9px] font-extrabold uppercase tracking-wider mb-0.5 ${areaConfig?.iconColor}`}>
                                                                {viewMode === 'teacher' ? room?.name : teacher?.name}
                                                            </div>
                                                            <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight pr-12">
                                                                {subject?.name}
                                                            </div>
                                                            {group && <div className="text-[9px] bg-white/70 text-slate-700 px-1 py-0.5 rounded inline-block mt-1 font-semibold">{group.name}</div>}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-auto">
                                                            {span > 1 && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                                    <Clock size={10} className="text-slate-400" />
                                                                    <span>{span}h</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Hover Actions */}
                                                        <div
                                                            onPointerDownCapture={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm border border-slate-200"
                                                        >
                                                            {assignment.isSplit && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault(); e.stopPropagation();
                                                                        dispatch({ type: 'JOIN_ASSIGNMENTS', payload: { courseGroupId: assignment.courseGroupId, day } });
                                                                        toast.success('Bloques unidos');
                                                                    }}
                                                                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors" title="Unir bloques separados">
                                                                    <Link size={12} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAssignmentModal(day, visibleTimeSlots[slotIndex], block.ids); }}
                                                                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors" title="Editar aula/docente">
                                                                <Edit2 size={12} />
                                                            </button>
                                                            {span > 1 && (
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault(); e.stopPropagation();
                                                                            if (span === 2) {
                                                                                handleSplitAssignment(block.ids[1]);
                                                                            } else {
                                                                                setActiveSplitMenuId(activeSplitMenuId === assignment.id ? null : assignment.id);
                                                                            }
                                                                        }}
                                                                        className="p-1 hover:bg-amber-50 text-amber-600 rounded transition-colors" title="Dividir bloque">
                                                                        <Scissors size={12} />
                                                                    </button>

                                                                    {activeSplitMenuId === assignment.id && span > 2 && (
                                                                        <div className="absolute top-100 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md flex flex-col z-50 min-w-max">
                                                                            {span === 3 && (
                                                                                <button onClick={(e) => { e.stopPropagation(); handleSplitAssignment(block.ids[1]); setActiveSplitMenuId(null); }} className="px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 whitespace-nowrap text-slate-700">1h + 2h</button>
                                                                            )}
                                                                            {span === 4 && (
                                                                                <>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleSplitAssignment(block.ids[1]); setActiveSplitMenuId(null); }} className="px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 whitespace-nowrap text-slate-700">1h + 3h</button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleSplitAssignment(block.ids[2]); setActiveSplitMenuId(null); }} className="px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 whitespace-nowrap text-slate-700">2h + 2h</button>
                                                                                </>
                                                                            )}
                                                                            {span === 5 && (
                                                                                <>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleSplitAssignment(block.ids[1]); setActiveSplitMenuId(null); }} className="px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 whitespace-nowrap text-slate-700">1h + 4h</button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleSplitAssignment(block.ids[2]); setActiveSplitMenuId(null); }} className="px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 whitespace-nowrap text-slate-700">2h + 3h</button>
                                                                                </>
                                                                            )}
                                                                            {span > 5 && (
                                                                                Array.from({ length: Math.ceil((span - 1) / 2) }).map((_, i) => (
                                                                                    <button key={i} onClick={(e) => { e.stopPropagation(); handleSplitAssignment(block.ids[i + 1]); setActiveSplitMenuId(null); }} className="px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 whitespace-nowrap text-slate-700">
                                                                                        {i + 1}h + {span - (i + 1)}h
                                                                                    </button>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAssignment(assignment.id, block.ids); }}
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
