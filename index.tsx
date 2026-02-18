import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, useAppStore } from './store';
import { Teacher, Subject, Classroom, SubjectArea, ClassroomType, DayOfWeek, TimeSlot, ScheduleAssignment, CourseGroup } from './types';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  School, 
  CalendarDays, 
  Menu,
  X,
  Plus,
  Trash2,
  Edit,
  Mail,
  Clock,
  Palette,
  Check,
  Settings,
  Beaker,
  Armchair,
  GraduationCap,
  Clapperboard,
  MousePointer2,
  Sparkles,
  Monitor,
  MonitorPlay,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Info,
  Filter,
  Search,
  ChevronRight,
  User,
  MapPin,
  ListTodo,
  Calculator,
  ArrowRight,
  Link,
  Layers
} from 'lucide-react';
import { generateTimeSlots, AREA_CONFIG, CLASSROOM_CONFIG } from './utils';

// --- Shared UI Components ---

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode; maxWidth?: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-fade-in transition-all`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

const OfferPlannerView = () => {
  const { state, dispatch } = useAppStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // Generator State
  const [baseClassroomId, setBaseClassroomId] = useState<string>('');
  const [useMaxCapacity, setUseMaxCapacity] = useState(false);
  const [previewGroups, setPreviewGroups] = useState<Partial<CourseGroup>[]>([]);

  // Delete Confirmation State
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const selectedSubject = useMemo(() => 
    state.subjects.find(s => s.id === selectedSubjectId), 
    [state.subjects, selectedSubjectId]
  );

  const existingGroups = useMemo(() => 
    state.courseGroups.filter(g => g.subjectId === selectedSubjectId),
    [state.courseGroups, selectedSubjectId]
  );

  const handleCalculate = () => {
    if (!selectedSubject || !baseClassroomId) return;

    const classroom = state.classrooms.find(c => c.id === baseClassroomId);
    if (!classroom) return;

    const capacity = useMaxCapacity ? classroom.maxCapacity : classroom.recommendedCapacity;
    const totalStudents = selectedSubject.projectedStudents;
    
    const numberOfGroups = Math.ceil(totalStudents / capacity);
    
    const newGroups: Partial<CourseGroup>[] = [];
    let studentsRemaining = totalStudents;

    for (let i = 0; i < numberOfGroups; i++) {
      // Logic: Fill capacity until last group
      const count = Math.min(capacity, studentsRemaining);
      studentsRemaining -= count;

      newGroups.push({
        id: crypto.randomUUID(), // Temp ID
        subjectId: selectedSubject.id,
        name: `Paralelo ${String.fromCharCode(65 + i)}`, // A, B, C...
        studentCount: count,
        totalHours: selectedSubject.credits,
        plannedClassroomId: classroom.id // Default to base classroom
      });
    }
    setPreviewGroups(newGroups);
  };

  const handleUpdatePreview = (index: number, field: keyof CourseGroup, value: any) => {
    const updated = [...previewGroups];
    updated[index] = { ...updated[index], [field]: value };
    setPreviewGroups(updated);
  };

  const handleConfirmGroups = () => {
    if (previewGroups.length === 0) return;
    dispatch({
      type: 'BULK_ADD_COURSE_GROUPS',
      payload: previewGroups as CourseGroup[]
    });
    setPreviewGroups([]);
    setBaseClassroomId('');
  };

  const handleDeleteGroupClick = (groupId: string) => {
    setGroupToDelete(groupId);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      dispatch({ type: 'DELETE_COURSE_GROUP', payload: groupToDelete });
      setGroupToDelete(null);
    }
  };

  const handleUpdateGroupTeacher = (group: CourseGroup, teacherId: string) => {
    dispatch({
      type: 'UPDATE_COURSE_GROUP',
      payload: { ...group, teacherId }
    });
  };

  const handleUpdateGroupRoom = (group: CourseGroup, roomId: string) => {
    dispatch({
      type: 'UPDATE_COURSE_GROUP',
      payload: { ...group, plannedClassroomId: roomId }
    });
  };

  // Improved Load Calculation Helper
  const getTeacherTotalLoad = (teacherId: string, excludeGroupId?: string) => {
    // 1. Planned Groups Load: Sum totalHours of all groups assigned to teacher (except the one being edited)
    const groupsLoad = state.courseGroups
      .filter(g => g.teacherId === teacherId && g.id !== excludeGroupId)
      .reduce((acc, g) => acc + g.totalHours, 0);
      
    // 2. Manual Assignments Load: Count assignments that are NOT linked to any course group (ad-hoc)
    // We assume 1 assignment = 1 hour for MVP simplicity
    const manualLoad = state.assignments
      .filter(a => a.teacherId === teacherId && !a.courseGroupId)
      .length;

    return groupsLoad + manualLoad;
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-6 pb-20 lg:pb-0">
      {/* LEFT: Subjects List */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 max-h-[300px] lg:max-h-none">
        <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
          <h3 className="font-bold text-slate-800">Materias Ofertadas</h3>
          <p className="text-xs text-slate-500">Selecciona una materia para planificar sus paralelos.</p>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {state.subjects.map(subject => {
            const groups = state.courseGroups.filter(g => g.subjectId === subject.id);
            const totalPlannedStudents = groups.reduce((acc, g) => acc + g.studentCount, 0);
            const isFullyPlanned = totalPlannedStudents >= subject.projectedStudents;
            const config = AREA_CONFIG[subject.area];

            return (
              <button
                key={subject.id}
                onClick={() => {
                  setSelectedSubjectId(subject.id);
                  setPreviewGroups([]); // Reset preview when changing subject
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSubjectId === subject.id
                    ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                    {subject.area}
                  </span>
                  {isFullyPlanned ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 mt-1"></span>
                  )}
                </div>
                <h4 className={`font-bold text-sm ${selectedSubjectId === subject.id ? 'text-blue-900' : 'text-slate-700'}`}>
                  {subject.name}
                </h4>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-slate-500">
                    {groups.length} grupos creados
                  </span>
                  <span className={`text-xs font-mono font-medium ${isFullyPlanned ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {totalPlannedStudents}/{subject.projectedStudents} est.
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isFullyPlanned ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, (totalPlannedStudents / subject.projectedStudents) * 100)}%` }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Workspace */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
        {!selectedSubject ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <ListTodo size={48} className="opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-slate-600">Planificador de Oferta</h3>
            <p className="max-w-md">Selecciona una materia de la izquierda para comenzar a definir cuántos paralelos abrir y qué docentes asignarlos.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header Subject Info */}
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      {selectedSubject.name}
                      <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {selectedSubject.projectedStudents} Estudiantes Proyectados
                      </span>
                    </h2>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                       <span className="flex items-center gap-1"><Clock size={14} /> {selectedSubject.credits} Horas/Semana</span>
                       <span className="flex items-center gap-1"><GraduationCap size={14} /> {AREA_CONFIG[selectedSubject.area].label}</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              {/* --- GENERATOR SECTION (If no groups exist or want to add more) --- */}
              {existingGroups.length === 0 && (
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
                          setPreviewGroups([]); // Reset preview on room change
                        }}
                      >
                        <option value="">Selecciona un aula...</option>
                        {state.classrooms.map(c => (
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
                              setPreviewGroups([]); // Reset
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Usar Capacidad Máxima (Riesgo)</span>
                       </label>
                    </div>

                    <button 
                      onClick={handleCalculate}
                      disabled={!baseClassroomId}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                    >
                      Calcular Paralelos
                    </button>
                  </div>

                  {/* PREVIEW AREA */}
                  {previewGroups.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <h4 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                        <span>Vista Previa: {previewGroups.length} Grupos Generados</span>
                        <button 
                          onClick={handleConfirmGroups}
                          className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Confirmar y Crear
                        </button>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {previewGroups.map((group, idx) => (
                           <div key={idx} className="bg-white border-2 border-dashed border-blue-200 p-3 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
                              <div className="flex justify-between font-bold text-slate-700 mb-2">
                                <span>{group.name}</span>
                                <span className="bg-blue-100 text-blue-700 px-2 rounded text-xs flex items-center">{group.studentCount} est.</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                Aula sugerida: {state.classrooms.find(c => c.id === group.plannedClassroomId)?.name}
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- EXISTING GROUPS LIST (Editor) --- */}
              {existingGroups.length > 0 && (
                <div>
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-700">Paralelos Activos ({existingGroups.length})</h3>
                      <button 
                        onClick={() => {
                          // Manually add a single group
                           dispatch({
                            type: 'ADD_COURSE_GROUP',
                            payload: {
                              id: crypto.randomUUID(),
                              subjectId: selectedSubject.id,
                              name: `Nuevo Grupo`,
                              studentCount: 0,
                              totalHours: selectedSubject.credits,
                              plannedClassroomId: '' 
                            }
                           })
                        }}
                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                      >
                        <Plus size={14} /> Agregar Manualmente
                      </button>
                   </div>

                   <div className="space-y-4">
                      {existingGroups.map(group => {
                        const assignedTeacher = state.teachers.find(t => t.id === group.teacherId);
                        
                        // Calculate base load (everything EXCEPT this group)
                        const baseLoad = assignedTeacher ? getTeacherTotalLoad(assignedTeacher.id, group.id) : 0;
                        const projectedLoadIfKept = baseLoad + group.totalHours;
                        const isOverloaded = assignedTeacher && projectedLoadIfKept > assignedTeacher.maxHours;

                        return (
                          <div key={group.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                             
                             {/* Group Info */}
                             <div className="min-w-[120px]">
                                <h4 className="font-bold text-slate-800 text-lg">{group.name}</h4>
                                <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit mt-1">
                                  <Users size={14} />
                                  <input 
                                    type="number" 
                                    value={group.studentCount}
                                    onChange={(e) => dispatch({ 
                                      type: 'UPDATE_COURSE_GROUP', 
                                      payload: { ...group, studentCount: parseInt(e.target.value) || 0 }
                                    })}
                                    className="bg-transparent w-10 outline-none text-center font-bold"
                                  />
                                  <span>est.</span>
                                </div>
                             </div>

                             {/* Teacher Selector */}
                             <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Docente Asignado</label>
                                <select 
                                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 transition-colors ${
                                    !group.teacherId 
                                      ? 'border-amber-300 bg-amber-50 text-amber-900' 
                                      : isOverloaded 
                                        ? 'border-red-300 bg-red-50 text-red-900' 
                                        : 'border-slate-300 bg-white text-slate-900'
                                  }`}
                                  value={group.teacherId || ''}
                                  onChange={(e) => handleUpdateGroupTeacher(group, e.target.value)}
                                >
                                  <option value="">-- Sin Asignar --</option>
                                  {state.teachers.map(t => {
                                    // Calculate projected load if we select THIS teacher
                                    const tBaseLoad = getTeacherTotalLoad(t.id, group.id); // Exclude current group from base
                                    const tProjected = tBaseLoad + group.totalHours;
                                    const willBeOverloaded = tProjected > t.maxHours;
                                    
                                    return (
                                      <option key={t.id} value={t.id} className={willBeOverloaded ? 'text-red-500' : ''}>
                                        {t.name} (Total: {tProjected}/{t.maxHours}h) {willBeOverloaded ? '⚠️' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                                {isOverloaded && (
                                  <div className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Carga excedida ({projectedLoadIfKept}/{assignedTeacher?.maxHours}h)
                                  </div>
                                )}
                             </div>

                             {/* Classroom Selector (The requested feature: change room per group) */}
                             <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Aula Preferida</label>
                                <select 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                                  value={group.plannedClassroomId || ''}
                                  onChange={(e) => handleUpdateGroupRoom(group, e.target.value)}
                                >
                                  <option value="">-- Cualquiera --</option>
                                  {state.classrooms.map(c => {
                                    // Validation: Is room big enough?
                                    const isTooSmall = c.maxCapacity < group.studentCount;
                                    return (
                                      <option key={c.id} value={c.id} className={isTooSmall ? 'text-red-500' : ''}>
                                        {c.name} (Cap: {c.maxCapacity}) {isTooSmall ? '⚠️' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                             </div>

                             {/* Actions */}
                             <button 
                               type="button"
                               onClick={() => handleDeleteGroupClick(group.id)}
                               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                               title="Eliminar paralelo"
                             >
                               <Trash2 size={18} />
                             </button>

                          </div>
                        );
                      })}
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={!!groupToDelete}
            onClose={() => setGroupToDelete(null)}
            title="Eliminar Paralelo"
            maxWidth="max-w-sm"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                   <AlertTriangle size={24} className="shrink-0" />
                   <p className="text-sm font-medium">Esta acción es irreversible y eliminará todas las clases agendadas para este grupo.</p>
                </div>
                <p className="text-slate-600 text-sm">
                    ¿Estás seguro de que deseas eliminar este paralelo?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                    <button 
                        onClick={() => setGroupToDelete(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDeleteGroup}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </Modal>
      </div>
    </div>
  );
};

const TeachersView = () => {
  const { state, dispatch } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    email: '',
    maxHours: 21,
    color: '#3B82F6',
    unavailableSlots: []
  });
  
  // Controls if we are showing the custom input field
  const [isCustomHoursMode, setIsCustomHoursMode] = useState(false);
  
  // Matrix helpers
  const timeSlots = generateTimeSlots();
  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', 
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
  ];

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData(teacher);
      // If the hours are not 15 or 21, enable custom mode automatically
      setIsCustomHoursMode(![15, 21].includes(teacher.maxHours));
    } else {
      setEditingTeacher(null);
      setFormData({ 
        name: '', 
        email: '', 
        maxHours: 21, 
        color: colors[Math.floor(Math.random() * colors.length)],
        unavailableSlots: []
      });
      setIsCustomHoursMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingTeacher) {
      dispatch({ 
        type: 'UPDATE_TEACHER', 
        payload: { ...editingTeacher, ...formData } as Teacher 
      });
    } else {
      dispatch({ 
        type: 'ADD_TEACHER', 
        payload: { 
          id: crypto.randomUUID(), 
          ...formData 
        } as Teacher 
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este docente? Se borrarán sus asignaciones.')) {
      dispatch({ type: 'DELETE_TEACHER', payload: id });
    }
  };

  // Matrix Logic
  const toggleSlotAvailability = (day: DayOfWeek, slotId: string) => {
    const key = `${day}-${slotId}`;
    const currentUnavailable = formData.unavailableSlots || [];
    
    let newUnavailable;
    if (currentUnavailable.includes(key)) {
      newUnavailable = currentUnavailable.filter(k => k !== key);
    } else {
      newUnavailable = [...currentUnavailable, key];
    }
    setFormData({ ...formData, unavailableSlots: newUnavailable });
  };

  const toggleDayAvailability = (day: DayOfWeek) => {
    const dayKeys = timeSlots.map(slot => `${day}-${slot.id}`);
    const currentUnavailable = formData.unavailableSlots || [];
    const allBlocked = dayKeys.every(key => currentUnavailable.includes(key));

    let newUnavailable;
    if (allBlocked) {
      // Unblock all
      newUnavailable = currentUnavailable.filter(k => !dayKeys.includes(k));
    } else {
      // Block all (add missing ones)
      const missing = dayKeys.filter(k => !currentUnavailable.includes(k));
      newUnavailable = [...currentUnavailable, ...missing];
    }
    setFormData({ ...formData, unavailableSlots: newUnavailable });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Docentes</h2>
          <p className="text-slate-500 text-sm">Gestiona la planta docente y sus cargas horarias.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Nuevo Docente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.teachers.map((teacher) => {
          // Calculate stats for the card
          const teacherAssignments = state.assignments.filter(a => a.teacherId === teacher.id);
          const assignedHours = teacherAssignments.length; // Assuming 1 slot = 1 hour
          const uniqueSubjectIds = Array.from(new Set(teacherAssignments.map(a => a.subjectId)));
          const subjectNames = uniqueSubjectIds
            .map(sid => state.subjects.find(s => s.id === sid)?.name)
            .filter((n): n is string => !!n);

          return (
            <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative group">
               <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(teacher)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(teacher.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>

               <div className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: teacher.color }}
                  >
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{teacher.name}</h3>
                    <div className="flex items-center text-slate-500 text-xs mt-1 space-x-2">
                      <Mail size={12} />
                      <span className="truncate">{teacher.email || 'Sin correo'}</span>
                    </div>
                  </div>
               </div>

               <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 shrink-0">
                    <Clock size={16} className="text-slate-400" />
                    <span>
                      <span className={assignedHours > teacher.maxHours ? "text-red-600 font-bold" : "font-semibold text-slate-800"}>
                        {assignedHours}
                      </span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-500">{teacher.maxHours}h</span>
                    </span>
                  </div>
                  
                  <div className="flex-1 flex justify-end">
                    {subjectNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {subjectNames.slice(0, 2).map(name => (
                          <span key={name} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 max-w-[100px] truncate">
                            {name}
                          </span>
                        ))}
                        {subjectNames.length > 2 && (
                          <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-200">
                            +{subjectNames.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin asignación</span>
                    )}
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL - Now Wider */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Basic Info (4 columns) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                  <Users size={16} className="mr-2" />
                  Información Personal
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="juan@universidad.edu"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                   <Clock size={16} className="mr-2 text-slate-400" />
                   Carga Horaria
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 21].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, maxHours: hours});
                          setIsCustomHoursMode(false);
                        }}
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-all ${
                          !isCustomHoursMode && formData.maxHours === hours 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-lg font-bold">{hours}h</span>
                        <span className="text-[10px] uppercase">Semanal</span>
                      </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                          setIsCustomHoursMode(true);
                        }}
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-all ${
                          isCustomHoursMode
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Settings size={20} className="mb-1" />
                        <span className="text-[10px] uppercase">Otro</span>
                    </button>
                  </div>
                  
                  {isCustomHoursMode && (
                    <div className="animate-fade-in">
                      <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                          <input 
                            type="number"
                            min="1"
                            max="40"
                            className="w-full outline-none text-slate-900 bg-transparent placeholder-slate-400"
                            value={formData.maxHours}
                            onChange={(e) => setFormData({...formData, maxHours: parseInt(e.target.value) || 0})}
                            placeholder="Ingrese horas"
                          />
                          <span className="text-slate-400 text-sm ml-2">Horas/Semana</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color de Identificación</label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({...formData, color: c})}
                      className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${
                        formData.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formData.color === c && <Check size={14} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Availability Matrix (8 columns) */}
            <div className="lg:col-span-8 flex flex-col h-full">
               <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2 text-base">
                          <CalendarDays size={20} className="text-slate-500" />
                          Matriz de Disponibilidad
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Define los horarios en los que el docente <strong>NO puede</strong> impartir clases.
                        </p>
                      </div>
                      <div className="flex gap-4 text-xs bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></div>
                          <span className="text-slate-600 font-medium">Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded-sm flex items-center justify-center">
                            <X size={10} className="text-red-400" />
                          </div>
                          <span className="text-slate-600 font-medium">Bloqueado</span>
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto bg-white rounded-lg border border-slate-200 shadow-inner p-1">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-px bg-slate-100 border border-slate-100">
                          {/* Header Row */}
                          <div className="bg-slate-50 sticky top-0 left-0 z-10"></div> {/* Corner */}
                          {days.map(day => (
                            <button 
                              key={day} 
                              type="button"
                              onClick={() => toggleDayAvailability(day)}
                              className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 sticky top-0 z-0 transition-colors"
                            >
                              {day}
                            </button>
                          ))}

                          {/* Time Slots */}
                          {timeSlots.map(slot => (
                            <React.Fragment key={slot.id}>
                              {/* Row Header (Time) */}
                              <div className="bg-slate-50 p-2 text-[10px] font-mono font-medium text-slate-500 flex items-center justify-end border-r border-slate-100 whitespace-nowrap">
                                {slot.start} - {slot.end}
                              </div>
                              
                              {/* Cells */}
                              {days.map(day => {
                                const isUnavailable = formData.unavailableSlots?.includes(`${day}-${slot.id}`);
                                return (
                                  <button
                                    key={`${day}-${slot.id}`}
                                    type="button"
                                    onClick={() => toggleSlotAvailability(day, slot.id)}
                                    className={`h-10 transition-all duration-150 relative group ${
                                      isUnavailable
                                        ? 'bg-red-50 hover:bg-red-100'
                                        : 'bg-white hover:bg-emerald-50'
                                    }`}
                                  >
                                    {isUnavailable && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <X size={16} className="text-red-400 opacity-70" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors font-medium shadow-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-bold shadow-lg shadow-blue-200"
            >
              {editingTeacher ? 'Guardar Cambios' : 'Registrar Docente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const SubjectsView = () => {
  const { state, dispatch } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  // Controls if we are showing the custom input field for credits
  const [isCustomCreditsMode, setIsCustomCreditsMode] = useState(false);

  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    credits: 2,
    projectedStudents: 30,
    area: 'Audiovisual' // Default
  });

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData(subject);
      // Check if credits is one of standard options
      setIsCustomCreditsMode(![1, 2, 3].includes(subject.credits));
    } else {
      setEditingSubject(null);
      setFormData({ name: '', credits: 2, projectedStudents: 30, area: 'Audiovisual' });
      setIsCustomCreditsMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = { 
      ...(editingSubject || { id: crypto.randomUUID() }), 
      ...formData 
    } as Subject;

    if (editingSubject) {
      dispatch({ type: 'UPDATE_SUBJECT', payload });
    } else {
      dispatch({ type: 'ADD_SUBJECT', payload });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar materia? Se borrarán sus asignaciones.')) {
      dispatch({ type: 'DELETE_SUBJECT', payload: id });
    }
  };

  const getAreaIcon = (area: SubjectArea) => {
    switch (area) {
      case 'Audiovisual': return Clapperboard;
      case 'Animación': return Sparkles;
      case 'Interactividad': return MousePointer2;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Materias</h2>
          <p className="text-slate-500 text-sm">Define el plan académico y sus áreas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Nueva Materia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.subjects.map((subject) => {
          const config = AREA_CONFIG[subject.area] || AREA_CONFIG['Audiovisual'];
          const AreaIcon = getAreaIcon(subject.area);
          
          return (
            <div key={subject.id} className={`bg-white rounded-xl shadow-sm border ${config.border} p-5 hover:shadow-md transition-shadow relative group`}>
               <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(subject)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(subject.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>

               <div className="flex items-start space-x-4 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} ${config.iconColor} flex items-center justify-center shrink-0`}>
                    <AreaIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                     {/* Swapped Title and Area Subtitle */}
                    <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{subject.name}</h3>
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${config.iconColor}`}>
                      {subject.area}
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Duración</span>
                    <div className="flex items-center space-x-1 text-slate-700 font-medium">
                      <Clock size={14} className="text-slate-400" />
                      <span>{subject.credits} horas</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Proyección</span>
                    <div className="flex items-center space-x-1 text-slate-700 font-medium">
                      <Users size={14} className="text-slate-400" />
                      <span>{subject.projectedStudents} est.</span>
                    </div>
                  </div>
               </div>
            </div>
          );
        })}
        
        {state.subjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay materias registradas.</p>
            <button onClick={() => handleOpenModal()} className="text-emerald-600 hover:underline mt-2">
              Crear la primera
            </button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Editar Materia' : 'Nueva Materia'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Materia</label>
            <input 
              autoFocus
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Cálculo I"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Eje / Área</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AREA_CONFIG) as SubjectArea[]).map((area) => {
                 const config = AREA_CONFIG[area];
                 const isSelected = formData.area === area;
                 return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setFormData({...formData, area})}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? `${config.bg} ${config.border} ${config.iconColor} ring-1 ring-offset-1 ring-${config.color.split('-')[1]}-400` 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? config.iconColor.replace('text', 'bg') : 'bg-slate-300'}`}></div>
                    {area}
                  </button>
                 );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Horas por Sesión</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setFormData({...formData, credits: h});
                    setIsCustomCreditsMode(false);
                  }}
                  className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-all ${
                    !isCustomCreditsMode && formData.credits === h 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold mr-1">{h}</span>
                  {!isCustomCreditsMode && formData.credits === h && <Check size={14} className="ml-0.5" />}
                </button>
              ))}
               <button
                  type="button"
                  onClick={() => setIsCustomCreditsMode(true)}
                  className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-all ${
                    isCustomCreditsMode
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Personalizado"
                >
                  <Settings size={16} />
              </button>
            </div>
            
            {isCustomCreditsMode && (
              <div className="mt-3 animate-fade-in">
                 <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-white">
                    <input 
                      type="number"
                      min="1"
                      max="8"
                      className="w-full outline-none text-slate-900 bg-transparent placeholder-slate-400"
                      value={formData.credits}
                      onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value) || 0})}
                      placeholder="Ingrese horas"
                    />
                    <span className="text-slate-400 text-sm ml-2">Horas</span>
                 </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estudiantes Proyectados</label>
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-white">
              <input 
                type="number" 
                min="1"
                required
                className="w-full outline-none text-slate-900 bg-transparent placeholder-slate-400"
                value={formData.projectedStudents}
                onChange={e => setFormData({...formData, projectedStudents: parseInt(e.target.value) || 0})}
              />
              <span className="text-slate-400 text-sm ml-2">Alumnos</span>
            </div>
          </div>

          <div className="pt-4 flex space-x-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium shadow-sm"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ClassroomsView = () => {
  const { state, dispatch } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);

  const [formData, setFormData] = useState<Partial<Classroom>>({
    name: '',
    type: 'Aula',
    recommendedCapacity: 30,
    maxCapacity: 40
  });

  const handleOpenModal = (room?: Classroom) => {
    if (room) {
      setEditingRoom(room);
      setFormData(room);
    } else {
      setEditingRoom(null);
      setFormData({ name: '', type: 'Aula', recommendedCapacity: 30, maxCapacity: 40 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = { 
      ...(editingRoom || { id: crypto.randomUUID() }), 
      ...formData 
    } as Classroom;

    if (editingRoom) {
      dispatch({ type: 'UPDATE_CLASSROOM', payload });
    } else {
      dispatch({ type: 'ADD_CLASSROOM', payload });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar aula?')) {
      dispatch({ type: 'DELETE_CLASSROOM', payload: id });
    }
  };

  const getClassroomIcon = (type: ClassroomType) => {
    switch (type) {
      case 'Lab PC': return Monitor;
      case 'Lab Mac': return MonitorPlay;
      default: return Armchair;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Aulas</h2>
          <p className="text-slate-500 text-sm">Gestiona espacios físicos y sus capacidades.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Nueva Aula</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.classrooms.map((room) => {
          const config = CLASSROOM_CONFIG[room.type] || CLASSROOM_CONFIG['Aula'];
          const Icon = getClassroomIcon(room.type);
          
          return (
            <div key={room.id} className={`bg-white rounded-xl shadow-sm border ${config.border} p-5 hover:shadow-md transition-shadow relative group`}>
               <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(room)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(room.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>

               <div className="flex items-start space-x-4 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.iconColor}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800">{room.name}</h3>
                    <p className={`text-xs font-semibold ${config.iconColor}`}>{room.type}</p>
                  </div>
               </div>

               <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Recomendado</span>
                    <span className="font-semibold text-slate-800">{room.recommendedCapacity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Máximo</span>
                    <span className="font-semibold text-red-600">{room.maxCapacity}</span>
                  </div>
                  
                  {/* Capacity Visual Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${config.iconColor.replace('text', 'bg')}`}
                      style={{ width: `${(room.recommendedCapacity / room.maxCapacity) * 100}%` }} 
                      title="Recomendado"
                    />
                    <div className="bg-red-200 h-full flex-1" title="Zona Crítica" />
                  </div>
               </div>
            </div>
          );
        })}

        {state.classrooms.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <School size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay aulas registradas.</p>
            <button onClick={() => handleOpenModal()} className="text-indigo-600 hover:underline mt-2">
              Registrar espacio
            </button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Editar Aula' : 'Nueva Aula'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Código</label>
            <input 
              autoFocus
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Aula 101, Lab Física"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Espacio</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CLASSROOM_CONFIG) as ClassroomType[]).map((type) => {
                 const config = CLASSROOM_CONFIG[type];
                 const isSelected = formData.type === type;
                 return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? `${config.bg} ${config.border} ${config.iconColor} ring-1 ring-offset-1 ring-${config.color.split('-')[1]}-400` 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                     <div className={`w-2 h-2 rounded-full ${isSelected ? config.iconColor.replace('text', 'bg') : 'bg-slate-300'}`}></div>
                    <span className="font-medium">{type}</span>
                  </button>
                 );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cap. Recomendada</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                value={formData.recommendedCapacity}
                onChange={e => setFormData({...formData, recommendedCapacity: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cap. Máxima</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                value={formData.maxCapacity}
                onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
             * La capacidad recomendada se usará para alertas preventivas.
          </p>

          <div className="pt-4 flex space-x-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium shadow-sm"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ScheduleView = () => {
  const { state, dispatch } = useAppStore();
  const timeSlots = generateTimeSlots();
  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // View Mode: 'teachers' or 'classrooms'
  const [viewMode, setViewMode] = useState<'teachers' | 'classrooms'>('teachers');
  
  // Selection State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  // Modal State
  const [selectedCell, setSelectedCell] = useState<{ day: DayOfWeek; slot: TimeSlot } | null>(null);
  
  // Modal Form State
  const [assignMode, setAssignMode] = useState<'group' | 'manual'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formClassroomId, setFormClassroomId] = useState('');

  // Course Group Status Logic
  const groupStatus = useMemo(() => {
    return state.courseGroups.map(group => {
      // Logic assumes 1 hour = 1 slot (simplification for MVP)
      const assignedCount = state.assignments.filter(a => a.courseGroupId === group.id).length;
      return {
        ...group,
        assignedCount,
        remaining: group.totalHours - assignedCount,
        isComplete: assignedCount >= group.totalHours
      };
    });
  }, [state.courseGroups, state.assignments]);

  const pendingGroups = useMemo(() => groupStatus.filter(g => !g.isComplete), [groupStatus]);

  // Handle Tab Change
  const handleTabChange = (mode: 'teachers' | 'classrooms') => {
    setViewMode(mode);
  };

  // Helper to open modal based on current context
  const openAssignmentModal = (day: DayOfWeek, slot: TimeSlot) => {
    setSelectedCell({ day, slot });
    
    // Auto-fill context
    if (viewMode === 'teachers' && selectedTeacherId) {
      setFormTeacherId(selectedTeacherId);
      setFormClassroomId('');
    } else if (viewMode === 'classrooms' && selectedClassroomId) {
      setFormClassroomId(selectedClassroomId);
      setFormTeacherId('');
    } else {
      setFormTeacherId('');
      setFormClassroomId('');
    }
    setFormSubjectId('');
    setSelectedGroupId('');
    
    // Default to 'group' mode if there are pending groups, else 'manual'
    setAssignMode(pendingGroups.length > 0 ? 'group' : 'manual');
  };

  const closeModal = () => {
    setSelectedCell(null);
    setFormSubjectId('');
    setFormTeacherId('');
    setFormClassroomId('');
    setSelectedGroupId('');
  };

  // Handle Group Selection change
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (!groupId) return;

    const group = state.courseGroups.find(g => g.id === groupId);
    if (group) {
      setFormSubjectId(group.subjectId);
      if (group.teacherId) setFormTeacherId(group.teacherId);
      if (group.plannedClassroomId) setFormClassroomId(group.plannedClassroomId);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !formSubjectId || !formTeacherId || !formClassroomId) return;

    dispatch({
      type: 'ADD_ASSIGNMENT',
      payload: {
        id: crypto.randomUUID(),
        day: selectedCell.day,
        timeSlotId: selectedCell.slot.id,
        subjectId: formSubjectId,
        teacherId: formTeacherId,
        classroomId: formClassroomId,
        courseGroupId: assignMode === 'group' ? selectedGroupId : undefined
      }
    });
    closeModal();
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (confirm('¿Quitar materia de este horario?')) {
      dispatch({ type: 'DELETE_ASSIGNMENT', payload: assignmentId });
    }
  };

  return (
    <div className="flex h-full gap-4">
      
      {/* LEFT SIDEBAR: PENDING GROUPS */}
      <div className="hidden lg:flex flex-col w-64 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers size={16} /> Pendientes
          </h3>
          <p className="text-xs text-slate-500">Paralelos por agendar</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
           {pendingGroups.length === 0 ? (
             <div className="text-center p-4 text-slate-400 text-xs italic">
               Todo planificado 🎉
             </div>
           ) : (
             pendingGroups.map(group => {
               const subject = state.subjects.find(s => s.id === group.subjectId);
               const progress = (group.assignedCount / group.totalHours) * 100;
               return (
                 <div key={group.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-slate-700 line-clamp-1">{subject?.name}</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 rounded">{group.name}</span>
                    </div>
                    <div className="flex justify-between items-end text-[10px] text-slate-500 mb-1">
                       <span>{group.remaining}h restantes</span>
                       <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-400" style={{ width: `${progress}%` }}></div>
                    </div>
                 </div>
               );
             })
           )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 space-y-4 flex flex-col min-w-0">
        {/* HEADER: Title + Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Planificador</h2>
            <p className="text-slate-500 text-sm">Organiza las clases de la semana.</p>
          </div>
          
          {/* TABS */}
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => handleTabChange('teachers')}
              className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                viewMode === 'teachers' 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User size={18} />
              Docentes
            </button>
            <button
              onClick={() => handleTabChange('classrooms')}
              className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                viewMode === 'classrooms' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin size={18} />
              Aulas
            </button>
          </div>
        </div>

        {/* SELECTION BAR (Horizontal Scroll) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">
              {viewMode === 'teachers' ? 'Selecciona un Docente' : 'Selecciona un Aula'}
          </p>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {viewMode === 'teachers' ? (
                // TEACHERS LIST
                state.teachers.length > 0 ? (
                  state.teachers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-[160px] ${
                        selectedTeacherId === t.id
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          selectedTeacherId === t.id ? 'bg-white text-blue-600' : 'text-white'
                        }`}
                        style={{ backgroundColor: selectedTeacherId === t.id ? undefined : t.color }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium truncate">{t.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 italic px-2">No hay docentes registrados.</div>
                )
              ) : (
                // CLASSROOMS LIST
                state.classrooms.length > 0 ? (
                  state.classrooms.map(c => {
                    const config = CLASSROOM_CONFIG[c.type];
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClassroomId(c.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-[140px] ${
                          selectedClassroomId === c.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${selectedClassroomId === c.id ? 'bg-white' : config.iconColor.replace('text', 'bg')}`}></div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-bold leading-none">{c.name}</span>
                          <span className={`text-[10px] leading-none mt-1 ${selectedClassroomId === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>{c.type}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-sm text-slate-400 italic px-2">No hay aulas registradas.</div>
                )
              )}
          </div>
        </div>

        {/* SCHEDULE GRID */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0 relative">
          
          {/* Empty State Overlay if no selection */}
          {((viewMode === 'teachers' && !selectedTeacherId) || (viewMode === 'classrooms' && !selectedClassroomId)) && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                {viewMode === 'teachers' ? <User size={32} className="text-slate-400" /> : <MapPin size={32} className="text-slate-400" />}
              </div>
              <h3 className="text-xl font-bold text-slate-700">
                {viewMode === 'teachers' ? 'Ningún docente seleccionado' : 'Ninguna aula seleccionada'}
              </h3>
              <p className="text-slate-500 mt-2 max-w-md">
                Selecciona un {viewMode === 'teachers' ? 'docente' : 'aula'} de la lista superior para ver y gestionar su horario.
              </p>
            </div>
          )}

          {/* Header Grid */}
          <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="p-3 border-r border-slate-200"></div> {/* Corner */}
            {days.map(day => (
              <div key={day} className="p-3 text-center font-bold text-slate-700 text-sm border-r border-slate-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-[80px_repeat(6,1fr)]">
              {timeSlots.map((slot) => (
                  <React.Fragment key={slot.id}>
                    {/* Time Label */}
                    <div className="p-2 border-b border-r border-slate-100 bg-slate-50 text-[10px] font-mono text-slate-500 flex flex-col items-center justify-center text-center">
                        <span>{slot.start}</span>
                        <span className="w-full h-px bg-slate-200 my-1"></span>
                        <span>{slot.end}</span>
                    </div>

                    {/* Days Columns */}
                    {days.map((day) => {
                        // Filter logic based on viewMode
                        let assignment: ScheduleAssignment | undefined;
                        let isBlocked = false;

                        if (viewMode === 'teachers' && selectedTeacherId) {
                          assignment = state.assignments.find(a => 
                            a.day === day && 
                            a.timeSlotId === slot.id && 
                            a.teacherId === selectedTeacherId
                          );
                          
                          // Check blocked slots for teacher
                          const teacher = state.teachers.find(t => t.id === selectedTeacherId);
                          if (teacher && teacher.unavailableSlots?.includes(`${day}-${slot.id}`)) {
                            isBlocked = true;
                          }

                        } else if (viewMode === 'classrooms' && selectedClassroomId) {
                          assignment = state.assignments.find(a => 
                            a.day === day && 
                            a.timeSlotId === slot.id && 
                            a.classroomId === selectedClassroomId
                          );
                        }

                        // Render Assignment Card
                        if (assignment) {
                          const subject = state.subjects.find(s => s.id === assignment.subjectId);
                          const teacher = state.teachers.find(t => t.id === assignment.teacherId);
                          const room = state.classrooms.find(c => c.id === assignment.classroomId);
                          const areaConfig = subject ? AREA_CONFIG[subject.area] : AREA_CONFIG['Audiovisual'];
                          const group = state.courseGroups.find(g => g.id === assignment?.courseGroupId);

                          return (
                            <div key={`${day}-${slot.id}`} className="border-b border-r border-slate-100 p-1 min-h-[100px] relative group">
                              <div className={`w-full h-full rounded p-2 ${areaConfig?.bg} ${areaConfig?.border} border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
                                  
                                  {/* Header: Depends on View */}
                                  <div className="mb-1">
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${areaConfig?.iconColor}`}>
                                        {viewMode === 'teachers' ? room?.name : teacher?.name}
                                    </div>
                                    <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">
                                        {subject?.name}
                                    </div>
                                    {group && <div className="text-[10px] bg-white/50 px-1 rounded inline-block mt-0.5">{group.name}</div>}
                                  </div>
                                  
                                  {/* Footer: Depends on View */}
                                  <div className="mt-1">
                                    {viewMode === 'teachers' ? (
                                        // Teacher View: Show nothing extra or maybe time
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                          <Clock size={10} />
                                          <span>1h</span>
                                        </div>
                                    ) : (
                                        // Classroom View: Show Students + Teacher Info Summary
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1.5">
                                            <Users size={10} className="text-slate-400" />
                                            <span className="text-[10px] font-medium text-slate-600">
                                              {subject?.projectedStudents} est.
                                            </span>
                                          </div>
                                        </div>
                                    )}
                                  </div>
                                  
                                  {/* Hover Actions */}
                                  <button 
                                    onClick={() => handleDeleteAssignment(assignment!.id)}
                                    className="absolute top-1 right-1 p-1 bg-white rounded-full shadow border border-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-20"
                                    title="Eliminar asignación"
                                  >
                                    <X size={12} />
                                  </button>
                              </div>
                            </div>
                          );
                        }

                        // Render Empty Cell
                        return (
                          <div 
                            key={`${day}-${slot.id}`} 
                            className={`border-b border-r border-slate-100 min-h-[100px] p-1 relative group transition-colors ${
                              isBlocked ? 'bg-slate-100' : 'hover:bg-slate-50'
                            }`}
                          >
                            {!isBlocked ? (
                              <button 
                                onClick={() => openAssignmentModal(day, slot)}
                                // Disable if no selection
                                disabled={(!selectedTeacherId && viewMode === 'teachers') || (!selectedClassroomId && viewMode === 'classrooms')}
                                className="w-full h-full rounded border-2 border-dashed border-transparent group-hover:border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-all disabled:cursor-not-allowed disabled:group-hover:border-transparent disabled:group-hover:text-slate-300"
                              >
                                <Plus size={24} />
                              </button>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-30 cursor-not-allowed" title="Horario bloqueado por el docente">
                                <Ban size={24} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        );
                    })}
                  </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ASSIGNMENT MODAL */}
        <Modal
          isOpen={!!selectedCell}
          onClose={closeModal}
          title="Asignar Materia"
        >
          <div className="mb-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
            <Clock size={16} />
            <span>
              Horario: <strong>{selectedCell?.day}</strong> de <strong>{selectedCell?.slot.start}</strong> a <strong>{selectedCell?.slot.end}</strong>
            </span>
          </div>

          {/* Strategy Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
             <button
               type="button"
               onClick={() => setAssignMode('group')}
               className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                 assignMode === 'group' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               Planificado (Recomendado)
             </button>
             <button
               type="button"
               onClick={() => setAssignMode('manual')}
               className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                 assignMode === 'manual' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               Manual / Ad-hoc
             </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* GROUP SELECTION (If in Group Mode) */}
            {assignMode === 'group' && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-2">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Grupo Planificado</label>
                <select
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                  value={selectedGroupId}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                  required={assignMode === 'group'}
                >
                  <option value="">-- Selecciona un paralelo pendiente --</option>
                  {pendingGroups.map(g => {
                     const sub = state.subjects.find(s => s.id === g.subjectId);
                     return (
                       <option key={g.id} value={g.id}>
                         {sub?.name} - {g.name} (Faltan {g.remaining}h)
                       </option>
                     )
                  })}
                  {pendingGroups.length === 0 && <option disabled>No hay grupos pendientes</option>}
                </select>
                {selectedGroupId && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Se autocompletaron los datos del grupo.
                  </p>
                )}
              </div>
            )}

            {/* Subject Select (Disabled if group mode selected) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Materia</label>
              <select 
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 ${
                    assignMode === 'group' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                  value={formSubjectId}
                  onChange={e => setFormSubjectId(e.target.value)}
                  required
                  disabled={assignMode === 'group'}
              >
                  <option value="">Selecciona una materia...</option>
                  {state.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.area})</option>
                  ))}
              </select>
            </div>

            {/* Teacher Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Docente</label>
              {viewMode === 'teachers' && selectedTeacherId ? (
                  // Locked Input (Context Aware)
                  <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 flex items-center justify-between">
                    <span>{state.teachers.find(t => t.id === selectedTeacherId)?.name}</span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Fijo</span>
                  </div>
              ) : (
                <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={formTeacherId}
                    onChange={e => setFormTeacherId(e.target.value)}
                    required
                >
                    <option value="">Selecciona un docente...</option>
                    {state.teachers.map(t => {
                      if (!selectedCell) return null;
                      
                      const unavailableKey = `${selectedCell.day}-${selectedCell.slot.id}`;
                      const isBlocked = t.unavailableSlots?.includes(unavailableKey);
                      
                      const isBusy = state.assignments.some(a => 
                          a.teacherId === t.id && 
                          a.day === selectedCell.day && 
                          a.timeSlotId === selectedCell.slot.id
                      );
                      
                      const isDisabled = isBlocked || isBusy;
                      let statusLabel = "";
                      if (isBlocked) statusLabel = "(No disponible)";
                      if (isBusy) statusLabel = "(Ya tiene clase)";

                      return (
                        <option key={t.id} value={t.id} disabled={isDisabled} className={isDisabled ? 'text-slate-400' : ''}>
                          {t.name} {statusLabel}
                        </option>
                      );
                    })}
                </select>
              )}
            </div>

            {/* Classroom Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aula</label>
              {viewMode === 'classrooms' && selectedClassroomId ? (
                  // Locked Input (Context Aware)
                  <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 flex items-center justify-between">
                    <span>{state.classrooms.find(c => c.id === selectedClassroomId)?.name}</span>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Fijo</span>
                  </div>
              ) : (
                <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={formClassroomId}
                    onChange={e => setFormClassroomId(e.target.value)}
                    required
                >
                    <option value="">Selecciona un aula...</option>
                    {state.classrooms.map(c => {
                      if (!selectedCell) return null;

                      const isOccupied = state.assignments.some(a => 
                          a.classroomId === c.id && 
                          a.day === selectedCell.day && 
                          a.timeSlotId === selectedCell.slot.id
                      );

                      return (
                        <option key={c.id} value={c.id} disabled={isOccupied} className={isOccupied ? 'text-slate-400' : ''}>
                          {c.name} ({c.type}) {isOccupied ? '- Ocupada' : ''}
                        </option>
                      );
                    })}
                </select>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex space-x-3">
              <button 
                type="button" 
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm"
              >
                Asignar
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

// --- Other Views (Placeholders) ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      active 
        ? 'bg-blue-50 text-blue-600 font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
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

const DashboardView = () => {
  const { state } = useAppStore();
  const timeSlots = generateTimeSlots();

  // Calculate stats
  const totalTeachers = state.teachers.length;
  const totalStudents = state.subjects.reduce((acc, s) => acc + s.projectedStudents, 0);
  const totalClassrooms = state.classrooms.length;
  
  // Calculate slots info
  const firstSlot = timeSlots[0]?.start;
  const lastSlot = timeSlots[timeSlots.length - 1]?.end;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Panel General</h2>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Semestre 2024-1
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Docentes Activos" 
          value={totalTeachers} 
          icon={Users} 
          color="bg-blue-500"
          subtext="2 con carga completa"
        />
        <StatCard 
          title="Materias Ofertadas" 
          value={state.subjects.length} 
          icon={BookOpen} 
          color="bg-emerald-500" 
          subtext={`${totalStudents} estudiantes proyectados`}
        />
        <StatCard 
          title="Aulas Disponibles" 
          value={totalClassrooms} 
          icon={School} 
          color="bg-indigo-500" 
          subtext="Capacidad total: 120"
        />
        <StatCard 
          title="Bloques Horarios" 
          value={timeSlots.length} 
          icon={CalendarDays} 
          color="bg-amber-500" 
          subtext={`De ${firstSlot} a ${lastSlot}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Estado de la Planificación</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Materias Asignadas</span>
              <span>0%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
            
            <div className="flex justify-between text-sm text-slate-600">
              <span>Aulas Ocupadas</span>
              <span>0%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
             <button className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <span className="flex items-center space-x-2 text-slate-700">
                  <Users size={18} />
                  <span>Registrar nuevo docente</span>
                </span>
                <Plus size={16} className="text-slate-400" />
             </button>
             <button className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <span className="flex items-center space-x-2 text-slate-700">
                  <BookOpen size={18} />
                  <span>Crear nueva materia</span>
                </span>
                <Plus size={16} className="text-slate-400" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('teachers'); // Default to offer planning
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <CalendarDays className="text-blue-600" />
              <span>UniScheduler</span>
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-2">
              Principal
            </div>
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <SidebarItem 
              icon={ListTodo} 
              label="Oferta Académica" 
              active={activeTab === 'offer_planning'} 
              onClick={() => setActiveTab('offer_planning')} 
            />
            <SidebarItem 
              icon={CalendarDays} 
              label="Planificador" 
              active={activeTab === 'schedule'} 
              onClick={() => setActiveTab('schedule')} 
            />

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">
              Gestión
            </div>
            <SidebarItem 
              icon={Users} 
              label="Docentes" 
              active={activeTab === 'teachers'} 
              onClick={() => setActiveTab('teachers')} 
            />
            <SidebarItem 
              icon={BookOpen} 
              label="Materias" 
              active={activeTab === 'subjects'} 
              onClick={() => setActiveTab('subjects')} 
            />
            <SidebarItem 
              icon={School} 
              label="Aulas" 
              active={activeTab === 'classrooms'} 
              onClick={() => setActiveTab('classrooms')} 
            />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center space-x-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                AD
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Admin User</p>
                <p className="text-xs text-slate-500">Coordinador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="bg-white border-b border-slate-200 lg:hidden p-4 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-700">UniScheduler</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto h-full">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'offer_planning' && <OfferPlannerView />}
            {activeTab === 'schedule' && <ScheduleView />}
            {activeTab === 'teachers' && <TeachersView />}
            {activeTab === 'subjects' && <SubjectsView />}
            {activeTab === 'classrooms' && <ClassroomsView />}
          </div>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);