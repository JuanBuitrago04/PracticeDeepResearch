import Langfuse from 'langfuse';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || 'pk-lf-1234567890',
  secretKey: process.env.LANGFUSE_SECRET_KEY || 'sk-lf-1234567890',
  baseUrl: process.env.LANGFUSE_BASE_URL || 'http://localhost:3000'
});

let sessionId = null;
let trace = null;

// Crear directorio de logs si no existe
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

export function iniciarSesion(query) {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  trace = langfuse.trace({
    name: "Deep Research Session",
    sessionId: sessionId,
    input: { query }
  });
  registrarEvento("Sesión Iniciada", `ID: ${sessionId}, Query: ${query}`);
}

export function registrarEvento(etapa, detalle, metadata = {}) {
    const tiempo = new Date().toLocaleString();
    const logEntry = `[LOG ${tiempo}] ${etapa}: ${detalle}`;

    console.log(logEntry);

    // Registrar en LangFuse si está disponible
    if (trace) {
      try {
        trace.span({
          name: etapa,
          input: { detalle, ...metadata },
          output: { timestamp: tiempo }
        });
      } catch (error) {
        console.warn("Error registrando en LangFuse:", error.message);
      }
    }

    // Guardar en archivo de logs para auditabilidad
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        sessionId,
        etapa,
        detalle,
        metadata
      };

      fs.appendFileSync('./logs/audit.log', JSON.stringify(logData) + '\n');
    } catch (error) {
      console.warn("Error guardando log en archivo:", error.message);
    }
}

export function finalizarSesion(resultado) {
  if (trace) {
    try {
      trace.update({
        output: resultado
      });
      langfuse.flush();
    } catch (error) {
      console.warn("Error finalizando sesión en LangFuse:", error.message);
    }
  }
  registrarEvento("Sesión Finalizada", `Resultado: ${JSON.stringify(resultado)}`);
}

export function obtenerHistorialAuditoria() {
  try {
    if (fs.existsSync('./logs/audit.log')) {
      const logs = fs.readFileSync('./logs/audit.log', 'utf-8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
      return logs;
    }
  } catch (error) {
    console.error("Error leyendo historial de auditoría:", error.message);
  }
  return [];
}
  