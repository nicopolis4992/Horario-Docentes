import * as XLSX from 'xlsx';
import { Teacher, Subject, Classroom, SubjectArea, ClassroomType, DayOfWeek } from '../../../types';
import { AREA_CONFIG, CLASSROOM_CONFIG } from '../../../utils';

export type ImportTab = 'docentes' | 'materias' | 'aulas';

export const EXPECTED_HEADERS: Record<ImportTab, { required: string[], optional: string[] }> = {
    docentes: {
        required: ['nombre', 'maxHoras'],
        optional: ['id', 'materias']
    },
    materias: {
        required: ['nombre', 'horas', 'estudiantesProyectados'],
        optional: ['area', 'semestre', 'diasPreferidos', 'tipoAula', 'aulasEspecificas', 'sigla', 'carrera', 'sede', 'jornada']
    },
    aulas: {
        required: ['nombre', 'tipo'],
        optional: ['capacidadRecomendada', 'capacidadMaxima']
    }
};

/**
 * Parses an Excel or CSV file and returns the first sheet as a 2D array of strings.
 */
export const parseFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

                // Filter out completely empty rows
                const cleanJson = json.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));

                // Convert all values to string for easy processing
                const stringJson = cleanJson.map(row => row.map(cell => String(cell).trim()));
                resolve(stringJson);
            } catch (err) {
                reject('Error al leer el archivo. Asegúrese de que sea un Excel o CSV válido.');
            }
        };
        reader.onerror = () => reject('Error al leer el archivo.');
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Given headers from the file and expected fields, tries to suggest a column mapping.
 */
export const autoDetectColumns = (
    headers: string[],
    expectedFields: string[]
): Record<string, number> => {
    const map: Record<string, number> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

    expectedFields.forEach(field => {
        const normalizedField = field.toLowerCase();
        const index = normalizedHeaders.findIndex(h => h === normalizedField || h.includes(normalizedField) || normalizedField.includes(h));
        if (index !== -1) {
            map[field] = index;
        }
    });

    return map;
};

// Utils
const parseNumber = (val: string, fallback: number = 0): number => {
    const n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
};

const parseList = (val: string): string[] => {
    if (!val) return [];
    return val.split(';').map(s => s.trim()).filter(Boolean);
};

const getRandomColor = () => {
    const colors = [
        '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
        '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Maps a single row to a Teacher object.
 */
export const mapRowToTeacher = (
    row: string[],
    columnMap: Record<string, number>,
    existingSubjects: Subject[]
): Teacher => {
    const name = row[columnMap['nombre']] || 'Sin Nombre';
    const institutionalId = row[columnMap['id']] || '';
    const maxHours = parseNumber(row[columnMap['maxHoras']], 21);

    // Parse specialties (materia names separated by ;)
    const materiasStr = row[columnMap['materias']] || '';
    const subjectNames = parseList(materiasStr).map(n => n.toLowerCase());

    const allowedSubjectIds: string[] = [];
    subjectNames.forEach(subName => {
        const found = existingSubjects.find(s => s.name.toLowerCase() === subName);
        if (found) {
            allowedSubjectIds.push(found.id);
        }
    });

    return {
        id: crypto.randomUUID(),
        institutionalId: institutionalId || undefined,
        name,
        maxHours,
        color: getRandomColor(),
        unavailableSlots: [],
        allowedSubjectIds
    };
};

/**
 * Maps a single row to a Subject object.
 */
export const mapRowToSubject = (
    row: string[],
    columnMap: Record<string, number>,
    existingClassrooms: Classroom[] // Needed to map "aulasEspecificas" (names -> ids)
): Subject => {
    const name = row[columnMap['nombre']] || 'Sin Nombre';
    const sigla = row[columnMap['sigla']] || undefined;
    const carrera = row[columnMap['carrera']] || 'MULTIMEDIA Y PROD.AUDIOVISUAL';
    const sede = row[columnMap['sede']] || 'UP';
    const credits = parseNumber(row[columnMap['horas']], 2);
    const projectedStudents = parseNumber(row[columnMap['estudiantesProyectados']], 30);

    const semesterStr = row[columnMap['semestre']];
    const semester = semesterStr ? parseNumber(semesterStr, 1) : undefined;

    // Area
    const rawArea = row[columnMap['area']] || '';
    let area: SubjectArea = 'Audiovisual';
    if (rawArea.toLowerCase().includes('animaci')) area = 'Animación';
    if (rawArea.toLowerCase().includes('interact')) area = 'Interactividad';

    // preferredDays
    const daysStr = row[columnMap['diasPreferidos']] || '';
    const preferredDays = parseList(daysStr).map(d => {
        const lower = d.toLowerCase();
        if (lower.startsWith('lun')) return 'Lunes';
        if (lower.startsWith('mar')) return 'Martes';
        if (lower.startsWith('mi')) return 'Miércoles';
        if (lower.startsWith('jue')) return 'Jueves';
        if (lower.startsWith('vie')) return 'Viernes';
        if (lower.startsWith('sáb') || lower.startsWith('sab')) return 'Sábado';
        return '';
    }).filter(Boolean) as DayOfWeek[];

    const rawTipoAula = row[columnMap['tipoAula']] || '';
    let requiredClassroomType: ClassroomType | undefined = undefined;
    if (rawTipoAula) {
        if (rawTipoAula.toLowerCase().includes('pc')) requiredClassroomType = 'PC';
        else if (rawTipoAula.toLowerCase().includes('mac')) requiredClassroomType = 'MAC';
        else requiredClassroomType = 'AULA';
    }

    // aulasEspecificas
    const aulasEspecifStr = row[columnMap['aulasEspecificas']] || '';
    const aulaNames = parseList(aulasEspecifStr).map(n => n.toLowerCase());
    const allowedClassroomIds: string[] = [];
    aulaNames.forEach(roomName => {
        const found = existingClassrooms.find(c => c.name.toLowerCase() === roomName);
        if (found) {
            allowedClassroomIds.push(found.id);
        }
    });

    // Jornada
    const rawJornada = row[columnMap['jornada']] || '';
    let jornada: 'diurna' | 'vespertina' | undefined = undefined;
    if (rawJornada) {
        const lower = rawJornada.toLowerCase().trim();
        if (lower === 'd' || lower === 'diurna') jornada = 'diurna';
        else if (lower === 'v' || lower === 'vespertina') jornada = 'vespertina';
    }

    return {
        id: crypto.randomUUID(),
        name,
        sigla,
        carrera,
        sede,
        semester,
        credits,
        projectedStudents,
        area,
        ...(preferredDays.length > 0 && { preferredDays }),
        ...(requiredClassroomType && { allowedClassroomTypes: [requiredClassroomType] }),
        ...(allowedClassroomIds.length > 0 && { allowedClassroomIds }),
        ...(jornada && { jornada }),
        sessionPattern: [credits] // Default pattern is 1 block of N hours
    };
};

/**
 * Maps a single row to a Classroom object.
 */
export const mapRowToClassroom = (
    row: string[],
    columnMap: Record<string, number>
): Classroom => {
    const name = row[columnMap['nombre']] || 'Sin Nombre';

    // tipo
    const rawTipo = row[columnMap['tipo']] || '';
    let type: ClassroomType = 'AULA';
    if (rawTipo.toLowerCase().includes('pc')) type = 'PC';
    if (rawTipo.toLowerCase().includes('mac')) type = 'MAC';

    const maxCapacityStr = row[columnMap['capacidadMaxima']];
    const maxCapacity = maxCapacityStr ? parseNumber(maxCapacityStr, 40) : 40;

    const recommendedStr = row[columnMap['capacidadRecomendada']];
    const recommendedCapacity = recommendedStr ? parseNumber(recommendedStr, maxCapacity) : maxCapacity;

    return {
        id: crypto.randomUUID(),
        name,
        type,
        maxCapacity,
        recommendedCapacity
    };
};

/**
 * Generates and downloads a dummy CSV template for each module.
 */
export const downloadTemplate = (tab: ImportTab) => {
    let csvContent = "";
    let filename = "";

    if (tab === 'docentes') {
        const headers = [...EXPECTED_HEADERS.docentes.required, ...EXPECTED_HEADERS.docentes.optional].join(',');
        const row1 = "Ana García,21,ID001,Edición de Video;Guionismo";
        const row2 = "Carlos López,15,ID002,";
        csvContent = [headers, row1, row2].join('\n');
        filename = "plantilla_docentes.csv";
    }
    else if (tab === 'materias') {
        const headers = [...EXPECTED_HEADERS.materias.required, ...EXPECTED_HEADERS.materias.optional].join(',');
        const row1 = "Edición de Video,3,57,Audiovisual,3,Lunes;Miércoles;Viernes,PC,PC 1;PC 2,AUD101,MULTIMEDIA Y PROD.AUDIOVISUAL,UP,D";
        const row2 = "Programación I,4,40,Interactividad,1,,,,,,,,A";
        csvContent = [headers, row1, row2].join('\n');
        filename = "plantilla_materias.csv";
    }
    else if (tab === 'aulas') {
        const headers = [...EXPECTED_HEADERS.aulas.required, ...EXPECTED_HEADERS.aulas.optional].join(',');
        const row1 = "Aula 101,AULA,25,30";
        const row2 = "Lab PC 1,PC,25,25";
        csvContent = [headers, row1, row2].join('\n');
        filename = "plantilla_aulas.csv";
    }

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel formatting
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
