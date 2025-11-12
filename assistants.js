export function preProcesarConsulta(query) {
    console.log("🧩 Preprocesando consulta...");
    const categorias = ["educación", "salud", "tecnología", "economía"];
    const categoria = categorias.find(c => query.toLowerCase().includes(c)) || "general";
  
    const entidades = query.match(/\b[A-Z][a-z]+\b/g) || [];
    return { categoria, entidades };
  }  