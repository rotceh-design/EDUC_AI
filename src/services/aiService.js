// src/services/aiService.js — educ_AI v4.0 CYBERPUNK NEUROEDUCATIVO
// Prompt rediseñado para soportar: Dudas interactivas, Warm-up Quiz, RPG Terminal, Constelación visual

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

// 🛡️ ESCUDO ANTI-CRASHES PARA FIREBASE
// Firestore prohíbe guardar arrays anidados (ej: [ ["a","b"], ["c","d"] ]). 
// Esta función los detecta y los convierte a objetos ({0:"a", 1:"b"}) antes de guardar.
function sanitizeForFirestore(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (Array.isArray(item)) {
        const convertedObj = {};
        item.forEach((val, i) => { convertedObj[i] = sanitizeForFirestore(val); });
        return convertedObj;
      }
      return sanitizeForFirestore(item);
    });
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = sanitizeForFirestore(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export async function generateLearningStyles(rawContent, subject, grade) {
  const gradeStr   = String(grade || '');
  const finalGrade = /b[aá]sico|b[aá]sica|medio|media/i.test(gradeStr)
    ? gradeStr : `${gradeStr} (Nivel Universitario Superior)`;

  const prompt = `Eres un neuroeducador de élite y diseñador de experiencias gamificadas. Transforma el contenido en 6 MUNDOS DE APRENDIZAJE para nivel "${finalGrade}", materia "${subject}".

CONTENIDO FUENTE:
---
${rawContent}
---

LEYES ABSOLUTAS:
1. CADA MUNDO debe bastar para aprender el tema COMPLETO de forma independiente.
2. CERO texto de relleno. Todo contenido debe ser REAL, con datos, fechas, números concretos.
3. Adapta el vocabulario al nivel indicado. Para básica: lenguaje simple y cercano. Para media/universitario: técnico pero accesible.
4. Genera el JSON completo sin cortar. Todos los arrays deben tener al menos los elementos indicados.

Responde ÚNICAMENTE con JSON válido:

{
  "titulo": "Título épico del tema (máx 70 chars)",
  "resumenBreve": "Párrafo gancho de 2-3 oraciones que despierta curiosidad.",

  "lector": {
    "introduccion": "Párrafo narrativo de 4-6 oraciones con anécdota o dato impactante.",
    "parrafos": [
      {
        "texto": "Párrafo de desarrollo completo, 4-6 oraciones. Contenido educativo real.",
        "duda": {
          "pregunta": "¿Por qué pasa esto? / ¿Cómo funciona exactamente? (pregunta que un alumno curioso haría)",
          "respuesta": "Explicación amigable, directa y didáctica de 3-4 oraciones. Usa analogías cotidianas."
        }
      },
      {
        "texto": "Segundo párrafo de desarrollo con datos concretos y ejemplos reales.",
        "duda": {
          "pregunta": "Otra pregunta curiosa diferente sobre este párrafo.",
          "respuesta": "Respuesta amigable que conecta con la vida del alumno."
        }
      },
      {
        "texto": "Tercer párrafo que profundiza en consecuencias o aplicaciones.",
        "duda": {
          "pregunta": "¿Y esto para qué sirve en la vida real?",
          "respuesta": "Aplicación concreta y cercana al alumno."
        }
      }
    ],
    "conclusion": "Párrafo de cierre que conecta el tema con la vida del alumno.",
    "conceptosClave": [
      {"termino": "Término exacto", "definicion": "Definición técnica real de 2-3 oraciones con ejemplo."},
      {"termino": "Término 2", "definicion": "Definición 2."},
      {"termino": "Término 3", "definicion": "Definición 3."},
      {"termino": "Término 4", "definicion": "Definición 4."}
    ],
    "paraSaber": "Dato sorprendente, récord o conexión inesperada relacionada al tema.",
    "palabrasClave": [
      {"palabra": "Término técnico", "categoria": "concepto"},
      {"palabra": "Otro término", "categoria": "proceso"},
      {"palabra": "Otro", "categoria": "persona"},
      {"palabra": "Otro", "categoria": "fecha"}
    ]
  },

  "visual": {
    "mapaConceptual": {
      "raiz": "CONCEPTO CENTRAL EXACTO DEL TEMA",
      "ramas": [
        {"titulo": "Subtema 1 (ej: Causas)", "color": "#00ff7f", "nodos": ["Dato específico real 1", "Dato específico real 2", "Dato específico real 3"]},
        {"titulo": "Subtema 2 (ej: Consecuencias)", "color": "#18dcff", "nodos": ["Dato real 1", "Dato real 2", "Dato real 3"]},
        {"titulo": "Subtema 3 (ej: Características)", "color": "#ff9f43", "nodos": ["Dato real 1", "Dato real 2", "Dato real 3"]},
        {"titulo": "Subtema 4 (ej: Ejemplos)", "color": "#ff6b9d", "nodos": ["Dato real 1", "Dato real 2"]}
      ]
    },
    "tablaComparativa": {
      "titulo": "Título descriptivo de la comparación",
      "columnas": ["Columna A", "Columna B", "Columna C"],
      "filas": [
        ["Dato real A1", "Dato real B1", "Dato real C1"],
        ["Dato real A2", "Dato real B2", "Dato real C2"],
        ["Dato real A3", "Dato real B3", "Dato real C3"]
      ]
    },
    "lineaTiempo": [
      {"año": "Fecha o período específico", "evento": "Descripción del hito real."},
      {"año": "Fecha 2", "evento": "Hito 2."},
      {"año": "Fecha 3", "evento": "Hito 3."},
      {"año": "Fecha 4", "evento": "Hito 4."}
    ]
  },

  "auditivo": {
    "narracion": "GUION DE PODCAST COMPLETO. Mínimo 8 párrafos separados por doble salto (\\n\\n). Tono de conductor de radio hablando con un amigo. Usa '¿sabías que...?', metáforas cotidianas, '¡Esto es increíble!'. Cubre el 100% del contenido teórico."
  },

  "quiz": {
    "warmup": {
      "titulo": "Título creativo del calentamiento (ej: '¿Listo para el desafío?')",
      "acertijo": "Un acertijo, dato curioso divertido o pregunta de reflexión que prepare la mente del alumno para el tema. Debe ser intrigante y relacionado con el contenido pero sin ser una pregunta de prueba. 2-3 oraciones.",
      "datoFun": "Un dato asombroso o estadística sorprendente del tema que genere curiosidad. Ej: 'Sabías que...' 1-2 oraciones.",
      "desafio": "Mensaje motivador que invite al alumno a demostrar sus conocimientos. 1 oración."
    },
    "instrucciones": "Mensaje motivador y creativo para arrancar el quiz.",
    "preguntas": [
      {
        "id": 1, "tipo": "escenario",
        "contexto": "Descripción de una situación real o hipotética (2-3 oraciones).",
        "pregunta": "Pregunta que se desprende del escenario.",
        "opciones": ["Opción A plausible", "Opción B correcta", "Opción C plausible", "Opción D trampa"],
        "correcta": 1,
        "explicacion": "Explicación detallada de por qué es correcta y por qué las demás no.",
        "pista": "Consejo para descartar alternativas sin revelar la respuesta.",
        "mensajeMotivador": "Mensaje alentador específico para cuando el alumno falle esta pregunta. Ej: '¡Casi! El secreto está en...'",
        "dificultad": "facil"
      },
      {
        "id": 2, "tipo": "analogia",
        "contexto": "",
        "pregunta": "Si X es como Y, entonces Z es como...",
        "opciones": ["Analogía A", "Analogía correcta B", "Analogía C", "Analogía D"],
        "correcta": 1,
        "explicacion": "Por qué la analogía correcta captura la esencia del concepto.",
        "pista": "Pista para razonar la analogía.",
        "mensajeMotivador": "Mensaje motivador para fallo en pregunta 2.",
        "dificultad": "media"
      },
      {
        "id": 3, "tipo": "concepto",
        "contexto": "",
        "pregunta": "¿Cuál de las siguientes definiciones describe mejor [término del tema]?",
        "opciones": ["Definición incorrecta", "Definición parcial", "Definición correcta", "Definición confusa"],
        "correcta": 2,
        "explicacion": "Explicación técnica precisa.",
        "pista": "Clave para identificar la definición correcta.",
        "mensajeMotivador": "Mensaje motivador específico.",
        "dificultad": "facil"
      },
      {
        "id": 4, "tipo": "aplicacion",
        "contexto": "Situación aplicada con datos concretos (números, fechas, nombres reales).",
        "pregunta": "¿Qué resultado se obtiene en este caso?",
        "opciones": ["Resultado A", "Resultado B", "Resultado C correcto", "Resultado D"],
        "correcta": 2,
        "explicacion": "Proceso de razonamiento paso a paso.",
        "pista": "Por dónde empezar a razonar.",
        "mensajeMotivador": "Mensaje motivador para fallo aplicación.",
        "dificultad": "dificil"
      },
      {
        "id": 5, "tipo": "causa_efecto",
        "contexto": "",
        "pregunta": "¿Cuál es la consecuencia DIRECTA de [fenómeno del tema]?",
        "opciones": ["Consecuencia incorrecta", "Consecuencia directa correcta", "Consecuencia indirecta", "No hay relación"],
        "correcta": 1,
        "explicacion": "La cadena causal explicada.",
        "pista": "Piensa en qué pasa INMEDIATAMENTE después.",
        "mensajeMotivador": "Mensaje motivador específico.",
        "dificultad": "media"
      },
      {
        "id": 6, "tipo": "critico",
        "contexto": "Afirmación que parece correcta pero tiene un error conceptual sutil.",
        "pregunta": "¿Qué error conceptual contiene la afirmación anterior?",
        "opciones": ["Identificación correcta del error", "Error mal identificado", "No hay error (trampa)", "Error inventado"],
        "correcta": 0,
        "explicacion": "Por qué la afirmación es incorrecta y cuál sería la correcta.",
        "pista": "Lee la afirmación muy despacio, palabra por palabra.",
        "mensajeMotivador": "Mensaje motivador para pensamiento crítico.",
        "dificultad": "dificil"
      }
    ]
  },

  "practica": {
    "introduccion": "Bienvenida narrativa al Centro de Operaciones. El alumno es el protagonista. 2-3 oraciones con expectativa.",
    "misiones": [
      {
        "numero": 1, "dificultad": "Iniciación", "xp": 100, "badge": "🥉",
        "titulo": "Nombre táctico de la misión (ej: Operación Alba)",
        "transmision": [
          "Línea 1 de la transmisión cifrada que introduce la narrativa. El alumno tiene un ROL específico (explorador, científico, detective, agente).",
          "Línea 2 que da contexto del problema. Más atmósfera y detalle.",
          "Línea 3 que revela el OBJETIVO TÁCTICO: qué debe resolver exactamente el alumno."
        ],
        "objetivo": "El problema o tarea COMPLETA con TODOS los datos necesarios. Si es matemático: incluye todos los números. Mínimo 3-4 oraciones.",
        "datos": ["Dato clave 1 con valor específico", "Dato clave 2", "Dato clave 3"],
        "proceso": [
          {"paso": 1, "instruccion": "Primera acción concreta.", "pista": "Orientación táctica de cómo hacerlo."},
          {"paso": 2, "instruccion": "Segunda acción.", "pista": "Pista para este paso."},
          {"paso": 3, "instruccion": "Tercera acción de cierre.", "pista": "Pista final."}
        ],
        "solucion": "Respuesta COMPLETA paso a paso. Si es matemático: muestra todas las operaciones. Mínimo 4-5 oraciones.",
        "reflexion": "¿Qué habilidad aplicaste? Conexión con la vida real en 1-2 oraciones."
      },
      {
        "numero": 2, "dificultad": "Explorador", "xp": 200, "badge": "🥈",
        "titulo": "Nombre de misión avanzada",
        "transmision": [
          "Línea 1: narrativa diferente a misión 1.",
          "Línea 2: contexto más complejo.",
          "Línea 3: objetivo más desafiante."
        ],
        "objetivo": "Problema más complejo con múltiples variables.",
        "datos": ["Dato 1", "Dato 2", "Dato 3", "Dato 4"],
        "proceso": [
          {"paso": 1, "instruccion": "Paso 1.", "pista": "Pista 1."},
          {"paso": 2, "instruccion": "Paso 2.", "pista": "Pista 2."},
          {"paso": 3, "instruccion": "Paso 3.", "pista": "Pista 3."},
          {"paso": 4, "instruccion": "Paso 4.", "pista": "Pista 4."}
        ],
        "solucion": "Solución completa y detallada.",
        "reflexion": "Reflexión sobre el aprendizaje."
      },
      {
        "numero": 3, "dificultad": "Experto", "xp": 350, "badge": "🥇",
        "titulo": "Nombre de misión desafiante",
        "transmision": [
          "Línea 1: escenario que integra múltiples conceptos.",
          "Línea 2: complejidad máxima.",
          "Línea 3: el objetivo final."
        ],
        "objetivo": "Problema desafiante que requiere síntesis de todo lo aprendido.",
        "datos": ["Dato 1", "Dato 2", "Dato 3", "Dato 4", "Dato 5"],
        "proceso": [
          {"paso": 1, "instruccion": "Paso 1.", "pista": "Pista 1."},
          {"paso": 2, "instruccion": "Paso 2.", "pista": "Pista 2."},
          {"paso": 3, "instruccion": "Paso 3.", "pista": "Pista 3."},
          {"paso": 4, "instruccion": "Paso 4.", "pista": "Pista 4."},
          {"paso": 5, "instruccion": "Síntesis final.", "pista": "Pista final."}
        ],
        "solucion": "Solución magistral con toda la argumentación.",
        "reflexion": "Reflexión que conecta con otros temas."
      }
    ]
  },

  "memoria": {
    "flashCards": [
      {"frente": "Pregunta técnica", "reverso": "Respuesta completa con dato extra.", "emoji": "🔬"},
      {"frente": "Concepto 2", "reverso": "Respuesta 2.", "emoji": "📊"},
      {"frente": "Pregunta 3", "reverso": "Respuesta 3.", "emoji": "💡"},
      {"frente": "Pregunta 4", "reverso": "Respuesta 4.", "emoji": "⚗️"},
      {"frente": "Pregunta 5", "reverso": "Respuesta 5.", "emoji": "🌍"},
      {"frente": "Pregunta 6", "reverso": "Respuesta 6.", "emoji": "🔑"}
    ],
    "parejas": [
      {"izquierda": "Término exacto", "derecha": "Definición corta o par correcto"},
      {"izquierda": "Término 2", "derecha": "Par 2"},
      {"izquierda": "Término 3", "derecha": "Par 3"},
      {"izquierda": "Término 4", "derecha": "Par 4"},
      {"izquierda": "Término 5", "derecha": "Par 5"},
      {"izquierda": "Término 6", "derecha": "Par 6"}
    ],
    "completar": [
      {"oracion": "El [hueco] es el proceso que permite...", "respuesta": "término exacto", "opciones": ["término exacto", "distractor1", "distractor2", "distractor3"]},
      {"oracion": "En [hueco], el fenómeno se produce cuando...", "respuesta": "contexto correcto", "opciones": ["contexto correcto", "distractor1", "distractor2", "distractor3"]},
      {"oracion": "La principal característica de [hueco] es...", "respuesta": "nombre correcto", "opciones": ["nombre correcto", "distractor1", "distractor2", "distractor3"]}
    ]
  }
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role:'user', parts:[{ text: prompt }] }],
      generationConfig: { responseMimeType:'application/json', temperature:0.75, maxOutputTokens:8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(`Gemini error ${res.status}: ${err?.error?.message||''}`);
  }
  const data = await res.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió contenido');
  
  // Limpiamos la respuesta en caso de que Gemini devuelva markdown (ej: ```json)
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  const parsedJson = JSON.parse(text);
  
  // 🔥 PASAMOS EL JSON POR EL ESCUDO ANTES DE GUARDARLO
  return sanitizeForFirestore(parsedJson);
}

// ── Extrae texto de PDF/Imagen con Gemini Vision ─────────────────────────────
export async function extractTextFromPDF(file) {
  const base64   = await fileToBase64(file);
  const mimeType = file.type || 'application/pdf';
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role:'user', parts:[
        { inline_data: { mime_type:mimeType, data:base64 } },
        { text: 'Extrae TODO el texto de este documento. Mantén la estructura. No resumas.' },
      ]}],
      generationConfig: { temperature:0, maxOutputTokens:8192 },
    }),
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(`Error extrayendo: ${e?.error?.message||res.status}`); }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no pudo leer el archivo');
  return text;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = () => reject(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });
}

// ── Análisis de riesgo con Gemini ────────────────────────────────────────────
export async function analyzeDropoutRisk(studentData) {
  const prompt = `Eres un psicopedagogo experto en analítica educativa chilena. Analiza los datos de este estudiante.

DATOS: ${JSON.stringify(studentData, null, 2)}

Responde ÚNICAMENTE con JSON:
{
  "nivelRiesgo": "alto | medio | bajo",
  "resumen": "Diagnóstico 3-4 oraciones con datos concretos. Tono profesional y empático.",
  "factores": ["Factor con dato numérico", "Factor 2", "Factor 3"],
  "fortalezas": ["Aspecto positivo si hay alguno"],
  "recomendaciones": ["Acción concreta para el profesor", "Acción 2", "Acción 3"],
  "mensajeAlumno": "Mensaje motivador personalizado para enviar al alumno. Máx 2 oraciones. Tono cálido.",
  "urgencia": "inmediata | esta_semana | monitorear"
}`;

  const res = await fetch(URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents:[{ role:'user', parts:[{ text:prompt }] }], generationConfig:{ responseMimeType:'application/json', temperature:0.3, maxOutputTokens:1024 } }),
  });
  if (!res.ok) throw new Error('Error analizando riesgo');
  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}