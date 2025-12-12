import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { config } from './config.js';

// Asegurar que el directorio de exportación existe
if (!fs.existsSync(config.export.outputDir)) {
  fs.mkdirSync(config.export.outputDir, { recursive: true });
}

/**
 * Exporta un resultado de investigación en el formato especificado
 */
export async function exportResult(data, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':
      return exportJSON(data);
    case 'markdown':
      return exportMarkdown(data);
    case 'pdf':
      return exportPDF(data);
    default:
      throw new Error(`Formato no soportado: ${format}`);
  }
}

/**
 * Exporta como JSON
 */
function exportJSON(data) {
  const json = JSON.stringify(data, null, 2);
  return {
    data: Buffer.from(json, 'utf-8'),
    contentType: 'application/json',
  };
}

/**
 * Exporta como Markdown
 */
function exportMarkdown(data) {
  const { session, result, sources } = data;
  
  let markdown = `# Investigación: ${session.query}\n\n`;
  markdown += `**Sesión ID:** ${session.id}\n`;
  markdown += `**Usuario:** ${session.usuario}\n`;
  markdown += `**Fecha:** ${new Date(session.created_at).toLocaleString()}\n`;
  markdown += `**Estado:** ${session.status}\n\n`;
  
  if (result) {
    markdown += `## Métricas de Calidad\n\n`;
    markdown += `- **Efectividad:** ${result.efectividad?.toFixed(2) || 'N/A'}%\n`;
    markdown += `- **Cobertura:** ${((result.cobertura || 0) * 100).toFixed(2)}%\n`;
    markdown += `- **Mejora:** ${((result.mejora || 0) * 100).toFixed(2)}%\n`;
    markdown += `- **Iteración:** ${result.iteration}\n\n`;
    
    if (result.observaciones) {
      markdown += `**Observaciones GAIA:** ${result.observaciones}\n\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `## Análisis\n\n`;
    markdown += `${result.analisis}\n\n`;
  }
  
  if (sources && sources.length > 0) {
    markdown += `---\n\n`;
    markdown += `## Fuentes Consultadas\n\n`;
    sources.forEach((source, index) => {
      markdown += `### Fuente ${index + 1}: ${source.fuente}\n\n`;
      markdown += `**Tipo:** ${source.tipo || 'web'}\n\n`;
      if (source.contenido) {
        const preview = source.contenido.substring(0, 500);
        markdown += `${preview}${source.contenido.length > 500 ? '...' : ''}\n\n`;
      }
    });
  }
  
  markdown += `\n---\n\n`;
  markdown += `*Generado por DeepResearch el ${new Date().toLocaleString()}*\n`;
  
  return {
    data: Buffer.from(markdown, 'utf-8'),
    contentType: 'text/markdown',
  };
}

/**
 * Exporta como PDF
 */
function exportPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType: 'application/pdf',
        });
      });
      doc.on('error', reject);
      
      const { session, result, sources } = data;
      
      // Título
      doc.fontSize(20).text('DeepResearch', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(session.query, { align: 'center' });
      doc.moveDown(2);
      
      // Información de sesión
      doc.fontSize(12);
      doc.text(`Sesión ID: ${session.id}`);
      doc.text(`Usuario: ${session.usuario}`);
      doc.text(`Fecha: ${new Date(session.created_at).toLocaleString()}`);
      doc.text(`Estado: ${session.status}`);
      doc.moveDown();
      
      // Métricas
      if (result) {
        doc.fontSize(14).text('Métricas de Calidad', { underline: true });
        doc.fontSize(11);
        doc.text(`Efectividad: ${result.efectividad?.toFixed(2) || 'N/A'}%`);
        doc.text(`Cobertura: ${((result.cobertura || 0) * 100).toFixed(2)}%`);
        doc.text(`Mejora: ${((result.mejora || 0) * 100).toFixed(2)}%`);
        doc.text(`Iteración: ${result.iteration}`);
        doc.moveDown();
        
        if (result.observaciones) {
          doc.fontSize(12).text('Observaciones GAIA:', { underline: true });
          doc.fontSize(10).text(result.observaciones, { align: 'justify' });
          doc.moveDown();
        }
        
        // Análisis
        doc.addPage();
        doc.fontSize(14).text('Análisis', { underline: true });
        doc.moveDown();
        doc.fontSize(10);
        const analysisLines = result.analisis.split('\n');
        analysisLines.forEach(line => {
          if (line.trim().startsWith('#')) {
            doc.fontSize(12).text(line.trim(), { underline: true });
          } else {
            doc.text(line, { align: 'justify' });
          }
        });
      }
      
      // Fuentes
      if (sources && sources.length > 0) {
        doc.addPage();
        doc.fontSize(14).text('Fuentes Consultadas', { underline: true });
        doc.moveDown();
        sources.forEach((source, index) => {
          doc.fontSize(12).text(`Fuente ${index + 1}: ${source.fuente}`, { underline: true });
          doc.fontSize(10);
          doc.text(`Tipo: ${source.tipo || 'web'}`);
          if (source.contenido) {
            const preview = source.contenido.substring(0, 300);
            doc.text(preview + (source.contenido.length > 300 ? '...' : ''), { align: 'justify' });
          }
          doc.moveDown();
        });
      }
      
      // Footer
      doc.fontSize(8).text(
        `Generado por DeepResearch el ${new Date().toLocaleString()}`,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Guarda un archivo exportado en el sistema de archivos
 */
export function saveExport(data, format, filename = null) {
  const exported = exportResult(data, format);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalFilename = filename || `research_${timestamp}.${format}`;
  const filepath = path.join(config.export.outputDir, finalFilename);
  
  fs.writeFileSync(filepath, exported.data);
  return filepath;
}

export default { exportResult, saveExport };

