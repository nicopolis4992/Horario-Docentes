import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AppState } from '../../../types';
import { generateTimeSlots } from '../../../utils';

/**
 * Generates a flat array of objects representing the schedule assignments,
 * formatted for uploading to the university platform.
 */
export const generateExportData = (state: AppState) => {
    const timeSlots = generateTimeSlots();

    // Sort assignments logically
    const sortedAssignments = [...state.assignments].sort((a, b) => {
        // Sort by subject name, then group name, then day, then time slot
        const subjectA = state.subjects.find(s => s.id === a.subjectId)?.name || '';
        const subjectB = state.subjects.find(s => s.id === b.subjectId)?.name || '';
        if (subjectA !== subjectB) return subjectA.localeCompare(subjectB);

        const groupA = state.courseGroups.find(g => g.id === a.courseGroupId)?.name || '';
        const groupB = state.courseGroups.find(g => g.id === b.courseGroupId)?.name || '';
        if (groupA !== groupB) return groupA.localeCompare(groupB);

        if (a.day !== b.day) return a.day.localeCompare(b.day);

        const slotA = timeSlots.findIndex(s => s.id === a.timeSlotId);
        const slotB = timeSlots.findIndex(s => s.id === b.timeSlotId);
        return slotA - slotB;
    });

    return sortedAssignments.map(a => {
        const subject = state.subjects.find(s => s.id === a.subjectId);
        const teacher = state.teachers.find(t => t.id === a.teacherId);
        const room = state.classrooms.find(c => c.id === a.classroomId);
        const group = state.courseGroups.find(g => g.id === a.courseGroupId);
        const slot = timeSlots.find(s => s.id === a.timeSlotId);

        return {
            'Materia': subject?.name || 'Materia Desconocida',
            'Paralelo': group?.name || 'Manual',
            'Docente': teacher?.name || 'Sin Asignar',
            'Aula': room?.name || 'Sin Asignar',
            'Día': a.day,
            'Hora Inicio': slot?.start || '',
            'Hora Fin': slot?.end || ''
        };
    });
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
        scale: 2, // Higher resolution
        backgroundColor: '#ffffff',
        logging: false
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
        logging: false
    });

    const imgData = canvas.toDataURL('image/png');

    if (!isFirstPage) {
        doc.addPage();
    }

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
};
