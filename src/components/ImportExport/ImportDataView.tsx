import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../../store';
import toast from 'react-hot-toast';
import {
    ImportTab,
    EXPECTED_HEADERS,
    parseFile,
    autoDetectColumns,
    mapRowToTeacher,
    mapRowToSubject,
    mapRowToClassroom,
    downloadTemplate
} from './importHelpers';
import { Teacher, Subject, Classroom } from '../../../types';

const TABS: { id: ImportTab; label: string }[] = [
    { id: 'docentes', label: 'Docentes' },
    { id: 'materias', label: 'Materias' },
    { id: 'aulas', label: 'Aulas' }
];

const ImportDataView = () => {
    const { state, dispatch } = useAppStore();
    const [activeTab, setActiveTab] = useState<ImportTab>('docentes');

    // File state
    const [file, setFile] = useState<File | null>(null);
    const [isFileHovered, setIsFileHovered] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    // Data state
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<string[][]>([]);
    const [columnMap, setColumnMap] = useState<Record<string, number>>({});
    const [replaceData, setReplaceData] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTabChange = (tab: ImportTab) => {
        setActiveTab(tab);
        resetState();
    };

    const resetState = () => {
        setFile(null);
        setRawHeaders([]);
        setRawRows([]);
        setColumnMap({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsParsing(true);
        try {
            const data = await parseFile(selectedFile);
            if (data.length < 2) {
                toast.error('El archivo parece estar vacío o no tiene suficientes filas.');
                resetState();
                return;
            }

            const headers = data[0];
            const rows = data.slice(1);

            setRawHeaders(headers);
            setRawRows(rows);

            // Auto-detect columns
            const expected = [...EXPECTED_HEADERS[activeTab].required, ...EXPECTED_HEADERS[activeTab].optional];
            const detectedMap = autoDetectColumns(headers, expected);
            setColumnMap(detectedMap);

            toast.success(`Archivo cargado: ${rows.length} filas encontradas.`);
        } catch (error: any) {
            toast.error(error.toString());
            resetState();
        } finally {
            setIsParsing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsFileHovered(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const getMissingRequiredFields = () => {
        const required = EXPECTED_HEADERS[activeTab].required;
        return required.filter(req => columnMap[req] === undefined);
    };

    const handleImport = () => {
        const missing = getMissingRequiredFields();
        if (missing.length > 0) {
            toast.error(`Faltan mapear campos obligatorios: ${missing.join(', ')}`);
            return;
        }

        try {
            if (activeTab === 'docentes') {
                const newTeachers = rawRows.map(row => mapRowToTeacher(row, columnMap, state.subjects));
                if (replaceData) {
                    dispatch({ type: 'BULK_SET_TEACHERS', payload: newTeachers });
                } else {
                    newTeachers.forEach(t => {
                        const existing = state.teachers.find(ext => ext.name.toLowerCase() === t.name.toLowerCase());
                        if (existing) {
                            dispatch({ type: 'UPDATE_TEACHER', payload: { ...t, id: existing.id } });
                        } else {
                            dispatch({ type: 'ADD_TEACHER', payload: t });
                        }
                    });
                }
                toast.success(`Se importaron ${newTeachers.length} docentes exitosamente.`);
            }
            else if (activeTab === 'materias') {
                const newSubjects = rawRows.map(row => mapRowToSubject(row, columnMap, state.classrooms));
                if (replaceData) {
                    dispatch({ type: 'BULK_SET_SUBJECTS', payload: newSubjects });
                } else {
                    newSubjects.forEach(s => {
                        const existing = state.subjects.find(ext => ext.name.toLowerCase() === s.name.toLowerCase());
                        if (existing) {
                            dispatch({ type: 'UPDATE_SUBJECT', payload: { ...s, id: existing.id } });
                        } else {
                            dispatch({ type: 'ADD_SUBJECT', payload: s });
                        }
                    });
                }
                toast.success(`Se importaron ${newSubjects.length} materias exitosamente.`);
            }
            else if (activeTab === 'aulas') {
                const newClassrooms = rawRows.map(row => mapRowToClassroom(row, columnMap));
                if (replaceData) {
                    dispatch({ type: 'BULK_SET_CLASSROOMS', payload: newClassrooms });
                } else {
                    newClassrooms.forEach(c => {
                        const existing = state.classrooms.find(ext => ext.name.toLowerCase() === c.name.toLowerCase());
                        if (existing) {
                            dispatch({ type: 'UPDATE_CLASSROOM', payload: { ...c, id: existing.id } });
                        } else {
                            dispatch({ type: 'ADD_CLASSROOM', payload: c });
                        }
                    });
                }
                toast.success(`Se importaron ${newClassrooms.length} aulas exitosamente.`);
            }
            resetState();
        } catch (error: any) {
            toast.error(`Error de importación: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Importar Datos</h2>
                    <p className="text-slate-500 text-sm mt-1">Carga información desde archivos Excel, CSV o proyectos JSON.</p>
                </div>
            </div>

            {/* Cargar Proyecto Completo */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-100 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Cargar Proyecto Completo</h3>
                            <p className="text-sm text-slate-600">Restaura un proyecto guardado anteriormente en formato JSON. <strong className="text-rose-600">¡Esto sobrescribirá la información actual!</strong></p>
                        </div>
                    </div>

                    <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        id="project-upload"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const loadedState = JSON.parse(event.target?.result as string);
                                        if (loadedState.teachers && loadedState.subjects && loadedState.classrooms) {
                                            dispatch({ type: 'LOAD_STATE', payload: loadedState });
                                            toast.success('Proyecto cargado exitosamente.');
                                        } else {
                                            toast.error('El archivo JSON no tiene el formato correcto.');
                                        }
                                    } catch (error) {
                                        toast.error('Error al leer el archivo JSON.');
                                    }
                                    // Reset input
                                    e.target.value = '';
                                };
                                reader.readAsText(file);
                            }
                        }}
                    />
                    <button
                        onClick={() => document.getElementById('project-upload')?.click()}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Upload size={18} />
                        Cargar Archivo .JSON
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id
                            ? 'bg-white shadow-sm text-emerald-700'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {!file && (
                    <div
                        className={`p-12 text-center transition-colors border-2 border-dashed m-4 rounded-xl ${isFileHovered ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setIsFileHovered(true); }}
                        onDragLeave={() => setIsFileHovered(false)}
                        onDrop={handleDrop}
                    >
                        <FileSpreadsheet size={48} className={`mx-auto mb-4 ${isFileHovered ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Sube tu archivo para {activeTab}</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                            Arrastra y suelta un archivo .xlsx o .csv aquí, o haz clic en el botón para seleccionarlo desde tus documentos.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFile(e.target.files[0]);
                                }
                            }}
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isParsing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center gap-2"
                            >
                                {isParsing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={18} />}
                                <span>Seleccionar archivo</span>
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadTemplate(activeTab);
                                }}
                                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center gap-2"
                            >
                                <Download size={18} />
                                <span>Descargar Plantilla ({activeTab})</span>
                            </button>
                        </div>
                    </div>
                )}

                {file && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{file.name}</h3>
                                    <p className="text-sm text-slate-500">{rawRows.length} filas detectadas</p>
                                </div>
                            </div>
                            <button
                                onClick={resetState}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Mapping Section */}
                        <div className="mb-8">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <ArrowRight size={18} className="text-slate-400" />
                                Mapeo de Columnas
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {EXPECTED_HEADERS[activeTab].required.map(field => (
                                    <div key={field} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                                {field} <span className="text-red-500">*</span>
                                            </span>
                                            {columnMap[field] === undefined && <AlertCircle size={14} className="text-red-500" />}
                                            {columnMap[field] !== undefined && <CheckCircle2 size={14} className="text-emerald-500" />}
                                        </div>
                                        <select
                                            className={`w-full p-2 text-sm rounded border ${columnMap[field] === undefined ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-300'} outline-none`}
                                            value={columnMap[field] ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                                                setColumnMap(prev => {
                                                    const next = { ...prev };
                                                    if (val === undefined) delete next[field];
                                                    else next[field] = val;
                                                    return next;
                                                });
                                            }}
                                        >
                                            <option value="">-- Seleccionar Columna --</option>
                                            {rawHeaders.map((h, i) => (
                                                <option key={i} value={i}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                                {EXPECTED_HEADERS[activeTab].optional.map(field => (
                                    <div key={field} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{field}</span>
                                            {columnMap[field] !== undefined && <CheckCircle2 size={14} className="text-emerald-500" />}
                                        </div>
                                        <select
                                            className="w-full p-2 text-sm rounded border border-slate-300 outline-none"
                                            value={columnMap[field] ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                                                setColumnMap(prev => {
                                                    const next = { ...prev };
                                                    if (val === undefined) delete next[field];
                                                    else next[field] = val;
                                                    return next;
                                                });
                                            }}
                                        >
                                            <option value="">-- No Importar --</option>
                                            {rawHeaders.map((h, i) => (
                                                <option key={i} value={i}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="mb-8">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <ArrowRight size={18} className="text-slate-400" />
                                Previsualización (Primeras 5 filas)
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {rawHeaders.map((header, i) => {
                                                const isMapped = Object.values(columnMap).includes(i);
                                                return (
                                                    <th key={i} className={`px-4 py-3 ${isMapped ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-400'}`}>
                                                        {header}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawRows.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                {row.map((cell, j) => {
                                                    const isMapped = Object.values(columnMap).includes(j);
                                                    return (
                                                        <td key={j} className={`px-4 py-3 truncate max-w-[200px] ${isMapped ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                                            {cell || '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={replaceData}
                                    onChange={(e) => setReplaceData(e.target.checked)}
                                />
                                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${replaceData ? 'bg-red-500' : 'bg-slate-300'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${replaceData ? 'translate-x-4' : ''}`} />
                                </div>
                                <div>
                                    <span className={`text-sm font-bold ${replaceData ? 'text-red-700' : 'text-slate-700'}`}>Reemplazar datos existentes</span>
                                    <p className="text-xs text-slate-500">Si está activo, borrará los {activeTab} actuales antes de importar.</p>
                                </div>
                            </label>

                            <button
                                onClick={handleImport}
                                disabled={getMissingRequiredFields().length > 0}
                                className={`px-8 py-2.5 rounded-lg font-bold transition-all shadow-sm ${getMissingRequiredFields().length > 0
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
                                    }`}
                            >
                                Importar {rawRows.length} Registros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
                <AlertCircle className="text-blue-500 shrink-0" />
                <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>Consejos de Importación:</strong></p>
                    <ul className="list-disc pl-4 space-y-1 text-blue-700">
                        <li>Usa la primera fila del archivo para los nombres de las columnas (cabeceras).</li>
                        <li>Para campos que aceptan múltiples valores (como <i>Días Preferidos</i> o <i>Especialidades</i>), sEpara cada valor con un punto y coma "<b>;</b>" (ej. <code>Lunes;Miércoles</code>).</li>
                        <li>Las cabeceras se detectan automáticamente si los nombres son similares, pero asegúrate de revisarlas.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ImportDataView;
