import React from 'react';

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${active
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);

export default SidebarItem;
