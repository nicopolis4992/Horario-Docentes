import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Sparkles, Clock } from 'lucide-react';

interface DraggableSessionProps {
    session: {
        id: string;
        groupId: string;
        subjectId: string;
        groupName: string;
        hours: number;
        sessionIndex: number;
    };
    subjectName: string;
}

export const DraggableSession: React.FC<DraggableSessionProps> = ({ session, subjectName }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: session.id,
        data: {
            type: 'session',
            session
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 border-blue-400 ring-2 ring-blue-100' : ''}`}
        >
            <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs text-slate-700 line-clamp-1">{subjectName}</span>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 rounded">{session.groupName}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
                    Bloque de {session.hours}h
                </span>
                {session.hours > 1 && <Sparkles size={10} className="text-amber-400" />}
            </div>
        </div>
    );
};

interface DroppableCellProps {
    id: string;
    day: string;
    slotId: string;
    isBlocked?: boolean;
    isInvalid?: boolean;
    children?: React.ReactNode;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({ id, day, slotId, isBlocked, isInvalid, children }) => {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: {
            type: 'cell',
            day,
            slotId
        },
        disabled: isBlocked
    });

    return (
        <div
            ref={setNodeRef}
            className={`h-[80px] border-b border-slate-100 p-1 relative group transition-colors ${isBlocked ? 'bg-slate-100'
                : isOver && isInvalid ? 'bg-red-50 ring-2 ring-inset ring-red-400 z-20'
                    : isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-200 z-20'
                        : 'hover:bg-slate-50'
                }`}
        >
            {children}
        </div>
    );
};

interface DraggableAssignmentBlockProps {
    id: string;
    day: string;
    slotId: string;
    span: number;
    children: React.ReactNode;
    assignmentIds: string[];
}

export const DraggableAssignmentBlock: React.FC<DraggableAssignmentBlockProps> = ({ id, day, slotId, span, children, assignmentIds }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        data: {
            type: 'assignment',
            day,
            slotId,
            span,
            assignmentIds
        }
    });

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...dragStyle,
                height: `100%`
            }}
            {...listeners}
            {...attributes}
            className={`w-full p-1 z-10 transition-all cursor-grab active:cursor-grabbing relative ${isDragging ? 'opacity-30' : ''}`}
        >
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};
