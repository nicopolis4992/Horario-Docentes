# Roadmap v2: Sistema de Gestión Académica (Escalabilidad 2026)

## 1. Auditoría de Estado Actual (Audit 2026)

### Fortalezas
- **Arquitectura Limpia:** Uso de `useReducer` y `Context API` facilita la migración a estados más complejos.
- **PWA Ready:** Estructura modular preparada para persistencia offline.
- **Gestor de Oferta:** La separación entre Materia y `CourseGroup` es fundamental para el escalado.

### Hallazgos de la Auditoría de Código
- **Limitación de Persistencia:** El uso de `localStorage` en `store.tsx` es un riesgo de pérdida de datos para volumen universitario (>5MB).
- **Gaps en Modelado:** 
  - `Teacher`: Falta vinculación específica con materias (especialidades).
  - `Subject`: Carece de reglas de distribución temporal (ej. Inglés L/M/V).
  - `CourseGroup`: No soporta configuración de sesiones (ej. dividir 3h en 2+1).
- **Algoritmos de Asignación:** Actualmente se basa en selección manual asistida por "carga horaria", pero falta una heurística de "balance de ocupación".

---

## 2. Implementación de Recomendaciones (Coordinación)

### 2.1 Especialización Docente
- **Objetivo:** Restringir/Sugerir materias basadas en el perfil.
- **Cambio técnico:** Extender `Teacher` con `allowedSubjectIds: string[]`.

### 2.2 Gestión de Sesiones (Bloque vs Split)
- **Objetivo:** Permitir que una materia de 3h se dicte en bloques separados.
- **Cambio técnico:** `CourseGroup` incluirá un `sessionPattern` (ej. `[2, 1]` o `[3]`). El planificador generará "pendientes" basados en estos bloques.

### 2.3 Balance de Ocupación Estudiantil
- **Objetivo:** Priorizar aulas de 40 para grupos grandes y aulas de 30 para grupos pequeños, evitando el "vacío" de espacios grandes.
- **Algoritmo:** Implementar un `EfficiencyScore` en el selector de aulas: `(Grupo.estudiantes / Aula.capacidadMax)`. El sistema sugerirá aulas con score cercano a 1.0 (80-90% de ocupación).

### 2.4 Restricciones por Asignatura (Caso "Inglés")
- **Objetivo:** Forzar días específicos para ciertas materias.
- **Cambio técnico:** `Subject` tendrá `preferredDays: DayOfWeek[]`. El planificador marcará como "Inválido" o "No recomendado" los días fuera de este rango.

---

## 3. Fases Evolutivas Actualizadas

### Fase 4: Refinamiento de UX (Inmediato)
- [ ] **Drag & Drop:** Implementar `dnd-kit` para mover grupos a la grilla.
- [ ] **Reportes:** Exportación CSV/PDF para secretaría académica.

### Fase 5: Inteligencia Académica (MVP++)
- [ ] **Módulo de Especialidades:** Vincular docentes con áreas de conocimiento.
- [ ] **Pattern Scheduler:** Soporte para sesiones `2+1` y `1+1+1`.
- [ ] **Reglas de Inglés:** Restricciones de días a nivel de materia.

### Fase 6: Optimización de Recursos (Escalabilidad)
- [ ] **Room Balancer:** Indicador visual de eficiencia de ocupación.
- [ ] **Aaffinity Labs:** Prioridad automática para laboratorios según tipo de materia.

### Fase 7: Infraestructura 2026
- [ ] **Migración Dexie (IndexedDB):** Persistencia ilimitada y transaccional.
- [ ] **Sincronización WebRTC:** Colaboración en tiempo real entre coordinadores sin servidor.

---

## 4. Próximos pasos
1. **Refactor de `types.ts`:** Incluir `specialties` y `sessionPatterns`.
2. **Setup de Dexie.js:** Reemplazar `localStorage` para evitar bloqueos por tamaño.
3. **Lógica de Inglés:** Implementar validación de día preferido en el modal de asignación.
