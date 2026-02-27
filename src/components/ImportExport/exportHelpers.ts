import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AppState } from '../../../types';
import { generateTimeSlots, DAY_NUMBER_MAP, getBlockCode } from '../../../utils';

/**
 * Generates a flat array of objects representing the schedule assignments,
 * formatted for uploading to the university platform.
 */
export const generateExportData = (state: AppState) => {
    const timeSlots = generateTimeSlots();

    return state.courseGroups.map(group => {
        const subject = state.subjects.find(s => s.id === group.subjectId);
        const groupAssignments = state.assignments.filter(a => a.courseGroupId === group.id);

        let firstSlotCode = '';
        let isDiurno = false;
        let firstSlot = null;
        let firstRoom = null;
        let teacher = null;

        if (groupAssignments.length > 0) {
            // Sort to find the chronologically first assignment
            groupAssignments.sort((a, b) => {
                if (a.day !== b.day) {
                    return DAY_NUMBER_MAP[a.day] - DAY_NUMBER_MAP[b.day];
                }
                const slotA = timeSlots.findIndex(s => s.id === a.timeSlotId);
                const slotB = timeSlots.findIndex(s => s.id === b.timeSlotId);
                return slotA - slotB;
            });

            const firstAssignment = groupAssignments[0];
            const slotIndex = timeSlots.findIndex(s => s.id === firstAssignment.timeSlotId);
            firstSlot = timeSlots[slotIndex];

            if (firstSlot) {
                firstSlotCode = getBlockCode(firstAssignment.day, slotIndex).toString();
                // "Diurno" if it starts before 17:50
                isDiurno = firstSlot.start < '17:50';
            }

            firstRoom = state.classrooms.find(c => c.id === firstAssignment.classroomId);
            teacher = state.teachers.find(t => t.id === firstAssignment.teacherId || group.teacherId);
        } else {
            teacher = state.teachers.find(t => t.id === group.teacherId);
        }

        return {
            'camp_code': subject?.sede || 'UP',
            'banner_id_principal': teacher?.institutionalId || '',
            'id_instructor_secundario': '(VACIO)',
            'id_instructor_terciario': '(VACIO)',
            'id_instructor_cuaternario': '(VACIO)',
            'id_instructor_quinario': '(VACIO)',
            'matri_o_periodo': subject?.semester || '',
            'sigla': subject?.sigla || '',
            'tipo': firstRoom?.type || '',
            'seccion': group.name,
            'nrc': '(VACIO)',
            'cupo': group.studentCount || subject?.projectedStudents || 0,
            'listacruzada': '(VACIO)',
            'matu_vesp': firstSlot ? (isDiurno ? 'Diurno' : 'Vespertino') : '',
            'carrera': subject?.carrera || 'MULTIMEDIA Y PROD.AUDIOVISUAL',
            'p1': '(VACIO)',
            'nume_sala': firstRoom?.name || '',
            'h1': firstSlotCode,
            'f1': '(VACIO)',
            'w1': '(VACIO)',
            'cred_progra': subject?.credits || 0,
            'sesion_dictado': '(VACIO)'
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
