// src/services/aiService.js — educ_AI v3.0
// Prompt rediseñado: 6 mundos independientes, contenido real, máxima calidad pedagógica.

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

export async function generateLearningStyles(rawContent, subject, grade) {
  const gradeStr   = String(grade || '');
  const finalGrade = /b[aá]sico|b[aá]sica|medio|media/i.test(gradeStr)
    ? gradeStr : `${gradeStr} (Nivel Universitario Superior)`;

  const prompt = `Eres un neuroeducador de élite. Tu misión es transformar el contenido en 6 experiencias de aprendizaje INDEPENDIENTES, PROFUNDAS e INMERSIVAS para nivel "${finalGrade}" de la materia "${subject}".

CONTENIDO FUENTE:
---
${rawContent}
---

REGLAS ABSOLUTAS:
1. CADA MUNDO debe ser suficiente para aprender el tema COMPLETO sin leer los demás.
2. CERO TEXTO DE RELLENO. Cada campo debe tener contenido educativo REAL, con datos, números y ejemplos concretos.
3. En matemáticas o ciencias: INVENTA problemas con números reales. En historia: FECHAS y CONTEXTO reales.
4. El QUIZ debe tener 6 preguntas de TIPOS VARIADOS (no todas de opción múltiple clásica).
5. Las MISIONES deben ser una narrativa inmersiva donde el alumno es protagonista.
6. La MEMORIA debe ser interactiva con al menos 4 flashcards, 4 pares para conectar, y 3 oraciones para completar.

Responde ÚNICAMENTE con JSON válido con esta estructura exacta:

{
  "titulo": "Título épico del tema (máx 70 chars)",
  "resumenBreve": "Párrafo gancho de 2-3 oraciones que despierta curiosidad.",
  "imagenSugerida": "Prompt cinematográfico en inglés para generar imagen IA",

  "lector": {
    "introduccion": "Párrafo narrativo de 4-6 oraciones que contextualiza el tema con una anécdota, dato impactante o paradoja.",
    "desarrollo": "EL CUERPO PRINCIPAL. Mínimo 5 párrafos separados por doble salto de línea (\\n\\n). Cada párrafo debe tener 4-6 oraciones. Explicar causas, mecanismos, consecuencias, ejemplos reales con cifras.",
    "conclusion": "Párrafo de cierre que conecta el tema con la vida del alumno.",
    "conceptosClave": [
      {"termino": "Término exacto del contenido", "definicion": "Definición técnica real de 2-3 oraciones con ejemplo."},
      {"termino": "Término 2", "definicion": "Definición 2."},
      {"termino": "Término 3", "definicion": "Definición 3."},
      {"termino": "Término 4", "definicion": "Definición 4."}
    ],
    "paraSaber": "Un dato sorprendente, récord mundial, paradoja o conexión inesperada relacionada al tema.",
    "palabrasClave": [
      {"palabra": "Término técnico importante", "categoria": "concepto|proceso|persona|fecha|ley|formula"},
      {"palabra": "Otro término", "categoria": "concepto"}
    ],
    "temasRelacionados": [
      {"tema": "Nombre de tema relacionado de la misma materia", "conexion": "Cómo se conecta con este tema en una oración."},
      {"tema": "Otro tema relacionado", "conexion": "Conexión."}
    ]
  },

  "visual": {
    "mapaConceptual": {
      "raiz": "CONCEPTO CENTRAL EXACTO DEL TEMA",
      "ramas": [
        {"titulo": "Subtema 1 (Ej: Causas / Etapas)", "color": "#00ff7f", "nodos": ["Dato real específico", "Dato real específico 2", "Dato real específico 3"]},
        {"titulo": "Subtema 2", "color": "#18dcff", "nodos": ["Dato real 1", "Dato real 2", "Dato real 3"]},
        {"titulo": "Subtema 3", "color": "#ff9f43", "nodos": ["Dato real 1", "Dato real 2"]},
        {"titulo": "Subtema 4", "color": "#ff6b9d", "nodos": ["Dato real 1", "Dato real 2"]}
      ]
    },
    "tablaComparativa": {
      "titulo": "Título de la comparación (Ej: Antes vs Después / Ventajas vs Desventajas)",
      "columnas": ["Columna A", "Columna B", "Columna C"],
      "filas": [
        ["Dato real fila1-A", "Dato real fila1-B", "Dato real fila1-C"],
        ["Dato real fila2-A", "Dato real fila2-B", "Dato real fila2-C"],
        ["Dato real fila3-A", "Dato real fila3-B", "Dato real fila3-C"]
      ]
    },
    "lineaTiempo": [
      {"año": "Fecha o período específico", "evento": "Descripción del hito real en 1 oración."},
      {"año": "Fecha 2", "evento": "Hito real 2."},
      {"año": "Fecha 3", "evento": "Hito real 3."},
      {"año": "Fecha 4", "evento": "Hito real 4."}
    ]
  },

  "auditivo": {
    "narracion": "GUION DE PODCAST COMPLETO. Mínimo 8 párrafos separados por \\n\\n. Debe sonar como un conductor de radio hablando con un amigo. Usa: metáforas cotidianas, '¿sabías que...?', '¡Esto es increíble!', comparaciones con situaciones de la vida real. Empieza con una historia o escena que enganche en las primeras 2 oraciones. Cubre el 100% del contenido teórico del tema sin que el alumno necesite leer nada más."
  },

  "quiz": {
    "instrucciones": "Mensaje motivador y creativo para arrancar el quiz (no genérico).",
    "preguntas": [
      {
        "id": 1,
        "tipo": "escenario",
        "contexto": "Descripción de una situación real o hipotética relacionada al tema (2-3 oraciones).",
        "pregunta": "Pregunta que se desprende del escenario anterior.",
        "opciones": ["Opción A plausible", "Opción B correcta", "Opción C plausible", "Opción D plausible"],
        "correcta": 1,
        "explicacion": "Explicación detallada de por qué B es correcta y por qué las demás no.",
        "dificultad": "media"
      },
      {
        "id": 2,
        "tipo": "analogia",
        "contexto": "",
        "pregunta": "Pregunta que usa una analogía: 'Si X es como Y, entonces Z es como...'",
        "opciones": ["Analogía A", "Analogía B correcta", "Analogía C", "Analogía D"],
        "correcta": 1,
        "explicacion": "Por qué la analogía correcta captura la esencia del concepto.",
        "dificultad": "dificil"
      },
      {
        "id": 3,
        "tipo": "concepto",
        "contexto": "",
        "pregunta": "¿Cuál de las siguientes definiciones describe mejor [término del tema]?",
        "opciones": ["Definición incorrecta A", "Definición correcta B", "Definición parcial C", "Definición incorrecta D"],
        "correcta": 1,
        "explicacion": "Explicación técnica precisa.",
        "dificultad": "facil"
      },
      {
        "id": 4,
        "tipo": "aplicacion",
        "contexto": "Situación aplicada con datos concretos (números, fechas, nombres reales).",
        "pregunta": "¿Qué resultado o conclusión se obtiene en este caso?",
        "opciones": ["Resultado A", "Resultado B", "Resultado C correcto", "Resultado D"],
        "correcta": 2,
        "explicacion": "Proceso de razonamiento paso a paso para llegar a la respuesta.",
        "dificultad": "dificil"
      },
      {
        "id": 5,
        "tipo": "causa_efecto",
        "contexto": "",
        "pregunta": "¿Cuál es la consecuencia DIRECTA de [fenómeno del tema]?",
        "opciones": ["Consecuencia incorrecta", "Consecuencia incorrecta", "Consecuencia directa correcta", "Consecuencia indirecta confusa"],
        "correcta": 2,
        "explicacion": "La cadena causal que lleva a esta consecuencia.",
        "dificultad": "media"
      },
      {
        "id": 6,
        "tipo": "critico",
        "contexto": "Afirmación que parece correcta pero tiene un error conceptual sutil.",
        "pregunta": "¿Qué error conceptual contiene la afirmación anterior?",
        "opciones": ["Identificación del error correcta", "Error mal identificado B", "No hay error C (trampa)", "Error inventado D"],
        "correcta": 0,
        "explicacion": "Por qué esa afirmación es parcialmente incorrecta y cuál sería la formulación correcta.",
        "dificultad": "dificil"
      }
    ]
  },

  "practica": {
    "introduccion": "Bienvenida narrativa al Centro de Misiones. El alumno es el protagonista. 2-3 oraciones que crean expectativa.",
    "misiones": [
      {
        "numero": 1,
        "dificultad": "Iniciación",
        "xp": 100,
        "badge": "🥉",
        "titulo": "Nombre creativo e inmersivo de la misión",
        "narrativa": "Historia inmersiva de 3-4 oraciones que da contexto. El alumno tiene un ROL (explorador, científico, detective, etc.) y una MISIÓN específica que resolver.",
        "enunciado": "El problema o tarea COMPLETA con todos los datos necesarios. Si es matemático: incluye todos los números. Si es redacción: incluye el contexto completo. Mínimo 3-4 oraciones.",
        "datos": ["Dato clave 1 con valor específico", "Dato clave 2", "Dato clave 3"],
        "proceso": [
          {"paso": 1, "instruccion": "Primera acción concreta a realizar.", "pista": "Orientación de cómo hacerlo."},
          {"paso": 2, "instruccion": "Segunda acción.", "pista": "Pista para este paso."},
          {"paso": 3, "instruccion": "Tercera acción.", "pista": "Pista para este paso."}
        ],
        "solucion": "Respuesta COMPLETA desarrollada paso a paso. Si es matemático: muestra todas las operaciones. Si es analítico: muestra el razonamiento completo. Mínimo 4-5 oraciones.",
        "reflexion": "¿Qué habilidad o conocimiento acabas de aplicar? Conexión con la vida real en 1-2 oraciones."
      },
      {
        "numero": 2,
        "dificultad": "Explorador",
        "xp": 200,
        "badge": "🥈",
        "titulo": "Nombre de misión avanzada",
        "narrativa": "Historia narrativa con rol diferente al de la misión 1.",
        "enunciado": "Problema más complejo con múltiples variables o pasos.",
        "datos": ["Dato 1", "Dato 2", "Dato 3"],
        "proceso": [
          {"paso": 1, "instruccion": "Primer paso.", "pista": "Pista 1."},
          {"paso": 2, "instruccion": "Segundo paso.", "pista": "Pista 2."},
          {"paso": 3, "instruccion": "Tercer paso.", "pista": "Pista 3."},
          {"paso": 4, "instruccion": "Cuarto paso.", "pista": "Pista 4."}
        ],
        "solucion": "Solución completa y detallada.",
        "reflexion": "Reflexión sobre el aprendizaje."
      },
      {
        "numero": 3,
        "dificultad": "Experto",
        "xp": 350,
        "badge": "🥇",
        "titulo": "Nombre de misión desafiante",
        "narrativa": "Escenario complejo que integra múltiples conceptos del tema.",
        "enunciado": "Problema desafiante que requiere síntesis de todo lo aprendido.",
        "datos": ["Dato 1", "Dato 2", "Dato 3", "Dato 4"],
        "proceso": [
          {"paso": 1, "instruccion": "Paso 1.", "pista": "Pista 1."},
          {"paso": 2, "instruccion": "Paso 2.", "pista": "Pista 2."},
          {"paso": 3, "instruccion": "Paso 3.", "pista": "Pista 3."},
          {"paso": 4, "instruccion": "Paso 4.", "pista": "Pista 4."},
          {"paso": 5, "instruccion": "Paso 5 de síntesis.", "pista": "Pista final."}
        ],
        "solucion": "Solución magistral con toda la argumentación.",
        "reflexion": "Reflexión profunda que conecta con otros temas."
      }
    ]
  },

  "memoria": {
    "flashCards": [
      {"frente": "Pregunta técnica o término", "reverso": "Respuesta completa y precisa. Incluye dato extra que ayuda a memorizar.", "emoji": "🔬"},
      {"frente": "Otro concepto", "reverso": "Respuesta 2.", "emoji": "📊"},
      {"frente": "Pregunta 3", "reverso": "Respuesta 3.", "emoji": "💡"},
      {"frente": "Pregunta 4", "reverso": "Respuesta 4.", "emoji": "⚗️"},
      {"frente": "Pregunta 5", "reverso": "Respuesta 5.", "emoji": "🌍"},
      {"frente": "Pregunta 6", "reverso": "Respuesta 6.", "emoji": "🔑"}
    ],
    "parejas": [
      {"izquierda": "Término exacto del contenido", "derecha": "Su definición corta o par correcto"},
      {"izquierda": "Término 2", "derecha": "Definición 2"},
      {"izquierda": "Término 3", "derecha": "Definición 3"},
      {"izquierda": "Término 4", "derecha": "Definición 4"},
      {"izquierda": "Término 5", "derecha": "Definición 5"},
      {"izquierda": "Término 6", "derecha": "Definición 6"}
    ],
    "completar": [
      {"oracion": "El [hueco] es el proceso por el cual... permite...", "respuesta": "término exacto", "opciones": ["término exacto", "distractor1", "distractor2", "distractor3"]},
      {"oracion": "En [fecha/lugar], [personaje/fenómeno] logró [hueco]...", "respuesta": "resultado exacto", "opciones": ["resultado exacto", "distractor1", "distractor2", "distractor3"]},
      {"oracion": "La fórmula/ley de [hueco] establece que...", "respuesta": "nombre correcto", "opciones": ["nombre correcto", "distractor1", "distractor2", "distractor3"]}
    ]
  }
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role:'user', parts:[{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.75,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    console.error('Gemini error:', err);
    throw new Error(`Gemini error ${res.status}: ${err?.error?.message||''}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió contenido');
  return JSON.parse(text);
}

// ── Extrae texto de PDF/Imagen usando Gemini Vision ──────────────────────────
export async function extractTextFromPDF(file) {
  const base64   = await fileToBase64(file);
  const mimeType = file.type || 'application/pdf';

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: 'Extrae TODO el texto de este documento. Mantén la estructura original. No resumas. Devuelve solo el texto puro.' },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(`Error extrayendo archivo: ${err?.error?.message || res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no pudo leer el archivo');
  return text;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// ── Análisis de riesgo de deserción ─────────────────────────────────────────
export async function analyzeDropoutRisk(studentData) {
  const prompt = `Eres un psicopedagogo experto en analítica educativa chilena. Analiza los datos de este estudiante y genera un informe diagnóstico profesional y accionable.

DATOS DEL ESTUDIANTE:
${JSON.stringify(studentData, null, 2)}

Responde ÚNICAMENTE con JSON válido:
{
  "nivelRiesgo": "alto | medio | bajo",
  "scoreExplicado": "Explica en 1 oración por qué tiene ese nivel de riesgo basándote en los datos específicos.",
  "resumen": "Diagnóstico en 3-4 oraciones. Menciona los datos concretos (días, porcentajes, sesiones). Tono profesional, empático.",
  "factores": [
    "Factor de riesgo específico con dato numérico (Ej: 18 días sin actividad)",
    "Factor 2 con dato",
    "Factor 3 si aplica"
  ],
  "fortalezas": [
    "Aspecto positivo del alumno si hay alguno",
    "Fortaleza 2 si aplica"
  ],
  "recomendaciones": [
    "Acción concreta para el PROFESOR (Ej: Enviar mensaje personalizado esta semana)",
    "Acción concreta 2 (Ej: Revisar si el alumno tiene dificultades técnicas de acceso)",
    "Acción concreta 3 con timeline específico"
  ],
  "mensajeAlumno": "Mensaje directo, motivador y personalizado para enviar AL ALUMNO. Máx 2 oraciones. Tono cálido, sin mencionar que está 'en riesgo'.",
  "urgencia": "inmediata | esta_semana | monitorear"
}`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role:'user', parts:[{ text: prompt }] }],
      generationConfig: { responseMimeType:'application/json', temperature:0.3, maxOutputTokens:1024 },
    }),
  });

  if (!res.ok) throw new Error('Error analizando riesgo del estudiante');
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}