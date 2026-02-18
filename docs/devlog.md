

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

### Próximos Pasos (Fase 4):
*   Implementar Drag & Drop para mejorar la ergonomía de arrastrar desde "Pendientes" hacia la grilla.
*   Generación de reportes finales.
