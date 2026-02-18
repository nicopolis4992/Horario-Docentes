# UniScheduler (MVP)

> Sistema de Gestión y Planificación de Horarios Académicos (PWA Local-First)

## 📖 Descripción
UniScheduler es una Aplicación Web Progresiva (PWA) diseñada para asistir a coordinadores académicos en la compleja tarea de asignar horarios, docentes y aulas. A diferencia de los sistemas automáticos de "caja negra", UniScheduler actúa como un **asistente inteligente**, permitiendo el control humano total pero validando reglas críticas (choques de horarios, capacidad de aulas, carga horaria docente) en tiempo real.

## 🚀 Filosofía "Local-First"
Este proyecto sigue una arquitectura **Local-First**:
1.  **Privacidad:** Los datos viven en el navegador del usuario (IndexedDB/LocalStorage).
2.  **Resiliencia:** Funciona sin conexión a internet.
3.  **Sin Burocracia:** No requiere instalación de servidores ni permisos de TI para empezar a usarlo.

## ✨ Funcionalidades (MVP)
*   **Gestión de Oferta Académica (NUEVO):** Calculadora inteligente de paralelos basada en la proyección de estudiantes y capacidad de aulas. Asignación previa de docentes.
*   **Motor de Tiempo Dinámico:** Generación automática de bloques horarios con reglas de descansos (5 min entre clases).
*   **Gestión de Recursos:** Base de datos local de Docentes, Aulas y Materias.
*   **Dashboard:** Resumen estadístico de la planificación semestral.
*   **Validaciones:** Alertas visuales para conflictos de horarios y sobrepoblación de aulas.

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