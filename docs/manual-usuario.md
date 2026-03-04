# 📘 Manual de Usuario — UniScheduler

> Sistema de Gestión y Planificación de Horarios Académicos

---

## Índice

1. [Introducción](#1-introducción)
2. [Flujo de Trabajo Recomendado](#2-flujo-de-trabajo-recomendado)
3. [Gestión de Docentes](#3-gestión-de-docentes)
4. [Gestión de Materias](#4-gestión-de-materias)
5. [Gestión de Aulas](#5-gestión-de-aulas)
6. [Oferta Académica](#6-oferta-académica)
7. [Planificador de Horarios](#7-planificador-de-horarios)
8. [Dashboard](#8-dashboard)
9. [Importar Datos](#9-importar-datos)
10. [Exportar Datos](#10-exportar-datos)
11. [Preguntas Frecuentes](#11-preguntas-frecuentes)

---

## 1. Introducción

UniScheduler es una aplicación web local-first diseñada para coordinadores académicos. Permite planificar horarios, asignar docentes a materias, y distribuir aulas de forma inteligente.

**Características clave:**
- Todos los datos se guardan en tu navegador (no requiere internet ni servidores).
- Validaciones en tiempo real para evitar conflictos de horario.
- Auto-asignación inteligente con priorización de aulas específicas.
- Exportación en múltiples formatos (Excel, CSV, PDF, PNG, ZIP).

---

## 2. Flujo de Trabajo Recomendado

Para planificar un semestre desde cero, sigue este orden:

```
1. Docentes     → Registrar profesores y su disponibilidad
2. Aulas        → Registrar los espacios físicos disponibles
3. Materias     → Registrar las asignaturas del semestre
4. Importar     → (Opcional) Cargar datos desde un Excel
5. Oferta       → Generar paralelos y asignar docentes/aulas
6. Planificador → Armar el horario (manual o automático)
7. Exportar     → Descargar el horario final
```

> **Importante:** Los pasos 1-3 (o paso 4) son prerrequisitos. No podrás generar la oferta ni el horario sin docentes, materias y aulas cargados.

---

## 3. Gestión de Docentes

**Ruta:** Sidebar → **Docentes**

### Crear un docente
1. Haz clic en **"Nuevo Docente"**.
2. Completa los campos:
   - **Nombre:** Nombre completo del profesor.
   - **ID Institucional:** Cédula o código UDLA (se usa en la exportación como `banner_id_principal`).
   - **Horas máximas:** Carga máxima semanal (ej. 15 o 21 horas).
   - **Color:** Color para identificarlo visualmente en el horario.
3. Haz clic en **"Guardar"**.

### Asignar especialidades
Cada docente puede impartir solo ciertas materias:
1. En el formulario del docente, busca la sección **"Materias que puede dictar"**.
2. Marca/desmarca las materias correspondientes.
3. Solo las materias habilitadas aparecerán como opciones al momento de asignar en la oferta y el horario.

### Configurar disponibilidad
1. En la vista del docente, ve a la **matriz de disponibilidad**.
2. Haz clic en las celdas (Día × Hora) para marcar los bloques en los que el profesor **NO** puede dar clases.
3. Las celdas bloqueadas se mostrarán en rojo y el sistema impedirá asignar clases en esos horarios.

---

## 4. Gestión de Materias

**Ruta:** Sidebar → **Materias**

### Crear una materia
1. Haz clic en **"Nueva Materia"**.
2. Completa los campos obligatorios:
   - **Nombre:** Nombre de la asignatura.
   - **Sigla:** Código institucional (ej. `PMCZ4462`).
   - **Carrera:** Nombre de la carrera (por defecto: `MULTIMEDIA Y PROD.AUDIOVISUAL`).
   - **Sede:** Sede académica (por defecto: `UP`).
   - **Semestre/Nivel:** Número de semestre (1-10).
   - **Créditos (Horas/Semana):** Horas semanales de la materia.
   - **Estudiantes proyectados:** Estimación de alumnos para el cálculo de paralelos.
   - **Área:** Eje de la carrera (Audiovisual, Animación, Interactividad).

### Configurar restricciones de horario
- **Jornada:** Seleccionar si la materia es "Diurna" (antes de 17:50) o "Vespertina" (desde 17:50). El auto-asignador respetará esta restricción.
- **Días preferidos:** Seleccionar los días en que la materia debería impartirse (ej. Lunes, Miércoles, Viernes).
- **Rango horario preferido:** Definir un rango específico (ej. 07:00 a 12:30).
- **Patrón de sesión:** Cómo se dividen las horas semanales. Ejemplo: una materia de 3 horas puede tener patrón `[2, 1]` (un bloque de 2h + un bloque de 1h) o `[3]` (un solo bloque).

### Configurar aulas
- **Tipo de aula requerido:** Seleccionar el tipo de aula necesario (AULA, PC, MAC). Puede seleccionar múltiples tipos.
- **Aulas específicas:** Seleccionar aulas concretas donde **obligatoriamente** debe darse la clase. Esto tiene la prioridad más alta en la auto-asignación.

> **Regla clave:** Si una materia tiene "Aulas específicas" configuradas, el algoritmo de auto-asignación la colocará primero en esas aulas antes que cualquier otra materia.

---

## 5. Gestión de Aulas

**Ruta:** Sidebar → **Aulas**

### Crear un aula
1. Haz clic en **"Nueva Aula"**.
2. Completa:
   - **Nombre:** Identificador del aula (ej. `-510`, `117`, `503`).
   - **Tipo:** AULA (sala regular), PC (laboratorio de computadores) o MAC (laboratorio Mac).
   - **Capacidad Máxima:** Cantidad máxima de estudiantes que caben.
   - **Capacidad Recomendada:** Cantidad ideal de estudiantes.

> La **capacidad recomendada** se usa para calcular cuántos paralelos se necesitan. La **capacidad máxima** se exporta como el campo `cupo`.

---

## 6. Oferta Académica

**Ruta:** Sidebar → **Oferta Académica**

Este módulo crea los "paralelos" (grupos concretos) a partir de las materias abstractas. Es el paso intermedio entre registrar materias y armar el horario.

### Vista por Materias
1. Selecciona una materia en la lista de la izquierda.
2. Se muestra la información de la materia y los paralelos existentes.
3. Opciones:
   - **Calcular paralelos:** Determina automáticamente cuántos paralelos se necesitan basándose en los estudiantes proyectados y la capacidad del aula seleccionada.
   - **Generar Todo:** Genera paralelos para TODAS las materias que aún no tienen oferta completa.
   - **Agregar manualmente:** El botón "+" permite crear un paralelo individual con nombre secuencial automático (Paralelo 1, 2, 3...).

### Vista por Docentes
1. Cambia a la pestaña **"Docentes"** en la parte superior.
2. Selecciona un docente en la lista de la izquierda.
3. Se muestra:
   - **Resumen del docente:** Avatar, nombre, barra de carga horaria.
   - **Paralelos asignados:** Lista de todos los paralelos que tiene asignados.
4. Para cada paralelo puedes:
   - **Reasignar docente:** Usa el dropdown de docente para mover el paralelo a otro profesor. Muestra las horas actuales y alertas de sobrecarga.
   - **Cambiar aula:** Usa el dropdown de aula para cambiar el aula planificada.

### Campos de cada paralelo
- **Nombre:** Se genera automáticamente (Paralelo 1, 2, 3...).
- **Docente:** Profesor asignado (filtrado por especialidades).
- **Aula planificada:** El aula sugerida (puede cambiar durante la auto-asignación).
- **Estudiantes:** Número de alumnos en este grupo.
- **Patrón de sesión:** Heredado de la materia.

---

## 7. Planificador de Horarios

**Ruta:** Sidebar → **Planificador**

Este es el módulo central de la aplicación. Aquí se arma el horario semanal.

### Vistas disponibles
- **Vista por Docente:** Muestra el horario de UN profesor. Selecciónalo con las iniciales circulares en la barra superior.
- **Vista por Aula:** Muestra la ocupación de UN aula. Selecciónala con el dropdown. El porcentaje de ocupación mostrado considera solo la jornada diurna (Lun-Vie, antes de 17:50).

### Filtros de jornada
Los íconos de Sol/Luna/Sol+Luna en la barra superior permiten filtrar qué bloques horarios se muestran:
- ☀️ **Diurno:** Solo bloques antes de 17:50.
- 🌙 **Vespertino:** Solo bloques desde 17:50.
- ☀️🌙 **Todo:** Todos los bloques.

### Filtro de semana
- **Lun-Vie:** Muestra solo días laborables.
- **Lun-Sáb:** Incluye el sábado.

### Sidebar de Pendientes
A la izquierda del horario aparece la lista de sesiones pendientes (horas que aún no han sido asignadas):
- Cada tarjeta muestra: materia, paralelo, docente, horas faltantes.
- Las tarjetas se pueden **arrastrar** (drag & drop) directamente a la grilla del horario.
- El checkbox **"Ver todas las pendientes"** (en vista por aula) muestra sesiones de todos los recursos, no solo del seleccionado.

### Asignación manual
1. Haz clic en una celda vacía del horario (el botón "+").
2. Se abre el modal de asignación:
   - **Modo Planificado:** Selecciona un grupo pendiente. Se autocompletan materia, docente y aula preferida.
   - **Modo Manual:** Selecciona materia, docente y aula libremente.
3. El sistema valida en tiempo real: conflictos de horario, disponibilidad del docente, ocupación del aula.
4. Haz clic en **"Confirmar"** para asignar.

### Auto-Asignación
El botón **"Auto-Asignar"** en la barra superior ejecuta el algoritmo inteligente de asignación automática.

**Cómo funciona el algoritmo (3 pasadas):**

| Pasada | Qué asigna | Cómo elige aula |
|--------|-----------|-----------------|
| **1** | Materias con aula obligatoria (`allowedClassroomIds` en Materias) | Solo sus aulas específicas |
| **2** | Materias con aula planificada (desde oferta académica) | Intenta la planificada → si está llena, busca otra del mismo tipo |
| **3** | Todo lo demás | Cualquier aula compatible disponible |

**Reglas adicionales del algoritmo:**
- Respeta la jornada (diurna/vespertina) de cada materia.
- Respeta los días preferidos.
- Respeta el rango horario preferido.
- Respeta la disponibilidad del docente (matriz de horarios bloqueados).
- Todas las horas de un bloque se asignan a la **misma aula**.
- Si no encuentra espacio, la materia queda en la sidebar de pendientes para asignación manual.

### Editar una asignación existente
- Haz clic en el bloque de una materia asignada.
- Aparecerán íconos de edición (✏️), corte (✂️) y eliminar (🗑️).
- **Editar:** Cambia docente o aula.
- **Separar:** Separa una hora del bloque para moverla independientemente.
- **Eliminar:** Devuelve la hora a pendientes.

### Drag & Drop
- Arrastra las tarjetas de la sidebar de pendientes hacia una celda del horario.
- También puedes arrastrar bloques ya asignados para reubicarlos.

### Acciones globales
- **Vaciar Docente:** Elimina todas las asignaciones del docente seleccionado (con confirmación).
- **Borrar Todo:** Elimina absolutamente todas las asignaciones del horario (con confirmación).

---

## 8. Dashboard

**Ruta:** Sidebar → **Dashboard**

Muestra un resumen general de la planificación:
- Total de docentes, materias, aulas y paralelos.
- Estadísticas de ocupación.
- Progreso de la asignación.

---

## 9. Importar Datos

**Ruta:** Sidebar → **Importar Datos**

Permite cargar datos masivamente desde un archivo Excel (.xlsx).

### Formato esperado
El archivo debe seguir el esqueleto proporcionado (`Docs/Esqueleto.xlsx`). Las columnas incluyen: nombre de materia, sigla, créditos, docente, aula, etc.

### Cómo importar
1. Haz clic en **"Seleccionar archivo"** o arrastra tu Excel al área de carga.
2. Revisa la vista previa de los datos detectados.
3. Confirma la importación.
4. Los datos se fusionan con los existentes (no se borran los datos previos).

---

## 10. Exportar Datos

**Ruta:** Sidebar → **Exportar Datos**

### Formatos disponibles
- **CSV:** Archivo de texto separado por comas. Compatible con cualquier herramienta.
- **XLSX (Excel):** Hoja de cálculo con formato.
- **PDF:** Documento con las grillas del horario capturadas como imagen.
- **PNG:** Imagen del horario actual.
- **ZIP:** Paquete con las imágenes de todos los docentes/aulas.
- **JSON (Proyecto):** Exporta todo el estado de la aplicación. Útil para backups o compartir el proyecto.

### Formato del Excel/CSV
Cada **hora** de cada paralelo genera una fila independiente:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `carrera_name` | Nombre de la carrera | MULTIMEDIA Y PROD.AUDIOVISUAL |
| `sede` | Sede | UP |
| `asignatura` | Nombre de la materia | Desarrollo de Juegos |
| `sigla` | Código institucional | PMCZ4462 |
| `creditos` | Horas semanales | 3 |
| `nivel` | Semestre | 5 |
| `paralelo` | Número del paralelo | 1 |
| `banner_id_principal` | ID institucional del docente | 1712345678 |
| `cupo` | Capacidad máxima del aula | 25 |
| `matu_vesp` | Jornada (D=Diurna, V=Vespertina) | D |
| `tipo` | Tipo de aula | PC |
| `nume_sala` | Nombre del aula | -510 |
| `h1` | Código del bloque horario | 101 |

**Código de bloque (`h1`):** Se calcula como `(Día × 100) + Hora`. Ejemplo:
- Lunes 7:00 = **101**, Lunes 8:05 = **102**, Lunes 9:10 = **103**
- Martes 7:00 = **201**, Miércoles 7:00 = **301**, etc.

---

## 11. Preguntas Frecuentes

### ¿Dónde se guardan los datos?
En el **LocalStorage** de tu navegador. No se envían a ningún servidor. Si borras los datos del navegador, se pierden. Usa la exportación JSON como backup.

### ¿Puedo trabajar sin internet?
Sí. La aplicación funciona 100% offline una vez cargada.

### ¿Qué pasa si una materia no se asigna automáticamente?
Si el algoritmo no encuentra un espacio compatible (por restricciones de docente, jornada, aula o días), la materia queda en la sidebar de pendientes. Puedes asignarla manualmente o ajustar las restricciones.

### ¿Cómo fuerzo una materia a un aula específica?
En **Materias** → editar la materia → sección **"Aulas específicas"**. Selecciona el aula deseada. Al auto-asignar, esta materia tendrá prioridad absoluta sobre esa aula.

### ¿Puedo reasignar un paralelo a otro docente?
Sí. En **Oferta Académica** → vista por Docentes → selecciona el docente → usa el dropdown de cada paralelo para reasignar.

### ¿Cómo hago backup de mi trabajo?
En **Exportar Datos** → **"Descargar Proyecto (JSON)"**. Esto guarda todo el estado de la aplicación en un archivo que puedes reimportar después.
