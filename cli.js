#!/usr/bin/env node

import readline from 'readline';
import { deepResearch, deepResearchConcurrente } from './deepresearch.js';
import { getSession, getSessionsByUser, getStatistics } from './database.js';
import { exportResult, saveExport } from './export.js';
import { config } from './config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function printHeader() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         🔬 DeepResearch CLI v2.0                      ║');
  console.log('║         AI-Powered Academic Research Assistant          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

function printMenu() {
  console.log('\n📋 Menú Principal:');
  console.log('1. Realizar investigación');
  console.log('2. Ver sesiones anteriores');
  console.log('3. Ver estadísticas');
  console.log('4. Exportar resultado');
  console.log('5. Investigación concurrente');
  console.log('6. Configuración');
  console.log('0. Salir\n');
}

async function realizarInvestigacion() {
  console.log('\n🔍 Nueva Investigación');
  console.log('─────────────────────\n');
  
  const query = await question('Ingresa tu consulta de investigación: ');
  if (!query.trim()) {
    console.log('❌ La consulta no puede estar vacía.');
    return;
  }
  
  const maxIterStr = await question(`Número máximo de iteraciones [${config.research.maxIterations}]: `);
  const maxIter = maxIterStr.trim() ? parseInt(maxIterStr) : config.research.maxIterations;
  
  const usuario = await question(`Usuario [admin]: `) || 'admin';
  
  console.log('\n🚀 Iniciando investigación...\n');
  
  try {
    const resultado = await deepResearch(query, maxIter, usuario);
    console.log('\n✅ Investigación completada exitosamente!');
    console.log(`📊 Efectividad: ${resultado.evaluacion.efectividad}%`);
    console.log(`📈 Cobertura: ${(resultado.evaluacion.cobertura * 100).toFixed(1)}%`);
    console.log(`🔄 Iteraciones: ${resultado.iteraciones}`);
    
    const exportar = await question('\n¿Deseas exportar el resultado? (s/n): ');
    if (exportar.toLowerCase() === 's') {
      await exportarResultado(resultado);
    }
  } catch (error) {
    console.error('\n❌ Error durante la investigación:', error.message);
  }
}

async function verSesiones() {
  console.log('\n📚 Sesiones Anteriores');
  console.log('─────────────────────\n');
  
  const usuario = await question('Usuario [admin]: ') || 'admin';
  const limitStr = await question('Número de sesiones a mostrar [10]: ') || '10';
  const limit = parseInt(limitStr);
  
  try {
    const sessions = getSessionsByUser(usuario, limit);
    
    if (sessions.length === 0) {
      console.log('No se encontraron sesiones para este usuario.');
      return;
    }
    
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.query}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Estado: ${session.status}`);
      console.log(`   Fecha: ${new Date(session.created_at).toLocaleString()}`);
    });
    
    const verDetalle = await question('\n¿Ver detalle de alguna sesión? (número o Enter para salir): ');
    if (verDetalle.trim()) {
      const index = parseInt(verDetalle) - 1;
      if (index >= 0 && index < sessions.length) {
        await verDetalleSesion(sessions[index].id);
      }
    }
  } catch (error) {
    console.error('❌ Error obteniendo sesiones:', error.message);
  }
}

async function verDetalleSesion(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    console.log('❌ Sesión no encontrada.');
    return;
  }
  
  console.log('\n📄 Detalle de Sesión');
  console.log('─────────────────────\n');
  console.log(`Consulta: ${session.query}`);
  console.log(`Estado: ${session.status}`);
  console.log(`Fecha: ${new Date(session.created_at).toLocaleString()}`);
  
  // Aquí podrías agregar más detalles si los necesitas
}

async function verEstadisticas() {
  console.log('\n📊 Estadísticas');
  console.log('─────────────────────\n');
  
  const usuario = await question('Usuario (Enter para todos): ') || null;
  
  try {
    const stats = getStatistics(usuario);
    console.log(`Total de sesiones: ${stats.total_sessions}`);
    console.log(`Sesiones completadas: ${stats.completed_sessions}`);
    console.log(`Efectividad promedio: ${(stats.avg_effectiveness || 0).toFixed(2)}%`);
    console.log(`Iteraciones promedio: ${(stats.avg_iterations || 0).toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
  }
}

async function exportarResultado(resultado) {
  console.log('\n💾 Exportar Resultado');
  console.log('─────────────────────\n');
  
  console.log('Formatos disponibles:');
  console.log('1. JSON');
  console.log('2. Markdown');
  console.log('3. PDF');
  
  const formato = await question('Selecciona formato (1-3): ');
  const formatos = { '1': 'json', '2': 'markdown', '3': 'pdf' };
  const formatoSeleccionado = formatos[formato];
  
  if (!formatoSeleccionado) {
    console.log('❌ Formato inválido.');
    return;
  }
  
  try {
    const filepath = saveExport(
      {
        session: { id: resultado.sessionId || 'unknown', query: resultado.query || 'Unknown', usuario: resultado.usuario, created_at: resultado.timestamp, status: 'completed' },
        result: { analisis: resultado.analisis, efectividad: resultado.evaluacion.efectividad, cobertura: resultado.evaluacion.cobertura, mejora: resultado.evaluacion.mejora, observaciones: resultado.evaluacion.observaciones, iteration: resultado.iteraciones },
        sources: []
      },
      formatoSeleccionado
    );
    console.log(`\n✅ Archivo exportado: ${filepath}`);
  } catch (error) {
    console.error('❌ Error exportando:', error.message);
  }
}

async function investigacionConcurrente() {
  console.log('\n🚀 Investigación Concurrente');
  console.log('─────────────────────\n');
  
  console.log('Ingresa múltiples consultas (una por línea, línea vacía para terminar):');
  const queries = [];
  
  while (true) {
    const query = await question(`Consulta ${queries.length + 1}: `);
    if (!query.trim()) break;
    queries.push(query.trim());
  }
  
  if (queries.length === 0) {
    console.log('❌ Debes ingresar al menos una consulta.');
    return;
  }
  
  const maxIterStr = await question(`Iteraciones máximas [3]: `);
  const maxIter = maxIterStr.trim() ? parseInt(maxIterStr) : 3;
  
  console.log('\n🚀 Iniciando investigaciones concurrentes...\n');
  
  try {
    const resultados = await deepResearchConcurrente(queries, maxIter, 'admin');
    console.log(`\n✅ Completadas: ${resultados.exitosos.length}`);
    console.log(`❌ Fallidas: ${resultados.fallidos.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function mostrarConfiguracion() {
  console.log('\n⚙️ Configuración Actual');
  console.log('─────────────────────\n');
  console.log(JSON.stringify(config, null, 2));
}

async function main() {
  printHeader();
  
  while (true) {
    printMenu();
    const opcion = await question('Selecciona una opción: ');
    
    switch (opcion) {
      case '1':
        await realizarInvestigacion();
        break;
      case '2':
        await verSesiones();
        break;
      case '3':
        await verEstadisticas();
        break;
      case '4':
        console.log('⚠️ Esta función requiere un sessionId. Usa la opción 2 para ver sesiones.');
        break;
      case '5':
        await investigacionConcurrente();
        break;
      case '6':
        await mostrarConfiguracion();
        break;
      case '0':
        console.log('\n👋 ¡Hasta luego!\n');
        rl.close();
        process.exit(0);
      default:
        console.log('❌ Opción inválida.');
    }
  }
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 ¡Hasta luego!\n');
  rl.close();
  process.exit(0);
});

main().catch(console.error);

