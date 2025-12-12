import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Configuración por defecto
const defaultConfig = {
  research: {
    maxIterations: 5,
    qualityThreshold: 85,
    minSources: 3,
    maxSources: 10,
    timeout: 300000, // 5 minutos
  },
  gaia: {
    model: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 350,
  },
  openai: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4000,
  },
  cache: {
    enabled: true,
    ttl: 86400000, // 24 horas en milisegundos
  },
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },
  database: {
    path: './data/research.db',
  },
  export: {
    formats: ['json', 'markdown', 'pdf'],
    outputDir: './exports',
  },
  sources: {
    web: {
      enabled: true,
      maxResults: 10,
      timeout: 10000,
    },
    academic: {
      enabled: false,
      apis: {
        crossref: {
          enabled: false,
          email: process.env.CROSSREF_EMAIL || '',
        },
        arxiv: {
          enabled: false,
        },
      },
    },
  },
};

// Cargar configuración personalizada si existe
let customConfig = {};
if (fs.existsSync('./config.json')) {
  try {
    const configFile = fs.readFileSync('./config.json', 'utf-8');
    customConfig = JSON.parse(configFile);
  } catch (error) {
    console.warn('⚠️ Error cargando config.json, usando valores por defecto:', error.message);
  }
}

// Merge de configuraciones
export const config = {
  ...defaultConfig,
  ...customConfig,
  research: { ...defaultConfig.research, ...customConfig.research },
  gaia: { ...defaultConfig.gaia, ...customConfig.gaia },
  openai: { ...defaultConfig.openai, ...customConfig.openai },
  cache: { ...defaultConfig.cache, ...customConfig.cache },
  server: { ...defaultConfig.server, ...customConfig.server },
  database: { ...defaultConfig.database, ...customConfig.database },
  export: { ...defaultConfig.export, ...customConfig.export },
  sources: { ...defaultConfig.sources, ...customConfig.sources },
};

// Validar configuración crítica
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY no está configurada. Algunas funciones pueden no funcionar.');
}

export default config;

