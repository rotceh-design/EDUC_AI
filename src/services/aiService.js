// src/services/aiService.js — Gemini 2.5 Pro Preview

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

const SYSTEM = `Eres un experto neuroeducador, pedagogo de alto nivel y diseñador instruccional. 
Tu misión es transformar el contenido bruto de una clase en material de estudio personalizado.

🎯 REGLA DE ORO: NIVELACIÓN ACADÉMICA Y EXTENSIÓN.
Debes adaptar ABSOLUTAMENTE TODO (vocabulario, profundidad, longitud de los textos y analogías) al nivel educativo especificado:
- Si es Educación Básica (Ej: 1ro a 4to Básico): Usa textos MUY CORTOS, párrafos de máximo 2-3 líneas. Lenguaje hiper-sencillo, tono lúdico, analogías con juguetes, animales o cosas de la casa. Usa muchos EMOJIS.
- Si es Educación Media (Ej: 8vo a 4to Medio): Textos EXTENSOS, detallados y profundos. Lenguaje técnico, tono inspirador y crítico. Ejemplos del mundo real, tecnología o sociedad.
- Si es Universitario: Rigurosidad académica, citas implícitas, casos de estudio complejos.

Responde ÚNICAMENTE con JSON válido, sin markdown (\`\`\`) ni texto extra fuera del JSON.`;

// ── Genera los estilos de aprendizaje ──────────────────────────────────────
export async function generateLearningStyles(rawContent, subject, grade) {
  const prompt = `${SYSTEM}

MATERIA: "${subject}"
NIVEL EDUCATIVO / CURSO: "${grade}"

CONTENIDO BRUTO DE LA CLASE:
---
${rawContent}
---

Genera el material instruccional devolviendo ESTRICTAMENTE este formato JSON:
{
  "titulo": "Título atractivo y claro del tema (máx 80 chars)",
  "resumenBreve": "Un párrafo introductorio motivador adaptado a la edad.",
  "imagenSugerida": "Escribe un prompt EN INGLÉS para generar una ilustración sobre este tema. (Ej: 'Cute cartoon style illustration of the solar system for kids' o 'Realistic 3D render of human heart anatomy')",
  "lector": {
    "introduccion": "Introducción adaptada en longitud y vocabulario al nivel escolar.",
    "desarrollo": "El cuerpo principal de la clase. Ajusta la longitud estrictamente a la edad del alumno.",
    "conclusion": "Párrafo de cierre.",
    "conceptosClave": [
      {"termino":"Término 1","definicion":"Definición adaptada a la edad..."},
      {"termino":"Término 2","definicion":"Definición adaptada a la edad..."}
    ],
    "paraSaber": "Dato curioso."
  },
  "visual": {
    "mapaConceptual": {
      "raiz": "CONCEPTO CENTRAL",
      "ramas": [
        {"titulo":"Subtema 1","color":"#4f8ef7","nodos":["Punto A","Punto B"]},
        {"titulo":"Subtema 2","color":"#34d399","nodos":["Punto A","Punto B"]}
      ]
    },
    "tablaComparativa": {
      "titulo":"Tabla Resumen",
      "columnas":["Concepto", "Características", "Ejemplo"],
      "filas":[
        {"celdas": ["Concepto A", "Descripción A", "Ejemplo A"]},
        {"celdas": ["Concepto B", "Descripción B", "Ejemplo B"]}
      ]
    },
    "pasosProceso": ["Paso 1...", "Paso 2...", "Paso 3..."]
  },
  "auditivo": {
    "narracion": "Guion de podcast educativo. Si es para niños, que suene como un cuentacuentos corto. Si es adolescentes, como un youtuber dinámico. Ajusta la extensión."
  },
  "quiz": {
    "instrucciones": "Mensaje de ánimo.",
    "preguntas": [
      {"id":1,"pregunta":"...","opciones":["Op A","Op B (Correcta)","Op C","Op D"],"correcta":1,"explicacion":"Por qué es correcta, adaptado a la edad."},
      {"id":2,"pregunta":"...","opciones":["Op A","Op B","Op C (Correcta)","Op D"],"correcta":2,"explicacion":"..."}
    ]
  },
  "practica": {
    "introduccion": "Planteamiento de un problema realista adaptado a la edad.",
    "ejercicios": [
      {
        "numero":1,
        "titulo":"Problema a resolver",
        "tipo":"aplicacion",
        "enunciado":"Enunciado adecuado a la edad...",
        "datos":["Dato 1", "Dato 2"],
        "pasos":["Paso 1...", "Paso 2..."],
        "respuesta":"Solución explicada.",
        "pista":"Pista inteligente."
      }
    ]
  },
  "memoria": {
    "instrucciones": "Indicaciones lúdicas para jugar y memorizar los conceptos.",
    "tarjetasFlash": [
      {"anverso": "Concepto o Pregunta corta", "reverso": "Respuesta exacta y fácil de recordar"},
      {"anverso": "Concepto o Pregunta corta", "reverso": "Respuesta exacta y fácil de recordar"},
      {"anverso": "Concepto o Pregunta corta", "reverso": "Respuesta exacta y fácil de recordar"},
      {"anverso": "Concepto o Pregunta corta", "reverso": "Respuesta exacta y fácil de recordar"}
    ],
    "completarOraciones": [
      {"oracion": "El planeta más grande del sistema solar es ___.", "respuesta": "Júpiter"},
      {"oracion": "El proceso mediante el cual las plantas hacen su alimento es la ___.", "respuesta": "fotosíntesis"}
    ]
  }
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8192 },
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

  // Filtro de seguridad para la base de datos (Firebase no acepta arreglos anidados puros)
  if (parsedContent.visual?.tablaComparativa?.filas) {
    parsedContent.visual.tablaComparativa.filas = parsedContent.visual.tablaComparativa.filas.map(fila => {
      return Array.isArray(fila) ? { celdas: fila } : fila;
    });
  }

  return parsedContent;
}

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
          { text: 'Extrae y devuelve TODO el texto de este documento de forma ordenada y limpia. Evita perder información valiosa.' }
        ]
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) throw new Error(`Error extrayendo PDF: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export async function analyzeDropoutRisk(studentData) {
  const prompt = `Eres un psicopedagogo experto. Analiza estos datos y genera un informe de riesgo.
DATOS: ${JSON.stringify(studentData, null, 2)}

Responde ÚNICAMENTE con JSON:
{
  "nivelRiesgo": "alto|medio|bajo",
  "resumen": "Análisis profundo de la situación del alumno.",
  "factores": ["Factor 1", "Factor 2"],
  "recomendaciones": ["Recomendación 1", "Recomendación 2"],
  "mensajeAlumno": "Mensaje humano, empático y motivador (máx 3 oraciones)."
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error('Error analizando riesgo');
  const data = await res.json();
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
}