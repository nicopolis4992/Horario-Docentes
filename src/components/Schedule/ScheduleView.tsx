import React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { DraggableSession } from './DndComponents';
import { ScheduleProvider, useScheduleContext } from './ScheduleContext';
import PendingSidebar from './PendingSidebar';
import ScheduleHeader from './ScheduleHeader';
import ScheduleGrid from './ScheduleGrid';
import AssignmentModal from './AssignmentModal';

const ScheduleViewContent = () => {
    const logic = useScheduleContext();

    return (
        <DndContext
            sensors={logic.sensors}
            onDragStart={logic.handleDragStart}
            onDragEnd={logic.handleDragEnd}
        >
            <div className="flex h-full gap-4">
                {/* LEFT SIDEBAR: PENDING GROUPS */}
                <PendingSidebar
                    pendingSessions={logic.pendingSessions}
                    subjects={logic.state.subjects}
                    viewMode={logic.viewMode}
                    showAllPending={logic.showAllPending}
                    onToggleShowAll={logic.setShowAllPending}
                    isSidebarOpen={logic.isSidebarOpen}
                />

                {/* MAIN CONTENT */}
                <div className="flex-1 space-y-4 flex flex-col min-w-0">
                    <ScheduleHeader />
                    <ScheduleGrid />
                    <AssignmentModal
                        // Modals todavia reciben Props por simplicidad, pero se pueden refactorizar luego.
                        isOpen={!!logic.selectedCell}
                        onClose={logic.closeModal}
                        selectedCell={logic.selectedCell}
                        assignMode={logic.assignMode}
                        selectedGroupId={logic.selectedGroupId}
                        formSubjectId={logic.formSubjectId}
                        formTeacherId={logic.formTeacherId}
                        formClassroomId={logic.formClassroomId}
                        editingAssignmentIds={logic.editingAssignmentIds}
                        pendingSessions={logic.pendingSessions}
                        state={logic.state}
                        viewMode={logic.viewMode}
                        selectedTeacherId={logic.selectedTeacherId}
                        selectedClassroomId={logic.selectedClassroomId}
                        onAssignModeChange={logic.setAssignMode}
                        onGroupSelect={logic.handleGroupSelect}
                        onSubjectChange={logic.setFormSubjectId}
                        onTeacherChange={logic.setFormTeacherId}
                        onClassroomChange={logic.setFormClassroomId}
                        onSave={logic.handleSave}
                    />
                </div>
            </div>

            <DragOverlay>
                {logic.activeId && logic.activeSession ? (
                    <div className="opacity-80 scale-105 shadow-xl rotate-3 transition-transform">
                        <DraggableSession
                            session={logic.activeSession}
                            subjectName={logic.state.subjects.find(s => s.id === logic.activeSession!.subjectId)?.name || 'Materia'}
                        />
                    </div>
                ) : logic.activeId && logic.activeAssignment ? (
                    <div className="opacity-80 scale-105 shadow-xl rotate-2 transition-transform">
                        <div className={`p-3 rounded bg-white border-2 border-blue-400 shadow-xl min-w-[150px]`}>
                            <div className="font-bold text-xs text-slate-800">
                                {logic.state.subjects.find(s => s.id === logic.activeAssignment!.subjectId)?.name}
                            </div>
                            <div className="text-[10px] text-blue-600 font-mono mt-1">
                                {logic.state.courseGroups.find(g => g.id === logic.activeAssignment!.courseGroupId)?.name || 'Manual'}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

const ScheduleView = () => {
    return (
        <ScheduleProvider>
            <ScheduleViewContent />
        </ScheduleProvider>
    );
};

export default ScheduleView;
