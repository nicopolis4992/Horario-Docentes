
# Roadmap: Sistema de Gestión de Horarios Académicos (MVP)

## 1. Visión del Producto
Una Progressive Web App (PWA) "Local-First" diseñada para asistir a coordinadores académicos en la creación y gestión de horarios. El sistema prioriza la asistencia humana sobre la automatización total, validando restricciones en tiempo real.

## 2. Arquitectura Técnica

### Stack Tecnológico
- **Frontend:** React 18 + TypeScript.
- **Estilos:** Tailwind CSS (Utility-first).
- **Iconografía:** Lucide React.
- **Estado:** React Context API + LocalStorage (Persistencia simple para MVP).
- **Empaquetado:** Vite (implícito).

### Decisiones de Diseño
1.  **Local-First:** Todos los datos viven en el navegador del usuario. No requiere backend para funcionar. Ideal para entornos con restricciones de TI (Shadow IT amigable).
2.  **Algoritmo de Tiempo:** Los bloques de tiempo no son estáticos. Se generan mediante una función `(start_time, duration, break_time)`.
3.  **Validación en Tiempo Real:** El sistema actúa como un "linter" de horarios, marcando conflictos visualmente (rojo/amarillo) en lugar de prohibir acciones estrictamente.

## 3. Reglas de Negocio (Core)

### Tiempo
- **Jornada:** 07:00 a 17:45.
- **Clase:** 60 minutos.
- **Break:** 5 minutos entre clases.
- **Días:** Lunes a Sábado.

### Entidades
- **Docentes:**
    - Carga Máxima: 15 o 21 horas semanales (configurable).
    - Restricciones: Matriz de disponibilidad (bloqueos duros). **[IMPLEMENTADO]**
- **Aulas:**
    - Capacidad Recomendada (Soft limit).
    - Capacidad Máxima (Hard limit).
- **Materias:**
    - Se dividen en "Paralelos" según la proyección de inscritos. **[IMPLEMENTADO]**

## 4. Fases de Desarrollo

### Fase 1: Cimientos (Completado)
- [x] Definición de Tipos de Datos.
- [x] Motor de Generación de Horarios.
- [x] Dashboard de Resumen.
- [x] Configuración de Persistencia.

### Fase 2: Gestión de Recursos (Completado)
- [x] ABM de Docentes (con restricciones de horas y matriz de disponibilidad).
- [x] ABM de Aulas (Tipos de aula y capacidades).
- [x] ABM de Materias (Áreas y horas).
- [x] Refinamiento de UI/UX (Tarjetas limpias, Modales amplios).

### Fase 2.5: Gestión de Oferta Académica (Completado)
- [x] Algoritmo de división de estudiantes en paralelos (Math.ceil).
- [x] Vista "Planificador de Oferta".
- [x] Asignación previa de docentes a grupos específicos.
- [x] Validación de carga docente en tiempo real durante la creación de oferta.
- [x] Estrategias de aula base (Capacidad Recomendada vs Máxima).

### Fase 3: El Planificador Integrado (Completado)
- [x] Vista de Matriz (Días vs Horas).
- [x] **Doble Vista:** Modo "Por Docente" y Modo "Por Aula".
- [x] **Integración de Oferta:** Barra lateral de "Grupos Pendientes" con barra de progreso.
- [x] **Modal de Asignación Inteligente:**
    - Modo "Planificado": Selecciona un grupo pendiente y autocompleta materia/docente.
    - Modo "Manual": Para clases ad-hoc fuera de la oferta regular.
- [x] Validaciones de disponibilidad (Docente ocupado/bloqueado, Aula ocupada).

### Fase 4: Refinamiento y UX (Pendiente)
- [ ] **Drag & Drop:** Arrastrar grupos desde la barra lateral directamente a la celda del horario.
- [ ] **Reportes:** Generación de PDF por docente o por aula.
- [ ] **Exportación:** CSV plano para integración con sistemas externos.
