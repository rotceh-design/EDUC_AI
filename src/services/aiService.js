// src/services/aiService.js

// API Key (Asegúrate de cambiarla o usar import.meta.env en producción)
const KEY = 'AIzaSyCFd52drFaMIyd7HeefDy8dgnm42DBbmr0'; 

// Usando exactamente la ruta que te dio la consola de Google
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

const SYSTEM = `Eres un experto pedagogo y diseñador instruccional para educación K-12 y universitaria en Latinoamérica.
Transforma contenido de clases en material de estudio personalizado para 5 estilos de aprendizaje.
Reglas:
- Basa todo EXACTAMENTE en el contenido proporcionado
- Vocabulario apropiado para el nivel indicado
- Tono motivador, claro y accesible
- Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra`;

// ── Genera los 5 estilos de aprendizaje ──────────────────────────────────────
export async function generateLearningStyles(rawContent, subject, grade) {
  const prompt = `${SYSTEM}

Analiza esta clase de "${subject}" (${grade}) y genera material en 5 estilos de aprendizaje.

CONTENIDO:
---
${rawContent}
---

JSON con estructura exacta:
{
  "titulo": "Título del tema (máx 60 chars)",
  "resumenBreve": "Una oración resumen",
  "lector": {
    "introduccion": "3-4 oraciones contextualizando",
    "desarrollo": "3-4 párrafos explicativos claros",
    "conclusion": "Párrafo de cierre",
    "conceptosClave": [{"termino":"...","definicion":"..."},{"termino":"...","definicion":"..."},{"termino":"...","definicion":"..."}],
    "paraSaber": "Dato curioso o aplicación práctica"
  },
  "visual": {
    "mapaConceptual": {
      "raiz": "TEMA CENTRAL",
      "ramas": [
        {"titulo":"Rama 1","color":"#4f8ef7","nodos":["a","b","c"]},
        {"titulo":"Rama 2","color":"#34d399","nodos":["a","b","c"]},
        {"titulo":"Rama 3","color":"#fbbf24","nodos":["a","b"]}
      ]
    },
"tablaComparativa": {
      "titulo":"Tabla resumen",
      "columnas":["Concepto","Descripción","Ejemplo"],
      "filas":[
        {"celdas": ["c1","d1","e1"]}, 
        {"celdas": ["c2","d2","e2"]}, 
        {"celdas": ["c3","d3","e3"]}
      ]
    },
    "pasosProceso": ["paso1","paso2","paso3","paso4"]
  },
  "auditivo": {
    "narracion": "5-6 párrafos conversacionales con 'fíjate que...', 'imagínate que...', 'recuerda que...'"
  },
  "quiz": {
    "instrucciones": "Mensaje motivador",
    "preguntas": [
      {"id":1,"pregunta":"...","opciones":["a)...","b)...","c)...","d)..."],"correcta":0,"explicacion":"..."},
      {"id":2,"pregunta":"...","opciones":["a)...","b)...","c)...","d)..."],"correcta":1,"explicacion":"..."},
      {"id":3,"pregunta":"...","opciones":["a)...","b)...","c)...","d)..."],"correcta":2,"explicacion":"..."},
      {"id":4,"pregunta":"...","opciones":["a)...","b)...","c)...","d)..."],"correcta":3,"explicacion":"..."},
      {"id":5,"pregunta":"...","opciones":["a)...","b)...","c)...","d)..."],"correcta":0,"explicacion":"..."}
    ]
  },
  "practica": {
    "introduccion": "Descripción breve",
    "ejercicios": [
      {"numero":1,"titulo":"...","tipo":"reflexion","enunciado":"...","datos":["..."],"pasos":["...","...","..."],"respuesta":"...","pista":"..."},
      {"numero":2,"titulo":"...","tipo":"aplicacion","enunciado":"...","datos":["..."],"pasos":["...","...","..."],"respuesta":"...","pista":"..."},
      {"numero":3,"titulo":"...","tipo":"analisis","enunciado":"...","datos":["...","..."],"pasos":["...","...","...","..."],"respuesta":"...","pista":"..."}
    ]
  }
}`;

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
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
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en generateLearningStyles:", error);
    throw error;
  }
}

// ── Extrae texto de PDF ───────────────────────────────────────────────────────
export async function extractTextFromPDF(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: buf }).promise;
  const texts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map(item => item.str).join(' '));
  }
  return texts.join('\n');
}

// ── Análisis de riesgo de deserción con Gemini ────────────────────────────────
export async function analyzeDropoutRisk(studentData) {
  const prompt = `Eres un experto en analítica educativa y prevención de deserción escolar.
Analiza estos datos de un estudiante y genera un informe de riesgo breve y accionable para el profesor.

DATOS DEL ESTUDIANTE:
${JSON.stringify(studentData, null, 2)}

Responde ÚNICAMENTE con JSON:
{
  "nivelRiesgo": "alto|medio|bajo",
  "resumen": "2-3 oraciones explicando la situación del alumno",
  "factores": ["factor de riesgo 1", "factor de riesgo 2"],
  "recomendaciones": ["acción concreta 1 para el profesor", "acción concreta 2", "acción concreta 3"],
  "mensajeAlumno": "Mensaje motivador corto para enviar al alumno (máx 2 oraciones)"
}`;

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: 'application/json', 
          temperature: 0.3, 
          maxOutputTokens: 1024 
        },
      }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini error ${res.status}`);
    }
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if(!text) throw new Error('No se recibió texto de Gemini');
    return JSON.parse(text);
    
  } catch (error) {
      console.error("Error en analyzeDropoutRisk:", error);
      throw error;
  }
}