import React, { useState, useRef } from 'react';
import { Download, FileSpreadsheet, Image as ImageIcon, FileText, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import { useAppStore } from '../../../store';
import { generateExportData, downloadCSV, downloadXLSX, captureAndDownloadImage, captureToPDF, captureAllAsZip, downloadProjectJSON } from './exportHelpers';
import { jsPDF } from 'jspdf';
import { DAYS } from '../Schedule/useScheduleLogic';
import { generateTimeSlots, AREA_CONFIG } from '../../../utils';
import toast from 'react-hot-toast';

const PrintableGrid: React.FC<{ resourceId: string, resourceType: 'teacher' | 'classroom' }> = ({ resourceId, resourceType }) => {
    const { state } = useAppStore();
    const timeSlotsAll = generateTimeSlots();

    // Smart Diurno/Vespertino filter
    const resourceAssignments = state.assignments.filter(a => resourceType === 'teacher' ? a.teacherId === resourceId : a.classroomId === resourceId);
    const hasVespertina = resourceAssignments.some(a => {
        const slot = timeSlotsAll.find(s => s.id === a.timeSlotId);
        return slot && slot.start >= '17:50';
    });
    const timeSlots = hasVespertina ? timeSlotsAll : timeSlotsAll.filter(s => s.start < '17:50');

    return (
        <div id={`print-grid-${resourceId}`} className="bg-white" style={{ width: '1000px', padding: '20px' }}>
            <div className="mb-4 text-center">
                <h2 className="text-xl font-bold text-slate-800">
                    {resourceType === 'teacher'
                        ? state.teachers.find(t => t.id === resourceId)?.name
                        : state.classrooms.find(c => c.id === resourceId)?.name}
                </h2>
                <p className="text-slate-500">Horario Académico</p>
            </div>

            <div className="border-2 border-slate-800 flex flex-col">
                <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b-2 border-slate-800 bg-slate-100">
                    <div className="p-2 border-r border-slate-800 font-bold text-slate-700 text-center text-xs">Hora</div>
                    {DAYS.map(day => (
                        <div key={day} className="p-2 border-r border-slate-800 font-bold text-slate-800 text-center text-xs last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-white">
                    <div className="border-r border-slate-800 flex flex-col">
                        {timeSlots.map(slot => (
                            <div key={slot.id} className="h-[60px] border-b border-slate-200 text-[10px] font-mono text-slate-600 flex flex-col items-center justify-center p-1">
                                <span>{slot.start}</span>
                                <span>{slot.end}</span>
                            </div>
                        ))}
                    </div>

                    {DAYS.map(day => {
                        const dayAssignments = state.assignments.filter(a =>
                            a.day === day &&
                            (resourceType === 'teacher' ? a.teacherId === resourceId : a.classroomId === resourceId)
                        );

                        // Calculate visual blocks
                        const blocks: any[] = [];
                        const sorted = [...dayAssignments].sort((a, b) => {
                            const groupCompare = (a.courseGroupId || '').localeCompare(b.courseGroupId || '');
                            if (groupCompare !== 0) return groupCompare;
                            return timeSlots.findIndex(s => s.id === a.timeSlotId) - timeSlots.findIndex(s => s.id === b.timeSlotId);
                        });

                        sorted.forEach((a: any) => {
                            const idx = timeSlots.findIndex(s => s.id === a.timeSlotId);
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
                                {timeSlots.map(slot => (
                                    <div key={slot.id} className="h-[60px] border-b border-slate-100"></div>
                                ))}

                                {blocks.map(block => {
                                    const { assignment, span, slotIndex } = block;
                                    const subject = state.subjects.find(s => s.id === assignment.subjectId);
                                    const room = state.classrooms.find(c => c.id === assignment.classroomId);
                                    const teacher = state.teachers.find(t => t.id === assignment.teacherId);
                                    const group = state.courseGroups.find(g => g.id === assignment.courseGroupId);
                                    const config = subject ? AREA_CONFIG[subject.area] : AREA_CONFIG['Audiovisual'];

                                    return (
                                        <div
                                            key={assignment.id}
                                            className="absolute left-0 right-0 z-10"
                                            style={{
                                                top: `${slotIndex * 60}px`,
                                                height: `${span * 60}px`,
                                                padding: '2px'
                                            }}
                                        >
                                            <div className={`h-full rounded border-2 ${config.bg} border-${config.color.split('-')[1]}-400 flex flex-col p-1.5 overflow-hidden`}>
                                                <div className="font-bold text-[10px] sm:text-xs text-slate-800 leading-tight">
                                                    {subject?.name || 'Materia'}
                                                </div>
                                                <div className="text-[9px] text-slate-600 mt-0.5">
                                                    {group?.name || 'Clase'}
                                                </div>
                                                <div className="mt-auto pt-1 flex justify-between text-[9px] font-bold text-slate-700">
                                                    <span>
                                                        {resourceType === 'teacher' ? room?.name : teacher?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ExportView = () => {
    const { state } = useAppStore();
    const [exportType, setExportType] = useState<'teacher' | 'classroom'>('teacher');
    const [selectedId, setSelectedId] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    // Detect issues that block export
    const hasIncompleteAssignments = state.assignments.some(a => a.isIncomplete || !a.teacherId || !a.classroomId);

    // Detect overlapping assignments (same teacher or classroom at same day+time)
    const hasOverlaps = (() => {
        const seen = new Set<string>();
        for (const a of state.assignments) {
            const teacherKey = `teacher-${a.teacherId}-${a.day}-${a.timeSlotId}`;
            const roomKey = `room-${a.classroomId}-${a.day}-${a.timeSlotId}`;
            if (seen.has(teacherKey) || seen.has(roomKey)) return true;
            seen.add(teacherKey);
            seen.add(roomKey);
        }
        return false;
    })();

    const hasErrors = hasIncompleteAssignments || hasOverlaps;

    const handleDataExport = (format: 'csv' | 'xlsx') => {
        if (state.assignments.length === 0) {
            toast.error('No hay asignaciones para exportar.');
            return;
        }

        const data = generateExportData(state);
        if (format === 'csv') downloadCSV(data, 'horarios_plataforma');
        else downloadXLSX(data, 'horarios_plataforma');

        toast.success(`Datos descargados en formato ${format.toUpperCase()}`);
    };

    const handleVisualExport = async (format: 'png' | 'pdf' | 'png-zip') => {
        if (!selectedId && format === 'png') {
            toast.error('Seleccione un recurso para exportar PNG individual.');
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading('Generando exportación visual...');

        try {
            if (format === 'png') {
                const name = exportType === 'teacher'
                    ? state.teachers.find(t => t.id === selectedId)?.name
                    : state.classrooms.find(c => c.id === selectedId)?.name;

                await captureAndDownloadImage(`print-grid-${selectedId}`, `Horario_${name?.replace(/\s+/g, '_')}`);
                toast.success('Imagen descargada exitosamente.', { id: toastId });
            } else if (format === 'pdf') {
                // Determine what to export: Just selected or ALL?
                const itemsToExport = selectedId
                    ? [selectedId]
                    : (exportType === 'teacher' ? state.teachers.map(t => t.id) : state.classrooms.map(c => c.id));

                if (itemsToExport.length === 0) {
                    throw new Error('No hay elementos para exportar.');
                }

                // Temporary render all grids for html2canvas
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [1000, 750] // Fixed size matching our printable grid approx
                });

                for (let i = 0; i < itemsToExport.length; i++) {
                    await captureToPDF(`print-grid-${itemsToExport[i]}`, doc, i === 0);
                }

                doc.save(`Horarios_${exportType === 'teacher' ? 'Docentes' : 'Aulas'}.pdf`);
                toast.success('PDF generado exitosamente.', { id: toastId });
            } else if (format === 'png-zip') {
                const itemsToExport = exportType === 'teacher' ? state.teachers : state.classrooms;
                await captureAllAsZip(itemsToExport.map(i => ({ id: i.id, name: i.name })), `Horarios_${exportType === 'teacher' ? 'Docentes' : 'Aulas'}`);
                toast.success(`Se exportaron ${itemsToExport.length} imágenes en ZIP.`, { id: toastId });
            }
        } catch (error: any) {
            toast.error(`Error al exportar: ${error.message}`, { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const list = exportType === 'teacher' ? state.teachers : state.classrooms;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Exportar Datos</h2>
                <p className="text-slate-500 text-sm mt-1">Exporta la tabla de horarios o genera imágenes/PDFs de las cuadrículas.</p>
            </div>

            {hasErrors && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700 text-sm font-medium">
                    <AlertTriangle size={20} className="shrink-0" />
                    <div>
                        <strong>No se puede exportar.</strong> Hay {hasIncompleteAssignments ? 'asignaciones incompletas' : ''}{hasIncompleteAssignments && hasOverlaps ? ' y ' : ''}{hasOverlaps ? 'solapamientos de horario' : ''} que deben resolverse primero.
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Guardar Proyecto Completo */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100 p-6 space-y-6 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Save size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Guardar Proyecto</h3>
                                <p className="text-sm text-slate-600">Descarga un archivo JSON con todos los datos (docentes, materias, aulas y horarios) para continuar después.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const date = new Date().toISOString().split('T')[0];
                                downloadProjectJSON(state, `proyecto_horarios_${date}.json`);
                                toast.success('Proyecto guardado correctamente.');
                            }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm"
                        >
                            <Save size={18} />
                            Guardar Archivo .JSON
                        </button>
                    </div>
                </div>

                {/* Exportar Datos */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Datos para Plataforma</h3>
                            <p className="text-sm text-slate-500">Tabla plana lista para subir a la plataforma institucional.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                            <strong>Columnas incluidas:</strong> Materia, Paralelo (1, 2, 3...), Docente, Aula, Día, Hora Inicio, Hora Fin.
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => handleDataExport('csv')}
                                disabled={hasErrors}
                                className={`flex-1 flex items-center justify-center gap-2 border px-4 py-3 rounded-lg font-bold transition-colors shadow-sm ${hasErrors ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                                    }`}
                            >
                                <Download size={18} /> CSV
                            </button>
                            <button
                                onClick={() => handleDataExport('xlsx')}
                                disabled={hasErrors}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors shadow-sm ${hasErrors ? 'bg-emerald-600/50 text-white/70 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                            >
                                <Download size={18} /> Excel (.xlsx)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Exportar Visual */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 relative overflow-hidden">
                    {isExporting && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-slate-700">Generando documento...</p>
                            <p className="text-sm text-slate-500 text-center max-w-xs px-4">Por favor espere. Generar PDFs múltiples puede tardar unos segundos.</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Exportación Visual</h3>
                            <p className="text-sm text-slate-500">Imágenes (PNG) y Documentos (PDF) de los horarios.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${exportType === 'teacher' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => { setExportType('teacher'); setSelectedId(''); }}
                            >
                                Docentes
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${exportType === 'classroom' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => { setExportType('classroom'); setSelectedId(''); }}
                            >
                                Aulas
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Recurso</label>
                            <select
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                            >
                                <option value="">-- Todos los {exportType === 'teacher' ? 'Docentes' : 'Aulas'} (Solo para PDF) --</option>
                                {list.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <div className="flex flex-col flex-1 gap-2">
                                <button
                                    onClick={() => handleVisualExport('png')}
                                    disabled={!selectedId || hasErrors}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors border ${!selectedId || hasErrors
                                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                                        }`}
                                >
                                    <ImageIcon size={18} />
                                    <span className="text-sm">PNG (1)</span>
                                </button>
                                <button
                                    onClick={() => handleVisualExport('png-zip')}
                                    disabled={hasErrors}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors shadow-sm ${hasErrors
                                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                                        }`}
                                >
                                    <ImageIcon size={18} />
                                    <span className="text-sm">ZIP (Todos)</span>
                                </button>
                            </div>
                            <button
                                onClick={() => handleVisualExport('pdf')}
                                disabled={hasErrors}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-lg font-bold transition-colors shadow-sm ${hasErrors ? 'bg-blue-600/50 text-white/50 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                <FileText size={24} />
                                <span>Descargar PDF</span>
                                <span className="text-[10px] uppercase font-normal text-blue-200 opacity-90">
                                    {selectedId ? 'Solo el seleccionado' : 'Documento multipágina'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render hidden printable grids for html2canvas to capture */}
            <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none" style={{ width: '1000px' }}>
                {list.map(item => (
                    <PrintableGrid key={item.id} resourceId={item.id} resourceType={exportType} />
                ))}
            </div>
        </div>
    );
};

export default ExportView;
