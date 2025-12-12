import OpenAI from "openai";
import dotenv from "dotenv";
import { preProcesarConsulta } from "./assistants.js";
import { buscarFuentes } from "./tools.js";
import { evaluarEfectividad } from "./gaia.js";
import { registrarEvento, iniciarSesion, finalizarSesion } from "./logs.js";
import { config } from "./config.js";
import {
  createSession,
  updateSessionStatus,
  saveResult,
  saveSources,
  getCachedResult,
  setCachedResult,
} from "./database.js";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Control de acceso básico
const usuariosAutorizados = process.env.USUARIOS_AUTORIZADOS ?
  process.env.USUARIOS_AUTORIZADOS.split(',') : ['admin'];

function verificarAcceso(usuario = 'admin') {
  if (!usuariosAutorizados.includes(usuario)) {
    throw new Error(`Acceso denegado para usuario: ${usuario}`);
  }
}

export async function deepResearch(query, maxIteraciones = 5, usuario = 'admin') {
  verificarAcceso(usuario);
  
  // Verificar caché si está habilitado
  if (config.cache.enabled) {
    const cached = getCachedResult(query);
    if (cached) {
      console.log("📦 Resultado obtenido del caché");
      return cached;
    }
  }
  
  // Crear sesión en base de datos
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  createSession(sessionId, query, usuario, { maxIteraciones });
  
  iniciarSesion(query);
  registrarEvento("Inicio", `Consulta: ${query}, Usuario: ${usuario}, SessionId: ${sessionId}`);

  const preproceso = preProcesarConsulta(query);
  registrarEvento("Preprocesamiento", `Categoría: ${preproceso.categoria}, Entidades: ${preproceso.entidades.join(', ')}`);

  let fuentes = await buscarFuentes(query);
  registrarEvento("Búsqueda Inicial", `Fuentes encontradas: ${fuentes.length}`);
  
  // Guardar fuentes en base de datos
  saveSources(sessionId, fuentes);

  let analisis = "";
  let evaluacion = { efectividad: 0, cobertura: 0, mejora: 0, observaciones: "" };
  let iteracion = 1;

  // Ciclo de iteración automática
  while (iteracion <= maxIteraciones) {
    registrarEvento(`Iteración ${iteracion}`, "Iniciando análisis");

    const prompt = `
Eres un investigador académico senior especializado en análisis prospectivo y síntesis de información compleja. Tu tarea es generar un análisis de investigación de alta calidad (mínimo 85% efectividad) que demuestre rigor académico y profundidad analítica.

OBJETIVO: Crear un análisis comprehensivo que integre múltiples perspectivas, evidencie pensamiento crítico y proporcione insights accionables.

${iteracion > 1 ? `ITERACIÓN ${iteracion}: Evaluación previa ${evaluacion.efectividad}%. CRÍTICO MEJORAR: "${evaluacion.observaciones}". Enfócate en mayor profundidad, evidencia concreta y estructura académica.` : 'PRIMERA ITERACIÓN: Establece fundamentos sólidos con análisis crítico y evidencia empírica.'}

CONSULTA PRINCIPAL: ${query}
CATEGORÍA ANALÍTICA: ${preproceso.categoria}
ENTIDADES CLAVE IDENTIFICADAS: ${preproceso.entidades.join(', ')}

FUENTES PRIMARIAS DISPONIBLES (${fuentes.length}):
${fuentes.map((f, i) => `FUENTE ${i + 1}: ${f.fuente}\nCONTENIDO: ${f.contenido}\n---`).join("\n")}

PROTOCOLO DE ANÁLISIS ACADÉMICO:

1. **MARCO TEÓRICO Y CONTEXTUALIZACIÓN**
   - Establece el contexto histórico y teórico relevante
   - Define conceptos clave y marcos analíticos aplicables

2. **ANÁLISIS CRÍTICO DE FUENTES**
   - Evalúa credibilidad, sesgos potenciales y perspectivas de cada fuente
   - Identifica convergencias, divergencias y gaps en la información
   - Cruza referencias entre fuentes para validar hallazgos

3. **SÍNTESIS Y PATRONES IDENTIFICADOS**
   - Integra información de múltiples fuentes en narrativa coherente
   - Identifica tendencias, ciclos y factores causales
   - Cuantifica donde sea posible con datos específicos

4. **ANÁLISIS PROSPECTIVO Y ESCENARIOS**
   - Desarrolla escenarios plausibles basados en evidencia
   - Evalúa probabilidades y factores de riesgo
   - Considera variables exógenas y puntos de inflexión

5. **CONCLUSIONES Y RECOMENDACIONES**
   - Sintetiza hallazgos clave con evidencia empírica
   - Proporciona recomendaciones específicas y accionables
   - Identifica áreas para investigación futura

6. **APÉNDICE METODOLÓGICO**
   - Documenta fuentes consultadas y criterios de evaluación
   - Explica limitaciones metodológicas y sesgos potenciales

ESTRUCTURA LA RESPUESTA CON:
- Títulos descriptivos y numeración académica
- Referencias cruzadas entre secciones
- Lenguaje preciso y técnico apropiado
- Evidencia concreta para cada afirmación
- Longitud comprehensiva pero concisa

GENERA EL ANÁLISIS COMPLETO AHORA:
`;

    const respuesta = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
    });

    analisis = respuesta.choices[0].message.content;
    registrarEvento(`Análisis Iteración ${iteracion}`, "Completado por modelo principal GPT.");

    evaluacion = await evaluarEfectividad(query, fuentes, analisis, iteracion);
    registrarEvento(`Evaluación Iteración ${iteracion}`,
      `Efectividad: ${evaluacion.efectividad}%, Cobertura: ${(evaluacion.cobertura * 100).toFixed(1)}%, Mejora: ${(evaluacion.mejora * 100).toFixed(1)}%`);

    // Guardar resultado de esta iteración
    saveResult(sessionId, iteracion, {
      analisis,
      evaluacion,
      fuentes: fuentes.length,
    });

    // Si la efectividad es buena (>=threshold) o es la última iteración, terminar
    if (evaluacion.efectividad >= config.research.qualityThreshold || iteracion === maxIteraciones) {
      break;
    }

    // Para próximas iteraciones, intentar mejorar fuentes
    if (evaluacion.cobertura < 0.7) {
      registrarEvento(`Mejora Iteración ${iteracion}`, "Buscando fuentes adicionales");
      const fuentesAdicionales = await buscarFuentes(query + " " + preproceso.categoria);
      fuentes = [...fuentes, ...fuentesAdicionales.filter(f => !fuentes.some(existing => existing.fuente === f.fuente))];
    }

    iteracion++;
  }

  console.log("\n🧠 RESULTADO FINAL:");
  console.log("-------------------");
  console.log(analisis);
  console.log(`\n⚙️ Efectividad: ${evaluacion.efectividad}%`);
  console.log(`📈 Cobertura: ${(evaluacion.cobertura * 100).toFixed(1)}%`);
  console.log(`🔄 Mejora iterativa: ${(evaluacion.mejora * 100).toFixed(1)}%`);
  console.log(`💬 Observación GAIA: ${evaluacion.observaciones}`);
  console.log(`🔁 Iteraciones realizadas: ${iteracion}`);

  const resultado = {
    sessionId,
    analisis,
    evaluacion,
    iteraciones: iteracion,
    fuentes: fuentes.length,
    usuario,
    query,
    timestamp: new Date().toISOString()
  };

  // Actualizar sesión como completada
  updateSessionStatus(sessionId, 'completed', {
    efectividad: evaluacion.efectividad,
    cobertura: evaluacion.cobertura,
    iteraciones: iteracion,
  });

  // Guardar en caché si está habilitado
  if (config.cache.enabled) {
    setCachedResult(query, resultado);
  }

  finalizarSesion(resultado);
  return resultado;
}

// Función para consultas concurrentes
export async function deepResearchConcurrente(queries, maxIteraciones = 3, usuario = 'admin') {
  verificarAcceso(usuario);
  console.log(`🚀 Iniciando ${queries.length} consultas concurrentes`);

  const promesas = queries.map((query, index) =>
    deepResearch(query, maxIteraciones, usuario)
      .then(resultado => ({ index, query, resultado }))
      .catch(error => ({ index, query, error: error.message }))
  );

  const resultados = await Promise.allSettled(promesas);

  const exitosos = resultados.filter(r => r.status === 'fulfilled').map(r => r.value);
  const fallidos = resultados.filter(r => r.status === 'rejected').map(r => r.reason);

  console.log(`✅ Consultas exitosas: ${exitosos.length}`);
  console.log(`❌ Consultas fallidas: ${fallidos.length}`);

  return { exitosos, fallidos };
}

// Ejemplo de uso (descomentado para probar):
// deepResearch("precio del dólar?");

// Ejemplo de uso concurrente (descomentado para probar):
// deepResearchConcurrente([
//   "Impacto del cambio climático en América Latina",
//   "Tendencias tecnológicas para 2030",
//   "Desarrollo económico de Colombia"
// ]);
