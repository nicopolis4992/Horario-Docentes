# UniScheduler (MVP)

> Sistema de Gestión y Planificación de Horarios Académicos (PWA Local-First)

## 📖 Descripción
UniScheduler es una Aplicación Web Progresiva (PWA) diseñada para asistir a coordinadores académicos en la compleja tarea de asignar horarios, docentes y aulas. A diferencia de los sistemas automáticos de "caja negra", UniScheduler actúa como un **asistente inteligente**, permitiendo el control humano total pero validando reglas críticas (choques de horarios, capacidad de aulas, carga horaria docente) en tiempo real.

## 🚀 Filosofía "Local-First"
Este proyecto sigue una arquitectura **Local-First**:
1.  **Privacidad:** Los datos viven en el navegador del usuario (IndexedDB/LocalStorage).
2.  **Resiliencia:** Funciona sin conexión a internet.
3.  **Sin Burocracia:** No requiere instalación de servidores ni permisos de TI para empezar a usarlo.

## ✨ Funcionalidades
*   **Gestión de Oferta Académica:** Calculadora inteligente de paralelos con nomenclatura secuencial, vista por materia y por docente con reasignación.
*   **Motor de Tiempo Dinámico:** Generación automática de bloques horarios con reglas de descansos (5 min entre clases), jornada diurna/vespertina.
*   **Gestión de Recursos:** Base de datos local de Docentes (especialidades, disponibilidad), Aulas (tipos PC/MAC/AULA, capacidades) y Materias (sigla, carrera, sede, jornada, patrones de sesión).
*   **Auto-Asignación Inteligente:** Algoritmo de 3 pasadas para priorización de aulas específicas, con fallback a aulas compatibles.
*   **Drag & Drop:** Arrastrar sesiones pendientes a la grilla y reubicar bloques existentes.
*   **Exportación:** CSV, XLSX, PDF, PNG, ZIP. Datos por hora con códigos de bloque y capacidad de aula.
*   **Dashboard:** Resumen estadístico de la planificación semestral.
*   **Validaciones:** Conflictos de horarios, sobrecarga docente, restricciones de jornada y días preferidos.

## 🛠️ Stack Tecnológico
*   **Core:** React 18 + TypeScript
*   **Estilos:** Tailwind CSS
*   **Iconos:** Lucide React
*   **Estado:** React Context + LocalStorage Persistence

## 📂 Estructura del Proyecto
*   `/src`: Código fuente.
*   `/docs`: Documentación técnica.
    *   `roadmap.md`: Plan de desarrollo futuro.
    *   `devlog.md`: Bitácora de cambios y decisiones técnicas.

## 🚦 Cómo Iniciar
1.  Clonar el repositorio.
2.  `npm install`
3.  `npm run dev`