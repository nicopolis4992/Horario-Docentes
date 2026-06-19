import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { AppState } from '../../../types';
import { generateTimeSlots, DAY_NUMBER_MAP, getBlockCode } from '../../../utils';

/**
 * Generates a flat array of objects representing the schedule assignments,
 * formatted for uploading to the university platform.
 */
export const generateExportData = (state: AppState) => {
    const timeSlots = generateTimeSlots();
    const rows: any[] = [];

    state.courseGroups.forEach(group => {
        const subject = state.subjects.find(s => s.id === group.subjectId);
        const groupAssignments = state.assignments.filter(a => a.courseGroupId === group.id);
        const teacher = state.teachers.find(t => t.id === group.teacherId);

        // Extract numeric parallel from group name (e.g., "Paralelo 1" -> "1")
        const parallelMatch = group.name.match(/\d+/);
        const paraleloStr = parallelMatch ? parallelMatch[0] : (group.name || '');

        if (groupAssignments.length === 0) {
            // Group has no assignments — export a single row with no schedule data
            rows.push({
                'row_index': '',
                'carrera_code': '',
                'carrera_name': subject?.carrera || 'MULTIMEDIA Y PROD.AUDIOVISUAL',
                'sede': subject?.sede || 'UP',
                'asignatura': subject?.name || 'Materia sin nombre',
                'sigla': subject?.sigla || '',
                'creditos': subject?.credits || 0,
                'nivel': subject?.semester || '',
                'bloque': '',
                'paralelo': paraleloStr,
                'banner_id_principal': teacher?.institutionalId || '',
                'banner_id_secundario': '',
                'banner_id_tercero': '',
                'cupo': 0,
                'matu_vesp': '',
                'virtual': '',
                'need_aula': 'TRUE',
                'tipo': '',
                'nume_sala': '',
                'teor': 'TEO',
                'carpeta_linea': 'TRUE',
                'h1': '',
                'observaciones': subject?.classroomObservations || '',
            });
            return;
        }

        // One row PER assignment (per hour)
        groupAssignments.forEach(assignment => {
            const slotIndex = timeSlots.findIndex(s => s.id === assignment.timeSlotId);
            const slot = slotIndex >= 0 ? timeSlots[slotIndex] : null;
            const room = state.classrooms.find(c => c.id === assignment.classroomId);
            const blockCode = slot ? getBlockCode(assignment.day, slotIndex).toString() : '';
            const isDiurno = slot ? slot.start < '17:50' : false;

            rows.push({
                'row_index': '',
                'carrera_code': '',
                'carrera_name': subject?.carrera || 'MULTIMEDIA Y PROD.AUDIOVISUAL',
                'sede': subject?.sede || 'UP',
                'asignatura': subject?.name || 'Materia sin nombre',
                'sigla': subject?.sigla || '',
                'creditos': subject?.credits || 0,
                'nivel': subject?.semester || '',
                'bloque': '',
                'paralelo': paraleloStr,
                'banner_id_principal': teacher?.institutionalId || '',
                'banner_id_secundario': '',
                'banner_id_tercero': '',
                'cupo': room?.maxCapacity || 0,
                'matu_vesp': slot ? (isDiurno ? 'D' : 'V') : '',
                'virtual': '',
                'need_aula': 'TRUE',
                'tipo': room?.type || '',
                'nume_sala': room?.name || '',
                'teor': 'TEO',
                'carpeta_linea': 'TRUE',
                'h1': blockCode,
                'observaciones': subject?.classroomObservations || '',
            });
        });
    });

    return rows;
};

/**
 * Downloads data as a CSV file.
 */
export const downloadCSV = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: "," });
    // Use BOM for Excel compatibility with UTF-8
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Downloads data as an Excel file (.xlsx).
 */
export const downloadXLSX = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Horarios");
    XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/**
 * Captures an HTML element as an image and downloads it.
 */
export const captureAndDownloadImage = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
            const style = clonedDoc.createElement('style');
            style.textContent = `* { font-family: Arial, Helvetica, sans-serif !important; word-spacing: normal !important; letter-spacing: normal !important; }`;
            clonedDoc.head.appendChild(style);
        }
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
};

/**
 * Captures an HTML element and adds it to a jsPDF instance.
 * Doesn't download directly so we can generate multi-page PDFs.
 */
export const captureToPDF = async (elementId: string, doc: jsPDF, isFirstPage: boolean = false) => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element ${elementId} not found`);

    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
            const style = clonedDoc.createElement('style');
            style.textContent = `* { font-family: Arial, Helvetica, sans-serif !important; word-spacing: normal !important; letter-spacing: normal !important; }`;
            clonedDoc.head.appendChild(style);
        }
    });

    const imgData = canvas.toDataURL('image/png');

    if (!isFirstPage) {
        doc.addPage();
    }

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
};

/**
 * Captures multiple HTML elements and packages them into a ZIP file.
 */
export const captureAllAsZip = async (items: { id: string, name: string }[], filename: string) => {
    const zip = new JSZip();
    const folder = zip.folder(filename);

    if (!folder) throw new Error("Could not create ZIP folder");

    for (const item of items) {
        const element = document.getElementById(`print-grid-${item.id}`);
        if (!element) continue;

        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true,
            onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.textContent = `* { font-family: Arial, Helvetica, sans-serif !important; word-spacing: normal !important; letter-spacing: normal !important; }`;
                clonedDoc.head.appendChild(style);
            }
        });

        // Get base64 data without the data URI prefix
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        folder.file(`${item.name.replace(/[\/\?<>\\:\*\|":]/g, '_')}.png`, imgData, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${filename}.zip`;
    link.click();
};

/**
 * Downloads the entire application state as a JSON file.
 */
export const downloadProjectJSON = (state: AppState, filename: string) => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
};
