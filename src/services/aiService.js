// src/services/aiService.js — Gemini 2.5 Pro Preview

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

// ── El "Cerebro" Pedagógico de la IA ──────────────────────────────────────────
const SYSTEM = `Eres un experto neuroeducador, pedagogo de alto nivel y diseñador instruccional. 
Tu misión es transformar el contenido bruto de una clase en una experiencia de aprendizaje inmersiva, completa, extensa y altamente didáctica, dividida en 6 estilos de aprendizaje.

REGLA DE ORO: NIVELACIÓN ACADÉMICA ESTRICTA.
Debes adaptar ABSOLUTAMENTE TODO (vocabulario, profundidad técnica, analogías, complejidad de los ejercicios, longitud de los textos y tono) al nivel educativo especificado por el usuario.
- Si es Educación Básica/Primaria: Usa textos más cortos, lenguaje cercano, analogías cotidianas muy simples (juguetes, animales), explicaciones paso a paso, tono muy motivador y lúdico. Usa muchos EMOJIS.
- Si es Educación Media/Secundaria: Textos EXTENSOS. Fomenta el pensamiento crítico, usa lenguaje técnico adecuado, conecta con la realidad juvenil, problemas de análisis.
- Si es Educación Superior/Universitaria: Rigurosidad académica absoluta, textos MUY EXTENSOS, vocabulario experto, análisis complejo, casos de estudio profesionales y citas implícitas.

REGLAS DE FORMATO:
- Basa todo en el contenido proporcionado. Si es muy breve, expándelo didácticamente con conocimientos universales válidos para esa materia y nivel.
- Responde ÚNICAMENTE con JSON válido, sin markdown (\`\`\`) ni texto extra fuera del JSON.`;

// ── Genera los estilos de aprendizaje ──────────────────────────────────────
export async function generateLearningStyles(rawContent, subject, grade) {
  
  // 🧠 DETECTOR DE NIVEL AUTOMÁTICO
  const gradeStr = String(grade || '');
  const isSchoolLevel = /b[aá]sico|b[aá]sica|medio|media/i.test(gradeStr);
  const finalGrade = isSchoolLevel 
    ? gradeStr 
    : `${gradeStr} (Nivel Universitario / Educación Superior - Usa lenguaje técnico, riguroso y MUY extenso)`;

  const prompt = `${SYSTEM}

MATERIA: "${subject}"
NIVEL EDUCATIVO / CURSO: "${finalGrade}"

CONTENIDO BRUTO DE LA CLASE:
---
${rawContent}
---

Genera el material instruccional devolviendo ESTRICTAMENTE este formato JSON (asegúrate de que la complejidad se adapte a ${finalGrade}):
{
  "titulo": "Título atractivo y claro del tema (máx 80 chars)",
  "resumenBreve": "Un párrafo introductorio motivador que enganche al estudiante considerando su edad.",
  "imagenSugerida": "Escribe un prompt EN INGLÉS para generar una ilustración sobre este tema usando una IA generadora de imágenes. (Ej: 'Cute cartoon style illustration of the solar system for kids' o 'Realistic 3D render of human heart anatomy')",
  "lector": {
    "introduccion": "Una introducción extensa que contextualice el tema histórica o conceptualmente.",
    "desarrollo": "El cuerpo principal de la clase. Ajusta la longitud y profundidad estrictamente al nivel del alumno.",
    "conclusion": "Un párrafo robusto que sintetice los aprendizajes.",
    "conceptosClave": [
      {"termino":"Término 1","definicion":"Definición completa y técnica acorde al nivel..."},
      {"termino":"Término 2","definicion":"Definición completa y técnica acorde al nivel..."}
    ],
    "paraSaber": "Un dato curioso o un estudio de caso real que sorprenda al estudiante."
  },
  "visual": {
    "mapaConceptual": {
      "raiz": "CONCEPTO CENTRAL",
      "ramas": [
        {"titulo":"Subtema 1","color":"#4f8ef7","nodos":["Punto A","Punto B","Punto C"]},
        {"titulo":"Subtema 2","color":"#34d399","nodos":["Punto A","Punto B","Punto C"]}
      ]
    },
    "tablaComparativa": {
      "titulo":"Tabla de Análisis y Clasificación",
      "columnas":["Concepto", "Características", "Ejemplo Práctico"],
      "filas":[
        {"celdas": ["Concepto A", "Descripción detallada", "Ejemplo claro A"]},
        {"celdas": ["Concepto B", "Descripción detallada", "Ejemplo claro B"]}
      ]
    },
    "pasosProceso": ["Paso 1: Descripción de fase...", "Paso 2: Descripción de fase..."]
  },
  "auditivo": {
    "narracion": "Escribe un GUION DE PODCAST EDUCATIVO. Si es Básica, que suene como un cuentacuentos. Si es Media, como un youtuber dinámico. Si es Universitario, como una Charla TED. Usa storytelling y preguntas retóricas."
  },
  "quiz": {
    "instrucciones": "Mensaje de ánimo adaptado a la edad.",
    "preguntas": [
      {"id":1,"pregunta":"Pregunta conceptual...","opciones":["Opción A","Opción B (Correcta)","Opción C","Opción D"],"correcta":1,"explicacion":"Explicación detallada..."},
      {"id":2,"pregunta":"Pregunta de análisis...","opciones":["Opción A","Opción B","Opción C (Correcta)","Opción D"],"correcta":2,"explicacion":"Explicación detallada..."}
    ]
  },
  "practica": {
    "introduccion": "Planteamiento de un problema real donde el alumno deba aplicar lo aprendido hoy.",
    "ejercicios": [
      {
        "numero":1,
        "titulo":"Análisis de Caso / Problema Inicial",
        "tipo":"aplicacion",
        "enunciado":"Un enunciado que plantee un problema realista adecuado al nivel del curso...",
        "datos":["Dato clave 1", "Dato clave 2"],
        "pasos":["Paso 1 lógico...", "Paso 2 analítico..."],
        "respuesta":"La solución explicada de forma didáctica.",
        "pista":"Pista inteligente que guíe el pensamiento."
      }
    ]
  },
  "memoria": {
    "instrucciones": "Indicaciones lúdicas para jugar y memorizar los conceptos más importantes.",
    "tarjetasFlash": [
      {"anverso": "Concepto clave o Pregunta corta 1", "reverso": "Respuesta exacta y fácil de recordar"},
      {"anverso": "Concepto clave o Pregunta corta 2", "reverso": "Respuesta exacta y fácil de recordar"},
      {"anverso": "Concepto clave o Pregunta corta 3", "reverso": "Respuesta exacta y fácil de recordar"},
      {"anverso": "Concepto clave o Pregunta corta 4", "reverso": "Respuesta exacta y fácil de recordar"}
    ],
    "completarOraciones": [
      {"oracion": "La capital de Chile es ___.", "respuesta": "Santiago"},
      {"oracion": "La molécula de agua está formada por dos átomos de hidrógeno y uno de ___.", "respuesta": "oxígeno"}
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

  // 🛡️ FILTRO ANTI-CRASH DE FIREBASE
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