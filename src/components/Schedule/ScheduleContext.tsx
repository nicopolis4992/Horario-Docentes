import React, { createContext, useContext } from 'react';
import { useScheduleLogic } from './useScheduleLogic';

type ScheduleLogicReturn = ReturnType<typeof useScheduleLogic>;

const ScheduleContext = createContext<ScheduleLogicReturn | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: React.ReactNode }) => {
    const logic = useScheduleLogic();
    return (
        <ScheduleContext.Provider value={logic}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useScheduleContext = () => {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useScheduleContext must be used within a ScheduleProvider');
    }
    return context;
};
