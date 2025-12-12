# Changelog

## [2.0.0] - 2024-01-01

### 🎉 Versión Completa - Proyecto Profesional

Esta versión convierte DeepResearch en una plataforma completa de investigación con múltiples interfaces y características avanzadas.

### ✨ Nuevas Características

#### 🌐 API REST Completa
- Servidor Express con endpoints RESTful
- Gestión de sesiones de investigación
- Endpoints para estadísticas y exportación
- Soporte para investigación concurrente
- Middleware de seguridad (Helmet, CORS)

#### 💾 Sistema de Base de Datos
- Integración con SQLite usando better-sqlite3
- Almacenamiento persistente de sesiones y resultados
- Sistema de caché inteligente
- Funciones de estadísticas y análisis
- Índices optimizados para rendimiento

#### 📥 Sistema de Exportación
- Exportación a JSON, Markdown y PDF
- Formateo profesional de documentos
- Generación de PDFs con PDFKit
- Configuración de directorio de exportación

#### 🎨 Interfaz Web
- Dashboard moderno y responsivo
- Gestión visual de sesiones
- Visualización de métricas en tiempo real
- Exportación directa desde la interfaz
- Diseño responsive y accesible

#### 💻 CLI Mejorado
- Interfaz de línea de comandos interactiva
- Menú navegable con múltiples opciones
- Visualización de sesiones anteriores
- Estadísticas desde la terminal
- Exportación desde CLI

#### ⚙️ Sistema de Configuración
- Archivo de configuración JSON
- Variables de entorno para credenciales
- Configuración flexible de parámetros
- Valores por defecto sensatos

#### 🔍 Mejoras en Búsqueda de Fuentes
- Integración mejorada con APIs web
- Soporte para Wikipedia API
- Mejor manejo de errores y timeouts
- Configuración de límites de resultados
- Tipos de fuentes categorizadas

#### ⚡ Sistema de Caché
- Caché de consultas para evitar duplicados
- TTL configurable
- Limpieza automática de caché expirado
- Integración transparente con el sistema

### 🔧 Mejoras

- Integración completa de base de datos en el flujo de investigación
- Mejor manejo de errores en todos los módulos
- Logging mejorado con más contexto
- Configuración centralizada de modelos OpenAI
- Validación de entrada mejorada

### 📚 Documentación

- README.md completamente actualizado
- Nueva documentación de API (API_DOCUMENTATION.md)
- Guía de inicio rápido (QUICKSTART.md)
- Archivo de configuración de ejemplo
- Changelog detallado

### 🐛 Correcciones

- Corrección en el modelo GAIA (gpt-4o-mini)
- Mejora en el manejo de errores de evaluación
- Validación de parámetros mejorada

### 📦 Dependencias Nuevas

- `express` - Servidor web
- `better-sqlite3` - Base de datos SQLite
- `cors` - Soporte CORS
- `helmet` - Seguridad HTTP
- `pdfkit` - Generación de PDFs
- `node-cache` - Sistema de caché (preparado para uso futuro)

### 🔄 Cambios de Compatibilidad

- `deepResearch` ahora es una función exportada (no ejecuta automáticamente)
- Nuevos parámetros de configuración requeridos
- Estructura de directorios expandida (data/, exports/, public/)

### 📝 Notas

- Esta versión requiere Node.js 18+
- Se recomienda configurar variables de entorno antes de usar
- La base de datos se crea automáticamente en `data/research.db`
- Los logs se guardan en `logs/audit.log`

---

## [1.0.0] - Versión Inicial

### Características Iniciales
- Motor de investigación básico
- Sistema de evaluación GAIA
- Búsqueda de fuentes web
- Preprocesamiento de consultas
- Logging básico
- Investigación concurrente

