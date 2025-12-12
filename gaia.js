import OpenAI from "openai";
import dotenv from "dotenv";
import { config } from "./config.js";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Evalúa la calidad del análisis usando el modelo GAIA
 * Mide precisión, profundidad, coherencia y efectividad general
 */
export async function evaluarEfectividad(query, fuentes, analisis, iteracion = 1) {
  console.log("⚙️ Evaluando efectividad con GAIA...");

  const prompt = `
Eres GAIA, un evaluador experto en calidad de investigaciones profundas.
Analiza el siguiente informe y evalúalo según criterios académicos de precisión, profundidad y coherencia.

🧠 CONSULTA:
${query}

📚 FUENTES UTILIZADAS: ${fuentes.length}

📄 ANÁLISIS A EVALUAR:
${analisis}

📊 CRITERIOS DE EVALUACIÓN:

EFECTIVIDAD (0-100):
- Precisión y exactitud de la información (20%)
- Profundidad del análisis y complejidad abordada (20%)
- Integración efectiva de múltiples fuentes (15%)
- Estructura académica y coherencia lógica (15%)
- Evidencia empírica y referencias concretas (15%)
- Insights originales y pensamiento crítico (10%)
- Recomendaciones prácticas y accionables (5%)

COBERTURA (0.0-1.0):
- Grado en que se usaron y conectaron fuentes relevantes.

MEJORA (0.0-1.0):
- Incremento de calidad respecto a la iteración anterior.

Responde SOLO en formato JSON válido:
{
  "efectividad": 92,
  "cobertura": 0.88,
  "mejora": 0.12,
  "observaciones": "Análisis profundo, bien estructurado y con buena integración de fuentes confiables."
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: config.gaia.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.gaia.maxTokens,
      temperature: config.gaia.temperature, // baja aleatoriedad, resultados más consistentes
    });

    let content = response.choices[0].message.content.trim();

    // Limpieza y extracción segura del JSON
    content = content.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
    let resultado;

    try {
      resultado = JSON.parse(content);
    } catch (error) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) resultado = JSON.parse(jsonMatch[0]);
      else throw new Error("❌ No se pudo extraer JSON válido de la respuesta de GAIA.");
    }

    // Validaciones
    if (typeof resultado.efectividad !== "number" || resultado.efectividad < 0 || resultado.efectividad > 100) {
      throw new Error("Valor de efectividad inválido o fuera de rango");
    }

    return {
      efectividad: resultado.efectividad,
      cobertura: resultado.cobertura ?? 0.5,
      mejora: resultado.mejora ?? 0,
      observaciones: resultado.observaciones ?? "Evaluación completada correctamente",
    };
  } catch (error) {
    console.error("⚠️ Error en la evaluación GAIA:", error.message);
    return {
      efectividad: 50,
      cobertura: 0.5,
      mejora: 0,
      observaciones: "Error en la evaluación. Se usaron valores por defecto.",
    };
  }
}
