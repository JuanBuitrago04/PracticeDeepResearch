import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

// Asegurar que el directorio de datos existe
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.database.path);

// Inicializar esquema de base de datos
export function initializeDatabase() {
  // Tabla de sesiones de investigación
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_sessions (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      usuario TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      metadata TEXT
    )
  `);

  // Tabla de resultados
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_results (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      iteration INTEGER NOT NULL,
      analisis TEXT NOT NULL,
      efectividad REAL,
      cobertura REAL,
      mejora REAL,
      observaciones TEXT,
      fuentes_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES research_sessions(id)
    )
  `);

  // Tabla de fuentes
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      fuente TEXT NOT NULL,
      contenido TEXT,
      tipo TEXT DEFAULT 'web',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES research_sessions(id)
    )
  `);

  // Tabla de caché
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      query_hash TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )
  `);

  // Índices para mejorar rendimiento
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON research_sessions(usuario);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON research_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_results_session ON research_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
  `);

  console.log('✅ Base de datos inicializada correctamente');
}

// Funciones para sesiones
export function createSession(sessionId, query, usuario, metadata = {}) {
  const stmt = db.prepare(`
    INSERT INTO research_sessions (id, query, usuario, metadata)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(sessionId, query, usuario, JSON.stringify(metadata));
  return sessionId;
}

export function updateSessionStatus(sessionId, status, metadata = {}) {
  const stmt = db.prepare(`
    UPDATE research_sessions 
    SET status = ?, completed_at = CURRENT_TIMESTAMP, metadata = ?
    WHERE id = ?
  `);
  stmt.run(status, JSON.stringify(metadata), sessionId);
}

export function getSession(sessionId) {
  const stmt = db.prepare('SELECT * FROM research_sessions WHERE id = ?');
  const session = stmt.get(sessionId);
  if (session && session.metadata) {
    session.metadata = JSON.parse(session.metadata);
  }
  return session;
}

export function getSessionsByUser(usuario, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM research_sessions 
    WHERE usuario = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(usuario, limit).map(session => ({
    ...session,
    metadata: session.metadata ? JSON.parse(session.metadata) : {}
  }));
}

// Funciones para resultados
export function saveResult(sessionId, iteration, result) {
  const resultId = `${sessionId}_${iteration}_${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO research_results 
    (id, session_id, iteration, analisis, efectividad, cobertura, mejora, observaciones, fuentes_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    resultId,
    sessionId,
    iteration,
    result.analisis,
    result.evaluacion?.efectividad || null,
    result.evaluacion?.cobertura || null,
    result.evaluacion?.mejora || null,
    result.evaluacion?.observaciones || null,
    result.fuentes || 0
  );
  return resultId;
}

export function getResultsBySession(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM research_results 
    WHERE session_id = ? 
    ORDER BY iteration ASC
  `);
  return stmt.all(sessionId);
}

// Funciones para fuentes
export function saveSources(sessionId, sources) {
  const stmt = db.prepare(`
    INSERT INTO sources (session_id, fuente, contenido, tipo)
    VALUES (?, ?, ?, ?)
  `);
  const insertMany = db.transaction((sources) => {
    for (const source of sources) {
      stmt.run(sessionId, source.fuente, source.contenido, source.tipo || 'web');
    }
  });
  insertMany(sources);
}

export function getSourcesBySession(sessionId) {
  const stmt = db.prepare('SELECT * FROM sources WHERE session_id = ?');
  return stmt.all(sessionId);
}

// Funciones para caché
export function getCachedResult(query) {
  const queryHash = hashQuery(query);
  const stmt = db.prepare(`
    SELECT * FROM cache 
    WHERE query_hash = ? AND expires_at > datetime('now')
  `);
  const cached = stmt.get(queryHash);
  if (cached) {
    return JSON.parse(cached.result);
  }
  return null;
}

export function setCachedResult(query, result, ttl = config.cache.ttl) {
  const queryHash = hashQuery(query);
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cache (query_hash, query, result, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(queryHash, query, JSON.stringify(result), expiresAt);
}

export function clearExpiredCache() {
  const stmt = db.prepare("DELETE FROM cache WHERE expires_at < datetime('now')");
  const result = stmt.run();
  return result.changes;
}

function hashQuery(query) {
  // Hash simple para identificar consultas similares
  return Buffer.from(query.toLowerCase().trim()).toString('base64').substring(0, 64);
}

// Estadísticas
export function getStatistics(usuario = null) {
  let query = `
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
      AVG((SELECT AVG(efectividad) FROM research_results WHERE session_id = research_sessions.id)) as avg_effectiveness,
      AVG((SELECT COUNT(*) FROM research_results WHERE session_id = research_sessions.id)) as avg_iterations
    FROM research_sessions
  `;
  
  if (usuario) {
    query += ' WHERE usuario = ?';
    return db.prepare(query).get(usuario);
  }
  
  return db.prepare(query).get();
}

// Inicializar al importar
initializeDatabase();

export default db;

