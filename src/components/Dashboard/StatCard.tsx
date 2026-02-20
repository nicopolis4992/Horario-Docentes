import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: any, color: string, subtext?: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="text-white" size={24} />
        </div>
    </div>
);

export default StatCard;
