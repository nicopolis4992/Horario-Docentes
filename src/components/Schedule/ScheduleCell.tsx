import React from 'react';
import { Plus, Ban, Clock, X, Scissors, Pencil, Link } from 'lucide-react';
import { useScheduleContext } from './ScheduleContext';
import { DroppableCell, DraggableAssignmentBlock } from './DndComponents';
import { AREA_CONFIG } from '../../../utils';
import { ScheduleAssignment, DayOfWeek, TimeSlot } from '../../../types';

interface ScheduleCellProps {
    id: string;
    day: DayOfWeek;
    timeSlot: TimeSlot;
    assignments: ScheduleAssignment[];
    resourceId: string;
    viewMode: 'teachers' | 'classrooms';
    isDraggingOver: boolean;
    activeId: string | null;
    isEditing: boolean;
}

const ScheduleCell = ({
    id,
    day,
    timeSlot,
    assignments,
    resourceId,
    viewMode,
    isDraggingOver,
    activeId,
    isEditing
}: ScheduleCellProps) => {
    const { state, dispatch, handleCellClick, activeSession, activeAssignment, validateMove, selectedTeacherId, selectedClassroomId } = useScheduleContext();

    let isBlocked = false;
    if (viewMode === 'teachers') {
        const teacher = state.teachers.find(t => t.id === resourceId);
        isBlocked = teacher?.unavailableSlots.includes(`${day}-${timeSlot.id}`) || false;
    }

    // Calcular en tiempo real si el movimiento es inválido cuando hay un Drag Activo
    let isInvalidDrag = false;
    if (activeId) {
        if (activeSession) {
            const group = state.courseGroups.find(g => g.id === activeSession.groupId);

            let teacherId = group?.teacherId || (viewMode === 'teachers' ? selectedTeacherId || '' : '');
            let classroomId = viewMode === 'classrooms' && selectedClassroomId
                ? selectedClassroomId
                : (group?.plannedClassroomId || '');

            if (teacherId && classroomId) {
                const validation = validateMove(day, timeSlot.id, activeSession.hours, teacherId, classroomId, activeSession.subjectId);
                isInvalidDrag = !validation.valid;
            } else {
                // Si faltan datos (ej. se debe abrir modal al dropear), podríamos decir que no es inválido a priori porque se resolverá, pero se pinta default.
                isInvalidDrag = false;
            }
        } else if (activeAssignment) {
            // Caso de mover una asignación existente (multi-hora o mono-hora)
            // Calculamos el span:
            const span = state.assignments.filter(a => a.courseGroupId === activeAssignment.courseGroupId && a.day === activeAssignment.day && a.timeSlotId >= activeAssignment.timeSlotId && !a.isSplit).length || 1;

            const targetClassroomId = viewMode === 'classrooms' && selectedClassroomId
                ? selectedClassroomId
                : activeAssignment.classroomId;

            const existingIds = state.assignments.filter(a => a.courseGroupId === activeAssignment.courseGroupId && a.day === activeAssignment.day && a.timeSlotId >= activeAssignment.timeSlotId && !a.isSplit).map(a => a.id);

            const validation = validateMove(
                day,
                timeSlot.id,
                span,
                activeAssignment.teacherId,
                targetClassroomId,
                activeAssignment.subjectId,
                existingIds
            );
            isInvalidDrag = !validation.valid;
        }
    }

    return (
        <DroppableCell id={id} day={day} slotId={timeSlot.id} isBlocked={isBlocked} isInvalid={isInvalidDrag}>
            {!isBlocked ? (
                <button
                    onClick={() => handleCellClick(day, timeSlot)}
                    className="w-full h-full rounded border-2 border-dashed border-transparent transition-all hover:border-slate-300 flex items-center justify-center text-slate-200 hover:text-blue-400"
                >
                    <Plus size={24} />
                </button>
            ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30 cursor-not-allowed">
                    <Ban size={24} className="text-slate-400" />
                </div>
            )}

            {/* Render actual blocks if this is the start of a block (span calculation simplified here for demonstration, actual logic needs the sibling blocks to calculate absolute position and height, or we use a separate layer for absolute blocks like before) */}
            {/* Si mantenemos ScheduleCell como contenedor relativo estricto, los bloques multi-hora deben manejarse diferente (ej. absolute respecto a la columna o grid) */}
        </DroppableCell>
    );
};

export default ScheduleCell;
