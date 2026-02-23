import React from 'react';
import { Classroom, CourseGroup } from '../../../types';
import { Calculator } from 'lucide-react';

interface GeneratorOptionsProps {
    classrooms: Classroom[];
    baseClassroomId: string;
    setBaseClassroomId: (id: string) => void;
    useMaxCapacity: boolean;
    setUseMaxCapacity: (useIdx: boolean) => void;
    previewGroups: Partial<CourseGroup>[];
    onCalculate: () => void;
    onConfirmGroups: () => void;
    onClearPreview: () => void;
}

const GeneratorOptions = ({
    classrooms,
    baseClassroomId,
    setBaseClassroomId,
    useMaxCapacity,
    setUseMaxCapacity,
    previewGroups,
    onCalculate,
    onConfirmGroups,
    onClearPreview
}: GeneratorOptionsProps) => {
    return (
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6 mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-blue-800">
                <Calculator size={20} />
                <h3 className="font-bold">Generador de Paralelos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aula Base (Estrategia)</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                        value={baseClassroomId}
                        onChange={(e) => {
                            setBaseClassroomId(e.target.value);
                            onClearPreview();
                        }}
                    >
                        <option value="">Selecciona un aula...</option>
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} (Cap: {c.recommendedCapacity}/{c.maxCapacity})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center pb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useMaxCapacity}
                            onChange={(e) => {
                                setUseMaxCapacity(e.target.checked);
                                onClearPreview();
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Usar Capacidad Máxima (Riesgo)</span>
                    </label>
                </div>

                <button
                    onClick={onCalculate}
                    disabled={!baseClassroomId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                >
                    Calcular Paralelos
                </button>
            </div>

            {previewGroups.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                        <span>Vista Previa: {previewGroups.length} Grupos Generados</span>
                        <button
                            onClick={onConfirmGroups}
                            className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            Confirmar y Crear
                        </button>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {previewGroups.map((group, idx) => (
                            <div key={idx} className="bg-white border-2 border-dashed border-blue-200 p-3 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between font-bold text-slate-700 mb-2">
                                    <span>{group.name}</span>
                                    <span className="bg-blue-100 text-blue-700 px-2 rounded text-xs flex items-center">{group.studentCount} est.</span>
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    Sugerida: {classrooms.find(c => c.id === group.plannedClassroomId)?.name || 'Ninguna'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratorOptions;
