

# Bitácora de Desarrollo (DevLog)

Este documento registra el progreso cronológico, las decisiones técnicas tomadas y los hitos alcanzados, alineados con el [Roadmap](./roadmap.md).

## Fase 1: Cimientos y Estructura Base
**Estado:** ✅ Completado
**Fecha:** Inicio del proyecto

### Hitos Alcanzados:
1.  **Definición del Dominio (`types.ts`)**: Interfaces base y tipos estrictos.
2.  **Motor de Tiempo (`utils.ts`)**: Generación dinámica de slots.
3.  **Gestión de Estado (`store.tsx`)**: Context API + LocalStorage.
4.  **Interfaz Base (`index.tsx`)**: Layout, Sidebar y Dashboard.

---

## Fase 2: Gestión de Recursos
**Estado:** ✅ Completado
**Fecha:** Fase intermedia

### Hitos Alcanzados:
1.  **CRUD Completo:** Docentes, Aulas y Materias.
2.  **Gestión de Docentes:**
    *   Matriz de disponibilidad visual.
    *   Validación de carga horaria.
3.  **Gestión de Aulas:** Tipología y capacidades (Recomendada vs Máxima).
4.  **UI/UX:** Uso de colores semánticos por Área Académica.

---

## Fase 2.5: Gestión de Oferta Académica
**Estado:** ✅ Completado
**Fecha:** Fase intermedia

### Problema Detectado:
Necesidad de instanciar materias abstractas en grupos concretos ("Paralelos") antes de agendar.

### Solución Implementada (`OfferPlannerView`):
1.  **Entidad `CourseGroup`:** Intermediario entre Materia y Horario.
2.  **Generador de Paralelos:** Cálculo automático basado en proyección de estudiantes y capacidad de aula.
3.  **Pre-asignación:** Posibilidad de definir docente y aula preferida antes de ir al calendario.

---

## Fase 3: Integración de Horario (El Planificador)
**Estado:** ✅ Completado
**Fecha:** Actualidad

### Hitos Alcanzados:
1.  **Integración Oferta -> Horario:**
    *   Se implementó una **Sidebar de Pendientes** en la vista de Horario. Muestra los grupos creados en la fase anterior y su progreso de asignación (ej. "Faltan 2h").
    *   Esto cierra el ciclo: Planificación -> Ejecución.

2.  **Doble Perspectiva (View Modes):**
    *   **Vista por Docentes:** Permite ver la carga de un profesor específico. Útil para validar huecos y descansos.
    *   **Vista por Aulas:** Permite ver la ocupación de un espacio físico. Fundamental para evitar conflictos de salón.
    *   *Detalle UI:* Se añadió una barra de selección horizontal con scroll para navegar entre recursos (docentes/aulas).

3.  **Modal de Asignación Contextual:**
    *   El modal ahora tiene dos modos:
        *   **Planificado:** Se selecciona un grupo de la lista de pendientes. Autocompleta Materia y Docente, y valida contra el aula preferida.
        *   **Manual:** Permite crear clases sueltas sin necesidad de un grupo previo.
    *   **Validaciones Robustas:** El sistema impide seleccionar docentes bloqueados por matriz o ya ocupados en ese slot en otra aula.

4.  **Feedback Visual:**
    *   Las celdas del horario muestran tarjetas con el color del área académica.
    *   Indicadores de "Fijo" cuando se está en la vista de un recurso específico.
    *   Estado de "Completado" en la sidebar cuando se asignan todas las horas de un grupo.

### Próximos Pasos (Fase 4/6):
*   Implementar Drag & Drop para mejorar la ergonomía de arrastrar desde "Pendientes" hacia la grilla.
*   Optimización de Recursos: Room Balancer para eficiencia de ocupación.

---

## Fase 5: Inteligencia Académica y Reglas de Negocio
**Estado:** ✅ Completado
**Fecha:** 2026-02-18

### Hitos Alcanzados:
1.  **Patrones de Sesión (Split Classes):**
    *   Soporte para dividir horas de una materia en bloques (ej. 2+2, 2+1).
    *   Sidebar de pendientes desglosada por sesiones individuales.
    *   Generación automática de paralelos respetando el patrón definido en la materia.

2.  **Especialización Docente:**
    *   Vinculación de profesores con materias específicas (`allowedSubjectIds`).
    *   Filtrado inteligente en el planificador: solo se muestran sesiones que el docente puede dictar.

3.  **Restricciones Temporales (Reglas de "Inglés"):**
    *   Definición de días preferidos por materia (`preferredDays`).
    *   Validación visual y alertas en el modal de asignación si se intenta agendar en un día no deseado.

4.  **Optimización de Carga Docente:**
    *   Visualización de carga actual en tiempo real en los selectores de la oferta académica.
    *   Alertas de sobrecarga horaria.

---

## Fase 6: Estabilización de UI y Experiencia de Usuario (Planificador)
**Estado:** ✅ Completado
**Fecha:** 2026-02-24

### Hitos Alcanzados:
1.  **Resolución de Bugs Críticos:**
    *   Solucionado el mismatch de estados (`viewMode` plural vs singular) que causaba que el sidebar de pendientes no filtrara correctamente por docente/aula.
2.  **Refactorización de Layout (ScheduleHeader):**
    *   Barra superior estática y diseño unificado que previene saltos visuales al cambiar de pestañas.
    *   Reubicación estratégica de acciones secundarias ("Vaciar Docente" movido a la sub-barra de selección de iniciales).
    *   Creación de sub-barra dedicada para el filtrado de Aulas.
3.  **Estabilización de Drag & Drop (`dnd-kit`):**
    *   Corrección de intersección de eventos (`pointer-events`) que impedía arrastrar y reubicar bloques de clases ya existentes en la cuadrícula.
4.  **Auto-Asignación Inteligente:**
    *   Restricción de la función "Auto-Asignar" para operar exclusivamente de Lunes a Viernes por defecto (omitiendo sábados a menos que la materia indique lo contrario en sus días preferidos).

---

## Fase 7: Mejoras de UI/UX y Oferta por Docente
**Estado:** ✅ Completado
**Fecha:** 2026-03-03

### Hitos Alcanzados:
1.  **Layout Responsivo:**
    *   Fix del "piso blanco" causado por `zoom: 0.85` en `index.html`. Se aplicó `height: 100%` + `overflow: hidden` a `html`, `body` y `#root`.
    *   Cambio de `h-screen` a `h-full` en el layout raíz (`index.tsx`).
2.  **Oferta por Docente (TeacherDetailPanel):**
    *   Nuevo componente `TeacherDetailPanel.tsx` con resumen del docente (avatar, nombre, barra de carga) y lista de paralelos asignados.
    *   Dropdown de **reasignación de docente** con indicadores de carga horaria y alertas de sobrecarga (ej. `"Andrés Revelo (Total: 18/21h) ⚠️"`).
3.  **Nomenclatura Secuencial de Paralelos:**
    *   Los nuevos paralelos se nombran automáticamente como `Paralelo N+1` tanto en creación manual (`ActiveGroupsList.tsx`) como en generación masiva (`useOfferPlanner.ts`).
4.  **Schedule Grid:**
    *   Eliminado scrollbar interno redundante que desalineaba los headers de día.
    *   Incrementado `z-index` de headers sticky a `z-20` para evitar solapamiento con bloques.
5.  **Validación de Jornada:**
    *   Las materias marcadas como "diurnas" ya no se asignan en horario vespertino durante la auto-asignación.

---

## Fase 8: Algoritmo Inteligente de Asignación de Aulas (3 Pasadas)
**Estado:** ✅ Completado
**Fecha:** 2026-03-03

### Problema Detectado:
Las materias con un aula específica obligatoria (ej. "Desarrollo de Juegos" → aula -510) no recibían su aula porque otras materias genéricas (tipo PC) la ocupaban primero.

### Solución Implementada:
1.  **Sistema de 3 Pasadas en `handleAutoAssignAll`:**
    *   **Pasada 1 (Mandatory):** Materias con `subject.allowedClassroomIds` se asignan primero a sus aulas específicas.
    *   **Pasada 2 (Flexible/Planned):** Materias con `group.plannedClassroomId` intentan su aula planificada; si está ocupada, buscan otra del mismo tipo.
    *   **Pasada 3 (Flexible/Generic):** Todo lo demás usa cualquier aula compatible disponible.
2.  **Selección de Aula Consistente por Bloque:**
    *   Corregido bug donde cada hora de un bloque multi-hora podía asignarse a un aula diferente. Ahora se busca UNA aula libre para TODAS las horas del bloque.
3.  **Protección en Oferta Académica (`getEligibleRooms`):**
    *   Al generar paralelos por tipo de aula, se excluyen las aulas reservadas por `allowedClassroomIds` de otras materias.
4.  **Ocupación de Aulas:**
    *   El porcentaje de ocupación en el dropdown de aulas ahora solo considera la jornada diurna (antes de 17:50, Lun-Vie).

---

## Fase 9: Mejoras en Exportación
**Estado:** ✅ Completado
**Fecha:** 2026-03-03

### Hitos Alcanzados:
1.  **Exportación por Hora:**
    *   Cada hora de un paralelo genera una fila independiente en el Excel/CSV. Un paralelo de 3h produce 3 filas.
2.  **ID de Docente Corregido:**
    *   Se usaba un operador `||` incorrecto que impedía encontrar el `institutionalId` del docente. Ahora se busca directamente desde `group.teacherId`.
3.  **Códigos de Bloque Correctos:**
    *   Cada fila tiene su propio código de bloque (ej. Lunes 7:00 = 101, 8:05 = 102, 9:10 = 103).
4.  **Cupo = Capacidad Máxima del Aula:**
    *   El campo `cupo` ahora usa `room.maxCapacity` en lugar de `group.studentCount`.

