// src/services/aiService.js — Gemini 2.5 Pro Preview

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

// ── El "Cerebro" Pedagógico de la IA ──────────────────────────────────────────
const SYSTEM = `Eres un experto neuroeducador, pedagogo de alto nivel y diseñador instruccional. 
Tu misión es transformar el contenido bruto de una clase en una experiencia inmersiva, abundante y altamente didáctica, dividida en 6 mundos de aprendizaje.

REGLA DE ORO 1: NIVELACIÓN ACADÉMICA ESTRICTA.
Debes adaptar ABSOLUTAMENTE TODO (vocabulario, profundidad técnica, analogías, complejidad, longitud y tono) al nivel educativo especificado.
- Si es Educación Básica/Primaria: Textos cortos, analogías lúdicas, explicaciones muy paso a paso, tono motivador. Emojis abundantes.
- Si es Educación Media/Secundaria: Pensamiento crítico, ejemplos reales/tecnológicos, lenguaje técnico juvenil.
- Si es Universitario: Rigurosidad académica, análisis complejo, casos de estudio profesionales.

REGLA DE ORO 2: AUTONOMÍA MÓDULAR (SÚPER IMPORTANTE).
Cada uno de los 6 estilos de aprendizaje es un "Mundo de Enseñanza" individual y completo. 
¡CADA SECCIÓN DEBE EXPLICAR EL TEMA ENTERO DESDE CERO! 
- Si un alumno SOLO lee la lectura, aprende todo el tema.
- Si un alumno SOLO escucha el podcast, aprende todo el tema a través de la narración.
- Si un alumno SOLO juega a las tarjetas, debe poder deducir la materia completa.
- No asumas que el alumno leyó un módulo anterior. Haz que cada módulo sea abundante, rico en detalles y 100% autosuficiente usando su propia metodología.

Responde ÚNICAMENTE con JSON válido, sin markdown (\`\`\`) ni texto extra.`;

// ── Genera los estilos de aprendizaje ──────────────────────────────────────
export async function generateLearningStyles(rawContent, subject, grade) {
  
  // 🧠 DETECTOR DE NIVEL AUTOMÁTICO
  const gradeStr = String(grade || '');
  const isSchoolLevel = /b[aá]sico|b[aá]sica|medio|media/i.test(gradeStr);
  const finalGrade = isSchoolLevel 
    ? gradeStr 
    : `${gradeStr} (Nivel Universitario / Educación Superior - Usa lenguaje técnico, riguroso y extenso)`;

  const prompt = `${SYSTEM}

MATERIA: "${subject}"
NIVEL EDUCATIVO / CURSO: "${finalGrade}"

CONTENIDO BRUTO DE LA CLASE:
---
${rawContent}
---

Genera el material instruccional devolviendo ESTRICTAMENTE este formato JSON (asegúrate de que cada sección sea MUY ABUNDANTE e INDEPENDIENTE):
{
  "titulo": "Título atractivo y claro del tema (máx 80 chars)",
  "resumenBreve": "Un párrafo introductorio que contextualice todo el tema y enganche al estudiante.",
  "imagenSugerida": "Escribe un prompt EN INGLÉS para generar una ilustración espectacular sobre este tema. (Ej: 'Cinematic 3D render of the solar system, glowing planets' o 'Cute cartoon illustration of photosynthesis')",
  "lector": {
    "introduccion": "Mundo Lector: Introducción profunda que enseñe las bases del tema desde cero.",
    "desarrollo": "Desarrollo completo y extenso de toda la materia. Explica el 'por qué' y el 'cómo' con total abundancia de detalles.",
    "conclusion": "Párrafo robusto que sintetice los aprendizajes.",
    "conceptosClave": [
      {"termino":"Término 1","definicion":"Definición completa..."},
      {"termino":"Término 2","definicion":"Definición completa..."}
    ],
    "paraSaber": "Un dato curioso o estudio de caso profundo."
  },
  "visual": {
    "mapaConceptual": {
      "raiz": "CONCEPTO CENTRAL",
      "ramas": [
        {"titulo":"Subtema Principal 1","color":"#4f8ef7","nodos":["Dato clave completo A","Dato clave B","Dato clave C"]},
        {"titulo":"Subtema Principal 2","color":"#34d399","nodos":["Dato clave completo A","Dato clave B","Dato clave C"]}
      ]
    },
    "tablaComparativa": {
      "titulo":"Matriz de Conocimiento (Debe abarcar todo el tema)",
      "columnas":["Concepto", "Explicación Detallada", "Ejemplo/Aplicación"],
      "filas":[
        {"celdas": ["Concepto A", "Explicación que permite entender la materia sin leer el texto", "Ejemplo claro"]},
        {"celdas": ["Concepto B", "Explicación completa", "Ejemplo claro"]}
      ]
    },
    "pasosProceso": ["Paso 1: Explicación detallada...", "Paso 2: Explicación detallada..."]
  },
  "auditivo": {
    "narracion": "Mundo Auditivo: Escribe un GUION DE PODCAST EXTENSO Y COMPLETO. Debe explicar TODA LA CLASE desde cero conversando con el alumno. Usa metáforas, haz preguntas al oyente y responde las dudas comunes. Si el alumno solo escucha esto, debe sacar un 100% en la prueba."
  },
  "practica": {
    "introduccion": "Mundo Práctico: Plantea una situación del mundo real. Explica brevemente la teoría necesaria para resolverla aquí mismo.",
    "ejercicios": [
      {
        "numero":1,
        "titulo":"Misión Aplicada",
        "tipo":"aplicacion",
        "enunciado":"Plantea un problema abundante en contexto y datos...",
        "datos":["Dato esencial 1", "Dato esencial 2"],
        "pasos":["Paso 1 guiado...", "Paso 2 explicativo..."],
        "respuesta":"La solución detallada enseñando el por qué.",
        "pista":"Un recordatorio teórico que ayude a resolverlo sin mirar otras pestañas."
      }
    ]
  },
  "quiz": {
    "instrucciones": "Mensaje de desafío final.",
    "preguntas": [
      {"id":1,"pregunta":"Pregunta conceptual profunda...","opciones":["A","B (Correcta)","C","D"],"correcta":1,"explicacion":"Explicación magistral que sirve como repaso de la materia."},
      {"id":2,"pregunta":"Pregunta analítica...","opciones":["A","B","C (Correcta)","D"],"correcta":2,"explicacion":"Explicación formativa completa."}
    ]
  },
  "memoria": {
    "instrucciones": "Mundo Gamificado: Aprende y memoriza TODA la teoría a través de estas tarjetas y desafíos.",
    "tarjetasFlash": [
      {"anverso": "Pregunta clave 1 sobre el tema", "reverso": "Respuesta explicativa completa (no solo una palabra)"},
      {"anverso": "Pregunta clave 2", "reverso": "Respuesta explicativa"},
      {"anverso": "Pregunta clave 3", "reverso": "Respuesta explicativa"},
      {"anverso": "Pregunta clave 4", "reverso": "Respuesta explicativa"}
    ],
    "completarOraciones": [
      {"oracion": "Una parte vital de este proceso es la ___, la cual permite que...", "respuesta": "palabra_clave"},
      {"oracion": "El científico descubrió que el ___ es el responsable de...", "respuesta": "concepto_clave"}
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
        temperature: 0.6, // Subimos un poco para generar más abundancia y creatividad en los mundos
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