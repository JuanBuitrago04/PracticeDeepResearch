import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { deepResearch, deepResearchConcurrente } from './deepresearch.js';
import {
  getSession,
  getSessionsByUser,
  getResultsBySession,
  getSourcesBySession,
  getStatistics,
  getCachedResult,
} from './database.js';
import { exportResult } from './export.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Middleware de autenticación básica
function authenticate(req, res, next) {
  const usuario = req.headers['x-user'] || req.body.usuario || 'admin';
  req.usuario = usuario;
  next();
}

// Rutas de API

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Iniciar investigación
app.post('/api/research', authenticate, async (req, res) => {
  try {
    const { query, maxIteraciones = config.research.maxIterations, usuario = req.usuario } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query es requerida y debe ser una cadena no vacía' });
    }

    // Verificar caché si está habilitado
    if (config.cache.enabled) {
      const cached = getCachedResult(query);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
        });
      }
    }

    // Iniciar investigación (no bloqueante)
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ejecutar en background
    deepResearch(query, maxIteraciones, usuario)
      .then(resultado => {
        // El resultado ya se guarda en la base de datos por deepResearch
        console.log(`✅ Investigación completada: ${sessionId}`);
      })
      .catch(error => {
        console.error(`❌ Error en investigación ${sessionId}:`, error);
      });

    res.json({
      sessionId,
      status: 'started',
      message: 'Investigación iniciada',
      query,
    });
  } catch (error) {
    console.error('Error iniciando investigación:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener resultado de investigación
app.get('/api/research/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const results = getResultsBySession(sessionId);
    const sources = getSourcesBySession(sessionId);
    const latestResult = results[results.length - 1];

    res.json({
      session,
      results,
      sources,
      latestResult: latestResult ? {
        analisis: latestResult.analisis,
        efectividad: latestResult.efectividad,
        cobertura: latestResult.cobertura,
        observaciones: latestResult.observaciones,
      } : null,
    });
  } catch (error) {
    console.error('Error obteniendo resultado:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar sesiones del usuario
app.get('/api/sessions', authenticate, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sessions = getSessionsByUser(req.usuario, limit);
    res.json({ sessions });
  } catch (error) {
    console.error('Error listando sesiones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas
app.get('/api/statistics', authenticate, (req, res) => {
  try {
    const stats = getStatistics(req.usuario);
    res.json({ statistics: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exportar resultado
app.get('/api/export/:sessionId/:format', authenticate, async (req, res) => {
  try {
    const { sessionId, format } = req.params;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const results = getResultsBySession(sessionId);
    const sources = getSourcesBySession(sessionId);
    const latestResult = results[results.length - 1];

    if (!latestResult) {
      return res.status(404).json({ error: 'No hay resultados para exportar' });
    }

    const exportData = {
      session,
      result: latestResult,
      sources,
    };

    const exported = await exportResult(exportData, format);

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="research_${sessionId}.${format}"`);
    res.send(exported.data);
  } catch (error) {
    console.error('Error exportando:', error);
    res.status(500).json({ error: error.message });
  }
});

// Investigación concurrente
app.post('/api/research/concurrent', authenticate, async (req, res) => {
  try {
    const { queries, maxIteraciones = 3, usuario = req.usuario } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'queries debe ser un array no vacío' });
    }

    const resultados = await deepResearchConcurrente(queries, maxIteraciones, usuario);
    res.json(resultados);
  } catch (error) {
    console.error('Error en investigación concurrente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor DeepResearch iniciado en http://${HOST}:${PORT}`);
  console.log(`📊 API disponible en http://${HOST}:${PORT}/api`);
  console.log(`🌐 Interfaz web disponible en http://${HOST}:${PORT}`);
});

export default app;

