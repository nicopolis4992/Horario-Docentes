import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarItemProps {
    icon: any;
    label: string;
    to: string;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, onClick }: SidebarItemProps) => {
    const location = useLocation();

    // Check if current path matches the 'to' prop
    // Handle root path specially to match '/dashboard' conceptually if needed, 
    // or exact matches for others.
    const isActive = location.pathname === to || (location.pathname === '/' && to === '/dashboard');

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

export default SidebarItem;
