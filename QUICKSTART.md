# 🚀 Guía de Inicio Rápido - DeepResearch

## Instalación en 5 minutos

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
OPENAI_API_KEY=tu_clave_api_aqui
USUARIOS_AUTORIZADOS=admin
PORT=3000
```

### Paso 3: Iniciar el servidor
```bash
npm start
```

### Paso 4: Abrir en el navegador
```
http://localhost:3000
```

## Modos de uso

### 🌐 Modo Web (Recomendado)
```bash
npm start
```
- Interfaz gráfica moderna
- Gestión de sesiones
- Exportación de resultados
- Estadísticas en tiempo real

### 💻 Modo CLI
```bash
npm run cli
```
- Interfaz de línea de comandos interactiva
- Ideal para scripts y automatización
- Acceso completo a todas las funciones

### 📚 Modo Programático
```javascript
import { deepResearch } from './deepresearch.js';

const resultado = await deepResearch(
  "Tu pregunta de investigación aquí",
  5,  // iteraciones máximas
  'admin'  // usuario
);

console.log(resultado.analisis);
```

## Primera investigación

1. Abre la interfaz web en `http://localhost:3000`
2. Ingresa tu pregunta de investigación
3. Haz clic en "Iniciar Investigación"
4. Espera a que se complete (generalmente 30-120 segundos)
5. Revisa los resultados y métricas
6. Exporta en el formato que prefieras

## Ejemplos de consultas

- "¿Cómo afectará el cambio climático a la agricultura global para 2050?"
- "Impacto de la inteligencia artificial en el sector salud"
- "Tendencias tecnológicas emergentes para 2030"
- "Análisis del mercado de energías renovables"

## Solución de problemas

### Error: "OPENAI_API_KEY no está configurada"
- Verifica que el archivo `.env` existe
- Asegúrate de que la clave API es correcta
- Reinicia el servidor después de cambiar `.env`

### Error: "Puerto 3000 ya en uso"
- Cambia el puerto en `.env`: `PORT=3001`
- O detén el proceso que usa el puerto 3000

### La investigación no se completa
- Verifica tu conexión a internet
- Revisa que tu clave API de OpenAI tenga créditos
- Revisa los logs en `logs/audit.log`

## Próximos pasos

- Lee el [README.md](README.md) completo para más detalles
- Consulta la [documentación de la API](API_DOCUMENTATION.md)
- Personaliza la configuración en `config.json`
- Explora las funciones avanzadas del CLI

## Soporte

- **Issues**: [GitHub Issues](https://github.com/JuanBuitrago04/PracticeDeepResearch/issues)
- **Documentación**: Ver archivos `.md` en el repositorio

¡Feliz investigación! 🔬

