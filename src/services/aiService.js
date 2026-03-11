// src/services/aiService.js — Gemini 2.5 Pro Preview

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

// ── El "Cerebro" Pedagógico de la IA ──────────────────────────────────────────
const SYSTEM = `Eres un experto neuroeducador, pedagogo de alto nivel y diseñador instruccional. 
Tu misión es transformar el contenido bruto de una clase en una experiencia de aprendizaje inmersiva, completa, extensa y altamente didáctica, dividida en 5 estilos de aprendizaje.

REGLA DE ORO: NIVELACIÓN ACADÉMICA ESTRICTA.
Debes adaptar ABSOLUTAMENTE TODO (vocabulario, profundidad técnica, analogías, complejidad de los ejercicios y tono) al nivel educativo especificado por el usuario.
- Si es Educación Básica/Primaria: Usa lenguaje cercano, analogías cotidianas muy simples, explicaciones paso a paso, tono muy motivador y lúdico.
- Si es Educación Media/Secundaria: Fomenta el pensamiento crítico, usa lenguaje técnico adecuado, conecta con la realidad juvenil, problemas de análisis.
- Si es Educación Superior/Universitaria: Rigurosidad académica absoluta, vocabulario experto, análisis complejo, casos de estudio profesionales y bibliografía implícita.

REGLAS DE FORMATO:
- Basa todo en el contenido proporcionado. Si es muy breve, expándelo didácticamente con conocimientos universales válidos para esa materia y nivel.
- Genera contenido EXTENSO y COMPLETO. No hagas resúmenes cortos. Queremos una clase magistral.
- Responde ÚNICAMENTE con JSON válido, sin markdown (\`\`\`) ni texto extra fuera del JSON.`;

// ── Genera los 5 estilos de aprendizaje ──────────────────────────────────────
export async function generateLearningStyles(rawContent, subject, grade) {
  const prompt = `${SYSTEM}

MATERIA: "${subject}"
NIVEL EDUCATIVO / CURSO: "${grade}"

CONTENIDO BRUTO DE LA CLASE:
---
${rawContent}
---

Genera el material instruccional devolviendo ESTRICTAMENTE este formato JSON (asegúrate de que los textos sean extensos y detallados):
{
  "titulo": "Título atractivo y claro del tema (máx 80 chars)",
  "resumenBreve": "Un párrafo introductorio motivador que enganche al estudiante considerando su edad.",
  "lector": {
    "introduccion": "Una introducción extensa de 2 a 3 párrafos que contextualice el tema histórica o conceptualmente.",
    "desarrollo": "El cuerpo principal de la clase. Debe ser MUY extenso, con al menos 4 a 5 párrafos detallados. Explica el 'por qué' y el 'cómo' a fondo, usando el lenguaje adecuado para el nivel.",
    "conclusion": "Un párrafo robusto que sintetice los aprendizajes y deje una reflexión final.",
    "conceptosClave": [
      {"termino":"Término 1","definicion":"Definición completa y técnica acorde al nivel..."},
      {"termino":"Término 2","definicion":"Definición completa y técnica acorde al nivel..."},
      {"termino":"Término 3","definicion":"Definición completa y técnica acorde al nivel..."},
      {"termino":"Término 4","definicion":"Definición completa y técnica acorde al nivel..."}
    ],
    "paraSaber": "Un dato curioso, un estudio de caso real o una aplicación en la vida diaria que sorprenda al estudiante."
  },
  "visual": {
    "mapaConceptual": {
      "raiz": "CONCEPTO CENTRAL (Breve)",
      "ramas": [
        {"titulo":"Subtema 1 principal","color":"#4f8ef7","nodos":["Detalle específico A","Detalle específico B","Detalle específico C"]},
        {"titulo":"Subtema 2 principal","color":"#34d399","nodos":["Detalle específico A","Detalle específico B","Detalle específico C"]},
        {"titulo":"Subtema 3 principal","color":"#fbbf24","nodos":["Detalle específico A","Detalle específico B","Detalle específico C"]}
      ]
    },
    "tablaComparativa": {
      "titulo":"Tabla de Análisis y Clasificación",
      "columnas":["Elemento / Concepto", "Características Principales", "Ejemplo Práctico"],
      "filas":[
        {"celdas": ["Concepto A", "Descripción detallada del concepto A", "Ejemplo claro A"]},
        {"celdas": ["Concepto B", "Descripción detallada del concepto B", "Ejemplo claro B"]},
        {"celdas": ["Concepto C", "Descripción detallada del concepto C", "Ejemplo claro C"]}
      ]
    },
    "pasosProceso": ["Paso 1: Descripción detallada de la primera fase...", "Paso 2: Descripción detallada de la segunda fase...", "Paso 3: Descripción de la tercera fase...", "Paso 4: Conclusión del ciclo o proceso..."]
  },
  "auditivo": {
    "narracion": "Escribe un GUION DE PODCAST EDUCATIVO extenso (al menos 6 párrafos). Debe ser muy conversacional, usar storytelling, metáforas vívidas y hacer preguntas retóricas al oyente. Usa expresiones como 'Imagina por un momento...', 'Piénsalo de esta manera...'. Debe sonar como el mejor profesor del mundo hablando directamente al alumno."
  },
  "quiz": {
    "instrucciones": "Instrucciones claras y un mensaje de ánimo adaptado a la edad del estudiante.",
    "preguntas": [
      {"id":1,"pregunta":"Pregunta conceptual de nivel intermedio...","opciones":["Opción A","Opción B (Correcta)","Opción C","Opción D"],"correcta":1,"explicacion":"Explicación pedagógica detallada de por qué esta es la respuesta correcta y las demás no."},
      {"id":2,"pregunta":"Pregunta de aplicación práctica...","opciones":["Opción A (Correcta)","Opción B","Opción C","Opción D"],"correcta":0,"explicacion":"Explicación pedagógica detallada..."},
      {"id":3,"pregunta":"Pregunta de análisis o deducción...","opciones":["Opción A","Opción B","Opción C (Correcta)","Opción D"],"correcta":2,"explicacion":"Explicación pedagógica detallada..."},
      {"id":4,"pregunta":"Pregunta teórica específica...","opciones":["Opción A","Opción B","Opción C","Opción D (Correcta)"],"correcta":3,"explicacion":"Explicación pedagógica detallada..."},
      {"id":5,"pregunta":"Pregunta desafiante para pensar...","opciones":["Opción A","Opción B (Correcta)","Opción C","Opción D"],"correcta":1,"explicacion":"Explicación pedagógica detallada..."}
    ]
  },
  "practica": {
    "introduccion": "Planteamiento de una situación o problema real donde el alumno deba aplicar lo aprendido hoy.",
    "ejercicios": [
      {
        "numero":1,
        "titulo":"Análisis de Caso / Problema Inicial",
        "tipo":"aplicacion",
        "enunciado":"Un enunciado extenso que plantee un problema o escenario realista adecuado al nivel del curso...",
        "datos":["Dato clave 1", "Dato clave 2", "Contexto relevante"],
        "pasos":["Paso 1 lógico a seguir...", "Paso 2 matemático o analítico...", "Paso 3 de comprobación..."],
        "respuesta":"La solución o conclusión final explicada paso a paso de forma didáctica.",
        "pista":"Una pista inteligente que no dé la respuesta directa, sino que guíe el pensamiento."
      },
      {
        "numero":2,
        "titulo":"Desafío Práctico Avanzado",
        "tipo":"analisis",
        "enunciado":"Planteamiento de un segundo escenario más complejo que requiera pensamiento crítico...",
        "datos":["Premisa 1", "Premisa 2", "Condición especial"],
        "pasos":["Primer paso reflexivo...", "Segundo paso de ejecución...", "Tercer paso de síntesis..."],
        "respuesta":"Desarrollo completo de la solución esperada.",
        "pista":"Sugerencia metodológica para resolverlo."
      }
    ]
  }
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        // Subimos un poco la temperatura (0.5) para que sea más creativo y narrativo en el modo auditivo,
        // pero lo mantenemos lo suficientemente bajo para no romper el formato JSON.
        temperature: 0.5, 
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió contenido');
  
  const parsedContent = JSON.parse(text);

  // 🛡️ FILTRO ANTI-CRASH DE FIREBASE: 
  // Convierte los arreglos internos en objetos si Gemini llega a equivocarse
  if (parsedContent.visual?.tablaComparativa?.filas) {
    parsedContent.visual.tablaComparativa.filas = parsedContent.visual.tablaComparativa.filas.map(fila => {
      return Array.isArray(fila) ? { celdas: fila } : fila;
    });
  }

  return parsedContent;
}

// ── Extrae texto de PDF usando Gemini Vision ─────────────────────────────────
export async function extractTextFromPDF(file) {
  const base64 = await fileToBase64(file);
  const mimeType = file.type || 'application/pdf';

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: 'Extrae y devuelve TODO el texto de este documento de forma ordenada y limpia. Evita perder información valiosa y preserva la estructura de los párrafos originales.' }
        ]
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error extrayendo PDF: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no pudo extraer texto del archivo');
  return text;
}

// ── Convierte File a base64 ────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// ── Análisis de riesgo de deserción con Gemini ────────────────────────────────
export async function analyzeDropoutRisk(studentData) {
  const prompt = `Eres un psicopedagogo experto en analítica educativa y prevención de deserción escolar.
Analiza estos datos métricos de un estudiante y genera un informe de riesgo empático, profesional y accionable para su profesor.

DATOS DEL ESTUDIANTE:
${JSON.stringify(studentData, null, 2)}

Responde ÚNICAMENTE con JSON bajo esta estructura exacta:
{
  "nivelRiesgo": "alto|medio|bajo",
  "resumen": "3 oraciones analizando profundamente el comportamiento, desempeño y tendencia del alumno basándote en los datos.",
  "factores": ["Factor de riesgo pedagógico 1 detallado", "Factor de riesgo 2"],
  "recomendaciones": ["Estrategia pedagógica concreta 1 para el profesor", "Acción de intervención 2", "Sugerencia de acercamiento 3"],
  "mensajeAlumno": "Un mensaje o correo empático, humano y motivador (máx 3 oraciones) que el profesor pueda enviarle directamente al alumno para acercarse a él sin que suene a regaño."
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error('Error analizando riesgo');
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}