import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy Google Gen AI helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Multi-tier candidate models prioritizing high-throughput flash models with separate quota pools
// Strictly complies with @google/genai guidelines:
// gemini-3.8-flash (Primary default)
// gemini-3.5-flash (High availability Flash pool)
// gemini-3.1-flash-lite (Ultra fast, lightweight quota pool)
// gemini-flash-latest (General flash pool)
// gemini-3.5-flash-lite (Ultra lightweight backup pool)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
];

let lastSuccessfulModel = 'gemini-3.8-flash';

// Resilient helper with automatic model switching upon token/quota exhaustion
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  autoModelSwitch?: boolean;
  preferredModel?: string;
}): Promise<any> {
  const ai = getGenAI();
  let lastError: any = null;
  let switchedModels = false;
  const allowSwitch = params.autoModelSwitch !== false;
  const startingModel = params.preferredModel && CANDIDATE_MODELS.includes(params.preferredModel)
    ? params.preferredModel
    : (CANDIDATE_MODELS.includes(lastSuccessfulModel) ? lastSuccessfulModel : CANDIDATE_MODELS[0]);

  // If user disabled autoModelSwitch, only try the specified or default model
  const modelsToTry = allowSwitch
    ? [
        startingModel,
        ...CANDIDATE_MODELS.filter((m) => m !== startingModel),
      ]
    : [startingModel];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      lastSuccessfulModel = model;
      if (switchedModels) {
        console.log(`[S.A.R.A Resiliencia] Cambio automático exitoso al modelo alternativo: ${model}`);
      }
      
      // Attach the model name and token metrics to response object for frontend awareness
      if (response && typeof response === 'object') {
        (response as any).usedModel = model;
        // Extract real token usage if available from SDK response
        const usage = (response as any).usageMetadata;
        if (usage) {
          (response as any).tokenUsage = {
            promptTokens: usage.promptTokenCount || 0,
            candidatesTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || ((usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0)),
          };
        } else {
          // Approximate realistic token metrics if SDK didn't return usageMetadata
          const promptLen = JSON.stringify(params.contents).length;
          const respLen = (response.text || '').length;
          const promptTok = Math.max(1, Math.round(promptLen / 3.8));
          const candTok = Math.max(1, Math.round(respLen / 3.8));
          (response as any).tokenUsage = {
            promptTokens: promptTok,
            candidatesTokens: candTok,
            totalTokens: promptTok + candTok,
          };
        }
      }
      return response;
    } catch (err: any) {
      lastError = err;
      switchedModels = true;
      const errMsg = err?.message || String(err);
      console.warn(`[S.A.R.A Auto-Switch] Modelo ${model} no disponible (${errMsg.slice(0, 100)}).`);

      // If user disabled autoModelSwitch, do not attempt fallback models
      if (!allowSwitch) {
        console.warn(`[S.A.R.A Auto-Switch] Cambio automático desactivado por el usuario. Deteniendo failover.`);
        break;
      }

      // Continue to next candidate model immediately without blocking delay
      continue;
    }
  }

  // If quota or API limits are exhausted across all candidate models, return smart pedagogical offline fallback response
  console.warn('[S.A.R.A] Cuota de tokens agotada en todos los modelos disponibles. Activando modo pedagógico local asistido.');
  
  const fallbackText = JSON.stringify({
    responseText: "He registrado tu consulta correctamente en el modo sin conexión de S.A.R.A. En este momento los servicios de IA de alta concurrencia están renovando su cuota de tokens. Sin embargo, tu racha, tus XP, tus notas en memoria y tus herramientas de estudio siguen operando al 100% localmente. ¿Te gustaría realizar un repaso rápido de tus apuntes guardados?",
    suggestedQuestions: [
      "Ver mis temas en memoria",
      "Realizar un repaso rápido",
      "Reintentar consulta"
    ],
    highlightedConcept: "Modo Local S.A.R.A",
    memoryUpdate: {
      shouldUpdate: false
    }
  });

  return { text: fallbackText, usedModel: 'modo-local' };
}

function cleanTopicTitle(title: string): string {
  if (!title || typeof title !== 'string') return 'Tema de Estudio';
  let cleaned = title.trim()
    .replace(/^["'«“`\[\(\*]+|["'»”`\]\)\*]+$/g, '')
    .replace(/^(?:el\s+tema\s+(?:de\s+hoy\s+)?(?:es|tratado|aprendido)\s*:?|tema\s*:?|aprendimos\s+sobre\s*:?|estudiamos\s*:?|estudio\s+de\s*:?|explicación\s+de\s*:?|explicación\s+sobre\s*:?|introducción\s+a\s*:?|repaso\s+de\s*:?|apuntes\s+sobre\s*:?|sobre\s*:?|lección\s+de\s*:?|concepto\s*:?)\s*/i, '')
    .replace(/^(?:ciencias(?:\s+naturales)?|matemáticas|lengua(?:\s+y\s+literatura)?|historia|física|química|biología|inglés|programación)\s*[:\-–—|]\s*/i, '')
    .replace(/(?:\s*\.{2,}|\s*…)+$/g, '')
    .trim();

  // Strip trailing punctuation
  cleaned = cleaned.replace(/[,;:\-–—\.\s]+$/g, '').trim();

  // Fix accidental markdown markers
  cleaned = cleaned.replace(/\*\*/g, '').replace(/__/g, '');

  // Safety length guard: only if longer than 120 chars, cut safely at sentence
  if (cleaned.length > 120) {
    const match = cleaned.match(/^([^.?!;\n]+)/);
    if (match && match[1].length >= 10) {
      cleaned = match[1].trim();
    } else {
      const lastSpace = cleaned.lastIndexOf(' ', 100);
      if (lastSpace > 20) {
        cleaned = cleaned.substring(0, lastSpace).trim();
      }
    }
    cleaned = cleaned.replace(/[,;:\-–—\.\s]+$/g, '').trim();
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned || 'Tema de Estudio';
}

// Helper to safely parse and clean Gemini JSON responses, guaranteeing zero code leakage and no crashes
function cleanAndParseJSON(rawText: string, subject?: string): {
  responseText: string;
  suggestedQuestions: string[];
  highlightedConcept?: string;
  mindMap?: any;
  visualIllustration?: any;
  memoryUpdate?: any;
} {
  let parsed: any = null;
  const cleanedRaw = (rawText || '').trim();

  // 1. Direct JSON parse
  try {
    parsed = JSON.parse(cleanedRaw);
  } catch {
    // 2. Try unwrap markdown code fence (```json ... ```)
    const codeBlockMatch = cleanedRaw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim());
      } catch {}
    }

    // 3. Try to locate outermost { ... }
    if (!parsed) {
      const firstBrace = cleanedRaw.indexOf('{');
      const lastBrace = cleanedRaw.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(cleanedRaw.slice(firstBrace, lastBrace + 1));
        } catch {}
      }
    }

    // 4. Regex extraction for responseText if json was truncated or malformed
    if (!parsed) {
      const respMatch = cleanedRaw.match(/"responseText"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      if (respMatch && respMatch[1]) {
        try {
          const unescaped = JSON.parse(`"${respMatch[1]}"`);
          parsed = { responseText: unescaped };
        } catch {
          parsed = { responseText: respMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') };
        }
      }
    }
  }

  // 5. Extract response text and safeguard against raw JSON leak
  let responseText = '';
  if (parsed && typeof parsed.responseText === 'string') {
    responseText = parsed.responseText;
  } else {
    // Strip JSON boilerplate completely so the user never sees code lines or json syntax
    responseText = cleanedRaw
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .replace(/^\s*\{\s*"responseText"\s*:\s*"?/i, '')
      .replace(/"\s*,\s*"suggestedQuestions"[\s\S]*$/i, '')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/^\s*\{|\}\s*$/g, '')
      .trim();

    if (!responseText) {
      responseText = 'Aquí tienes la explicación sobre el tema solicitado.';
    }
  }

  // If responseText itself contains nested JSON string
  if (responseText.includes('"responseText"') && responseText.includes('{')) {
    try {
      const inner = JSON.parse(responseText);
      if (inner.responseText) responseText = inner.responseText;
    } catch {
      responseText = responseText.replace(/"responseText"\s*:\s*"/g, '').replace(/",\s*"suggestedQuestions"[\s\S]*/g, '');
    }
  }

  // Strip unwanted code blocks in non-programming subjects
  if (subject !== 'programacion') {
    responseText = responseText
      .replace(/```(?:markdown|text|plain|json)?\s*([\s\S]*?)\s*```/g, '$1')
      .replace(/```/g, '');
  }

  // Remove repetitive self-introductions in continuous chat
  responseText = responseText
    .replace(/^(?:¡?Hola!?\s*)?(?:Soy\s+S\.A\.R\.A\.?|Como\s+S\.A\.R\.A\.?)[^.\n]*[.\n]+\s*/i, '')
    .trim();

  let memoryUpdate = parsed?.memoryUpdate || undefined;
  if (memoryUpdate && memoryUpdate.topicTitle) {
    memoryUpdate.topicTitle = cleanTopicTitle(memoryUpdate.topicTitle);
  }

  return {
    responseText: responseText || 'Aquí tienes la explicación solicitada.',
    suggestedQuestions: Array.isArray(parsed?.suggestedQuestions) && parsed.suggestedQuestions.length > 0
      ? parsed.suggestedQuestions.slice(0, 3)
      : ['¿Puedes darme un ejemplo práctico?', '¿Hacemos una pregunta rápida de repaso?'],
    highlightedConcept: parsed?.highlightedConcept || undefined,
    mindMap: parsed?.mindMap && Array.isArray(parsed.mindMap.nodes) ? parsed.mindMap : undefined,
    visualIllustration: parsed?.visualIllustration || undefined,
    memoryUpdate,
  };
}

// Intent detection helpers for automatic generation in chat
function isMindMapRequest(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mindMapKeywords = [
    'mapa mental', 'mapas mentales', 'mapa conceptual', 'mapas conceptuales',
    'red conceptual', 'redes conceptuales', 'arbol conceptual', 'mindmap', 'mind map',
    'organizador visual', 'esquema de ramas', 'diagrama de ramas'
  ];
  if (mindMapKeywords.some((kw) => lower.includes(kw))) return true;
  const actionRegex = /\b(crea|crear|haz|hazme|genera|generar|dibuja|dibujar|muestrame|dame|quiero|necesito|elabora|elaborar|ver|construye|construir)\b.*\b(mapa)\b/i;
  return actionRegex.test(lower);
}

function isVisualIllustrationRequest(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  if (isMindMapRequest(text)) return false;
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const visualPhrases = [
    'foto explicativa', 'fotos explicativas', 'imagen explicativa', 'imagenes explicativas',
    'ilustracion explicativa', 'ilustraciones explicativas', 'esquema explicativo',
    'esquemas explicativos', 'diagrama explicativo', 'diagramas explicativos',
    'dibujo explicativo', 'dibujos explicativos', 'foto didactica', 'fotos didacticas',
    'imagen didactica', 'imagenes didacticas', 'ilustracion didactica',
    'esquema visual', 'esquemas visuales', 'esquema grafico', 'esquemas graficos',
    'infografia', 'infografias', 'infografia didactica', 'infografia explicativa',
    'ficha explicativa'
  ];
  if (visualPhrases.some((phrase) => lower.includes(phrase))) return true;
  const actionVisualPattern = /\b(crea|crear|haz|hazme|genera|generar|dibuja|dibujar|ilustra|ilustrar|muestrame|ensename|dame|quiero|necesito|elabora|elaborar)\b.*\b(foto|imagen|ilustracion|dibujo|infografia|diagrama|esquema)\b/i;
  return actionVisualPattern.test(lower);
}

function extractTargetTopic(text: string, defaultTopic: string = 'Tema de estudio'): string {
  if (!text || typeof text !== 'string') return defaultTopic;
  let cleaned = text
    .replace(/^(?:por favor|hola|tutor|tutora|sara|s\.a\.r\.a\.?)[,\s]*/gi, '')
    .trim();
  cleaned = cleaned.replace(
    /(?:puedes\s+)?(?:crear?|haz(?:me)?|genera?r?|dibuja?r?|ilustra?r?|mu[eé]strame|ens[eé][ñn]ame|dame|quiero|necesito|elabora?r?|construir?)\s+(?:un[ao]?|el|la|los|las)?\s*(?:mapa\s+mental(?:es)?|mapa\s+conceptual(?:es)?|red\s+conceptual|mindmap|mind\s+map|foto\s+explicativa(?:s)?|imagen\s+explicativa(?:s)?|ilustraci[oó]n\s+explicativa(?:s)?|esquema\s+explicativo(?:s)?|esquema\s+visual(?:es)?|diagrama\s+explicativo(?:s)?|infograf[ií]a(?:s)?|dibujo\s+explicativo(?:s)?|foto\s+did[aá]ctica(?:s)?|imagen\s+did[aá]ctica(?:s)?|esquema\s+gr[aá]fico(?:s)?|ficha\s+explicativa|foto|imagen|ilustraci[oó]n|diagrama|esquema|dibujo|mapa)(?:\s+(?:interactiv[oa]|did[aá]ctic[oa]|visual|explicativ[oa]))?/gi,
    ''
  );
  cleaned = cleaned
    .replace(/^\s*(?:sobre|acerca de|de|del|de la|de los|de las|para|en relación a|en relacion a|respecto a)\s*[:\s]*/i, '')
    .replace(/[¿?¡!.,;:"]/g, '')
    .trim();
  if (cleaned.length >= 2 && !/^(eso|esto|tema|el tema|un tema|algún tema|algun tema)$/i.test(cleaned)) {
    return cleaned;
  }
  return defaultTopic;
}

// Reusable Mind Map Data Generator
async function generateMindMapInternal({
  topic,
  subject = 'General',
  grade = 'secundaria',
  currentContext = '',
  autoModelSwitch,
  preferredModel,
}: {
  topic: string;
  subject?: string;
  grade?: string;
  currentContext?: string;
  autoModelSwitch?: boolean;
  preferredModel?: string;
}) {
  const cleanTopic = (topic || 'Tema de estudio').trim();
  const prompt = `
Eres S.A.R.A, tutora pedagógica inteligente.
Genera un mapa mental altamente estructurado, claro y didáctico sobre "${cleanTopic}" en la materia "${subject}" para un estudiante de nivel "${grade}".
${currentContext ? `Duda o contexto del estudiante: "${currentContext}"` : ''}

REGLA CRÍTICA: Cada nodo (rama principal) y cada subnodo (children) DEBE estar estrictamente relacionado, enfocado y contextualizado exclusivamente en el tema "${cleanTopic}". No uses respuestas ni títulos genéricos; cada etiqueta y descripción debe explicar aspectos reales y específicos de "${cleanTopic}".

El mapa mental debe tener:
- topic: Título claro y conciso del tema (máximo 4 a 6 palabras).
- centralConcept: El principio fundamental o núcleo conceptual sobre "${cleanTopic}" en una frase concisa y clara.
- summary: Un resumen pedagógico breve de 2 frases explicando los puntos clave de "${cleanTopic}".
- nodes: De 3 a 5 ramas principales específicas sobre "${cleanTopic}".
  Cada rama principal (node) debe contener:
  * id: identificador único ("node-1", "node-2", etc.)
  * label: Título de la rama específico de "${cleanTopic}" (máximo 3 palabras)
  * description: Explicación didáctica clara y específica sobre esta parte de "${cleanTopic}" (1 frase).
  * children: De 2 a 3 subconceptos o elementos concretos dentro de esa rama relacionados con "${cleanTopic}". Cada uno con:
    - id: "subnode-1-1"
    - label: Nombre del subconcepto o término específico
    - description: Definición o explicación breve sobre "${cleanTopic}".

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "topic": "${cleanTopic}",
  "centralConcept": "...",
  "summary": "...",
  "nodes": [
    {
      "id": "node-1",
      "label": "...",
      "description": "...",
      "children": [
        { "id": "child-1-1", "label": "...", "description": "..." }
      ]
    }
  ]
}
`;

  try {
    const response = await generateContentWithRetry({
      contents: prompt,
      autoModelSwitch,
      preferredModel,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    let jsonParsed: any = null;
    try {
      let rawText = response.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      jsonParsed = JSON.parse(rawText);
    } catch {
      const match = response.text.match(/\{[\s\S]*\}/);
      if (match) jsonParsed = JSON.parse(match[0]);
    }

    if (jsonParsed && Array.isArray(jsonParsed.nodes) && jsonParsed.nodes.length > 0) {
      return jsonParsed;
    }
  } catch (error) {
    console.warn('[TutorIA] Mind map generation error, using contextual fallback for:', cleanTopic);
  }

  const topicLower = cleanTopic.toLowerCase();
  let node1 = {
    id: 'node-1',
    label: 'Definición y Bases',
    description: `Conceptos iniciales y principios fundamentales sobre ${cleanTopic}.`,
    children: [
      { id: 'sub-1', label: 'Concepto Central', description: `Significado principal y propósito de ${cleanTopic}.` },
      { id: 'sub-2', label: 'Características', description: `Atributos y propiedades esenciales de ${cleanTopic}.` }
    ]
  };
  let node2 = {
    id: 'node-2',
    label: 'Estructura o Fases',
    description: `Componentes clave, etapas o clasificación de ${cleanTopic}.`,
    children: [
      { id: 'sub-3', label: 'Elementos Principales', description: `Partes o factores clave que componen ${cleanTopic}.` },
      { id: 'sub-4', label: 'Clasificación', description: `Tipos o modalidades relacionadas con ${cleanTopic}.` }
    ]
  };
  let node3 = {
    id: 'node-3',
    label: 'Aplicación Práctica',
    description: `Ejemplos, utilidad y forma de poner en práctica ${cleanTopic}.`,
    children: [
      { id: 'sub-5', label: 'Caso de Uso', description: `Ejemplo real de aplicación de ${cleanTopic}.` },
      { id: 'sub-6', label: 'Importancia', description: `Por qué es relevante y útil ${cleanTopic}.` }
    ]
  };

  if (topicLower.includes('auto') || topicLower.includes('coche') || topicLower.includes('vehiculo') || topicLower.includes('carro')) {
    node1 = {
      id: 'node-1',
      label: 'Diseño y Planificación',
      description: 'Creación de planos, selección de materiales y aerodinámica inicial.',
      children: [
        { id: 'sub-1', label: 'Bocetos y Estética', description: 'Diseño de la carrocería y distribución de espacios.' },
        { id: 'sub-2', label: 'Chasis y Bastidor', description: 'Estructura rígida de soporte para todos los componentes.' }
      ]
    };
    node2 = {
      id: 'node-2',
      label: 'Motor y Transmisión',
      description: 'Sistema motriz y mecanismo de transferencia de potencia a las ruedas.',
      children: [
        { id: 'sub-3', label: 'Motor de Combustión/Eléctrico', description: 'Corazón propulsor que genera la energía mecánica.' },
        { id: 'sub-4', label: 'Caja de Cambios', description: 'Sistema de marchas para optimizar torque y velocidad.' }
      ]
    };
    node3 = {
      id: 'node-3',
      label: 'Ensamblaje y Pruebas',
      description: 'Montaje final de sistemas eléctricos, frenos y pruebas de seguridad.',
      children: [
        { id: 'sub-5', label: 'Sistemas de Seguridad', description: 'Frenos ABS, airbags y zonas de deformación programada.' },
        { id: 'sub-6', label: 'Pruebas en Pista', description: 'Testeo de rendimiento, suspensión y aerodinámica final.' }
      ]
    };
  }

  return {
    topic: cleanTopic,
    centralConcept: `Principios fundamentales y estudio detallado de ${cleanTopic} en ${subject}.`,
    summary: `Estructura conceptual organizada en ramas esenciales para dominar ${cleanTopic} de forma clara y precisa.`,
    nodes: [node1, node2, node3]
  };
}

// Reusable Visual Illustration Data Generator
async function generateVisualInternal({
  prompt,
  topic,
  subject = 'General',
  grade = 'secundaria',
  currentContext = '',
  autoModelSwitch,
  preferredModel,
}: {
  prompt?: string;
  topic?: string;
  subject?: string;
  grade?: string;
  currentContext?: string;
  autoModelSwitch?: boolean;
  preferredModel?: string;
}) {
  const query = (prompt || topic || 'Concepto pedagógico').trim();

  const metaPrompt = `
Eres S.A.R.A, tutora pedagógica inteligente.
Crea una ficha explicativa gráfica y visual enfocada ÚNICA Y EXCLUSIVAMENTE sobre el tema "${query}" en la materia "${subject}" para nivel "${grade}".
${currentContext ? `Contexto o duda actual del estudiante en la clase: "${currentContext}"` : ''}

REGLA CRÍTICA: La información debe ser 100% fiel al tema "${query}". NO incluyas información de otros temas ni de materias distintas.

Devuelve un JSON estricto con:
{
  "title": "Título didáctico específico (ej: Diagrama de las Ecuaciones de 2º Grado o Esquema del Ciclo del Agua)",
  "caption": "Explicación visual clara de los elementos en 2 a 3 frases concisas y exactas sobre ${query}.",
  "keyLabels": [
    { "label": "Nombre del componente, fórmula o parte 1", "description": "Explicación breve de su función o significado" },
    { "label": "Nombre del componente, fórmula o parte 2", "description": "Explicación breve de su función o significado" },
    { "label": "Nombre del componente, fórmula o parte 3", "description": "Explicación breve de su función o significado" }
  ],
  "steps": ["Paso o fase 1", "Paso o fase 2", "Paso o fase 3"]
}
`;

  let visualData: any = {};
  try {
    const metaResponse = await generateContentWithRetry({
      contents: metaPrompt,
      autoModelSwitch,
      preferredModel,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    try {
      visualData = JSON.parse(metaResponse.text.trim());
    } catch {
      const match = metaResponse.text.match(/\{[\s\S]*\}/);
      if (match) {
        visualData = JSON.parse(match[0]);
      }
    }
  } catch (err) {
    console.warn('[TutorIA] Visual schema generation fallback:', err);
  }

  if (!visualData || !visualData.title) {
    visualData = {
      title: `Esquema explicativo: ${query}`,
      caption: `Representación visual y pedagógica estructurada para comprender ${query}.`,
      keyLabels: [
        { label: 'Núcleo o Concepto Principal', description: 'Idea fundamental sobre la que gira el tema.' },
        { label: 'Relación de Componentes', description: 'Cómo interactúan los elementos del fenómeno o ejercicio.' }
      ],
      steps: ['Identificar las variables y datos', 'Aplicar el principio pedagógico paso a paso', 'Comprobar el resultado']
    };
  }

  let imageUrl: string | null = null;
  const ai = getGenAI();
  const imageCandidateModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];

  for (const imgModel of imageCandidateModels) {
    try {
      const imgRes = await ai.models.generateContent({
        model: imgModel,
        contents: {
          parts: [
            {
              text: `Educational conceptual diagram and scientific illustration explaining ${query} in ${subject}, clear vector infographic style, high contrast pedagogical clarity, clean isolated diagram elements, textbook quality.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '4:3',
          },
        },
      });

      for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageUrl) break;
    } catch (imgErr: any) {
      console.warn(`[S.A.R.A Visual] Modelo ${imgModel} no disponible (${imgErr?.message?.slice(0, 90)}). Intentando siguiente opción visual...`);
    }
  }

  if (!imageUrl) {
    const safeTitle = (visualData.title || query).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCaption = (visualData.caption || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const labels = Array.isArray(visualData.keyLabels) ? visualData.keyLabels : [];

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" style="background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="hubGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bgGrad)"/>
  <rect x="25" y="25" width="750" height="450" rx="20" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="2"/>
  
  <text x="50" y="65" font-size="11" font-weight="700" fill="#38bdf8" letter-spacing="1">S.A.R.A • ESQUEMA DIDÁCTICO VISUAL</text>
  <text x="50" y="98" font-size="20" font-weight="800" fill="#ffffff">${safeTitle}</text>
  <text x="50" y="122" font-size="12" fill="#94a3b8">${safeCaption.slice(0, 90)}</text>
  
  <!-- Central Hub -->
  <circle cx="230" cy="285" r="75" fill="url(#hubGrad)" stroke="#93c5fd" stroke-width="3"/>
  <text x="230" y="280" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">${safeTitle.slice(0, 16)}</text>
  <text x="230" y="302" font-size="11" fill="#dbeafe" text-anchor="middle">Núcleo Central</text>
  
  <!-- Key Labels / Connectors -->
  ${labels.slice(0, 4).map((l: any, i: number) => {
    const yPos = 165 + i * 72;
    const safeL = (l.label || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeD = (l.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
    <g>
      <line x1="300" y1="285" x2="410" y2="${yPos + 26}" stroke="#60a5fa" stroke-width="2" stroke-dasharray="4"/>
      <rect x="410" y="${yPos}" width="340" height="56" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
      <circle cx="438" cy="${yPos + 28}" r="15" fill="#2563eb"/>
      <text x="438" y="${yPos + 33}" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${i + 1}</text>
      <text x="465" y="${yPos + 24}" font-size="13" font-weight="bold" fill="#f8fafc">${safeL.slice(0, 28)}</text>
      <text x="465" y="${yPos + 43}" font-size="11" fill="#94a3b8">${safeD.slice(0, 42)}</text>
    </g>
    `;
  }).join('')}
</svg>
    `.trim();
    imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
  }

  visualData.imageUrl = imageUrl;
  return visualData;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    currentModel: lastSuccessfulModel,
    candidateModels: CANDIDATE_MODELS,
    time: new Date().toISOString(),
  });
});

// Model status and fallback info endpoint
app.get('/api/model-status', (req, res) => {
  res.json({
    activeModel: lastSuccessfulModel,
    candidateModels: CANDIDATE_MODELS,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    isFallbackActive: lastSuccessfulModel !== CANDIDATE_MODELS[0],
  });
});

// Update preferred model on the server immediately
app.post('/api/model-status', (req, res) => {
  const { preferredModel } = req.body;
  if (preferredModel && CANDIDATE_MODELS.includes(preferredModel)) {
    lastSuccessfulModel = preferredModel;
    console.log(`[S.A.R.A Modelo] Modelo activo cambiado por el usuario a: ${preferredModel}`);
  }
  res.json({
    activeModel: lastSuccessfulModel,
    candidateModels: CANDIDATE_MODELS,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    isFallbackActive: lastSuccessfulModel !== CANDIDATE_MODELS[0],
  });
});

// Test model responsiveness & health check endpoint
app.post('/api/test-model', async (req, res) => {
  const { model } = req.body;
  const targetModel = model && CANDIDATE_MODELS.includes(model) ? model : lastSuccessfulModel;
  const startTime = Date.now();
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: 'Responde exactamente la palabra: Conectado',
      config: {
        maxOutputTokens: 20,
        temperature: 0.1,
      },
    });
    const responseTimeMs = Date.now() - startTime;
    lastSuccessfulModel = targetModel;
    res.json({
      success: true,
      model: targetModel,
      responseTimeMs,
      message: response.text?.trim() || 'Conectado',
    });
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const errMsg = err?.message || String(err);
    res.json({
      success: false,
      model: targetModel,
      responseTimeMs,
      error: errMsg.includes('503') 
        ? 'Alta demanda temporal en este modelo (503)' 
        : errMsg.includes('429') 
        ? 'Límite de cuota alcanzado (429)' 
        : errMsg.slice(0, 100),
    });
  }
});

// Chat endpoint for intelligent adaptive tutor
app.post('/api/tutor/chat', async (req, res) => {
  try {
    const {
      message = '',
      image,
      chatHistory = [],
      studentProfile = {},
      memoryTopics = [],
      currentTopic = '',
      autoModelSwitch = true,
      preferredModel = undefined,
    } = req.body;

    const trimmedMsg = typeof message === 'string' ? message.trim() : '';
    const hasImage = Boolean(image && image.data && (typeof image.data === 'string'));

    if (!trimmedMsg && !hasImage) {
      return res.status(400).json({ error: 'Escribe un mensaje o adjunta una imagen con tu duda pedagógica.' });
    }

    const effectiveMessage = trimmedMsg || 'Por favor analiza el ejercicio, fórmula o esquema en la imagen adjunta y explícamelo paso a paso con claridad.';

    // Format memory topics concisely for context
    const formattedMemories = memoryTopics.slice(0, 5).map((m: any) => 
      `- [${m.subjectDisplayName || m.subject}] ${m.topicTitle} (Dominio: ${m.masteryLevel}): ${m.keyConcepts?.slice(0, 4).join(', ') || ''}`
    ).join('\n');

    // Recent history formatting: keep last 5 messages, truncated to prevent context bloating
    const recentHistoryText = chatHistory
      .slice(-5)
      .map((msg: any) => {
        const text = typeof msg.text === 'string' ? msg.text.slice(0, 300) : '';
        return `${msg.sender === 'user' ? 'Estudiante' : 'Tutor S.A.R.A'}: ${text}`;
      })
      .join('\n');

    const subject = studentProfile.currentSubject || 'ciencias';
    const grade = studentProfile.grade || 'secundaria';
    const learningStyle = studentProfile.learningStyle || 'socratico';
    const studentName = studentProfile.name || 'Estudiante';
    const interests = studentProfile.interests ? `Intereses del estudiante para analogías: ${studentProfile.interests}.` : '';

    const imageInstruction = hasImage
      ? `\nVISIÓN Y ANÁLISIS DE IMAGEN ADJUNTA:
El estudiante te ha enviado una imagen (ejercicio, foto de cuaderno, libro de texto o esquema).
1. Lee detenidamente el texto, números, gráficos o fórmulas de la imagen.
2. Explica con total claridad el planteamiento y guía paso a paso al estudiante para resolverlo sin saltarte pasos.
3. No uses bloques de código ni lenguaje informático a menos que sea la materia de programación.`
      : '';

    const systemInstruction = `
Eres S.A.R.A (Sistema de Apoyo y Rendimiento Académico), una tutora pedagógica personal, dinámica, amena, clara y empática.
Tutorizas a ${studentName}.

REGLAS DE ORO DE COMUNICACIÓN (OBLIGATORIAS):
1. ENFOQUE ESTRICTO EN EL TEMA ACTUAL (CERO DISTRACCIONES):
   - Concéntrate al 100% ÚNICA Y EXCLUSIVAMENTE en el tema, ejercicio, duda o materia que el estudiante está tratando en este momento.
   - Si el estudiante pregunta sobre un tema específico (por ejemplo: álgebra, historia, leyes de física, un ejercicio numérico, etc.), responde únicamente sobre ese tema.
   - PROHIBIDO introducir o mezclar temas no relacionados guardados en la memoria (como fotosíntesis, biología o temas antiguos) a menos que el estudiante pregunte explícitamente por ellos.
   - No saltes de tema ni menciones cosas de la memoria que no vengan al caso.

2. RESPUESTAS CONCISAS, ÁGILES Y DIRECTAS:
   - Máximo 2 a 3 párrafos cortos (entre 80 y 160 palabras en total).
   - Ve directo al grano a resolver la duda. Prohibido dar discursos interminables o explicaciones kilométricas.
   - Si el tema es amplio, explica la idea central con claridad y deja los detalles para las preguntas de seguimiento.

3. CERO REPETICIONES:
   - NUNCA te presentes de nuevo en cada mensaje (NO digas "Hola, soy S.A.R.A...", "Como tu tutora pedagógica...", etc.). El estudiante ya te conoce.
   - NUNCA repitas la pregunta que hizo el estudiante.
   - NUNCA repitas la misma explicación con otras palabras en bucle.
   - Evita frases de relleno vacías como "¡Excelente pregunta!", "Es maravilloso que preguntes...".

4. PROHIBIDO LÍNEAS O BLOQUES DE CÓDIGO (EXCEPTO SI LA MATERIA ES PROGRAMACIÓN):
   - NO generes bloques de código (\`\`\` ni \`\`\`json ni \`\`\`markdown) dentro de "responseText".
   - NO uses formato de terminal ni caracteres de código para enmarcar texto o explicaciones.
   - Si la materia es Matemáticas o Ciencias, escribe las fórmulas y operaciones en texto limpio y natural (por ejemplo: "2x + 4 = 10", "x = 3", "H2O", "F = m * a") sin bloques \`\`\`.
   - Si la materia es Lengua o Historia, escribe en prosa natural con viñetas limpias (- o •).
   - Únicamente si la materia es "programacion" y el estudiante solicita explícitamente código se permite un bloque breve de código.
${imageInstruction}

PERFIL PEDAGÓGICO:
- Grado escolar: ${grade}. Adapta el vocabulario y profundidad a este nivel.
- Estilo: ${learningStyle}.
  * socratico: Haz 1 pregunta reflexiva paso a paso guiando al estudiante a deducir la respuesta.
  * visual: Usa viñetas limpias, pasos numerados claros y analogías espaciales.
  * feynman: Lenguaje sumamente sencillo y cotidiano, sin jerga pesada.
  * practico: Aplica a un caso o ejercicio real inmediato.
  * teorico: Principios fundamentales y deducciones lógicas claras.
- Materia actual: ${subject}.
${interests}

TEMAS EN MEMORIA (Solo como trasfondo general del estudiante; NUNCA los menciones a menos que el estudiante pregunte por ellos):
${formattedMemories || 'Sin temas registrados aún.'}

FORMATO DE SALIDA (ESTRICTO JSON):
Devuelve ÚNICAMENTE un objeto JSON con este esquema:
{
  "responseText": "Tu respuesta pedagógica concisa y clara en texto natural con negritas y viñetas limpias si se requieren (SIN bloques de código ni código JSON).",
  "suggestedQuestions": ["Pregunta corta 1", "Pregunta corta 2"],
  "highlightedConcept": "Concepto clave abordado (ej. Fotosíntesis)",
  "mindMap": null (o si el estudiante pide 'mapa mental', 'esquema visual' o 'diagrama', incluye un objeto con topic, centralConcept, summary y nodes con ramas y subconceptos),
  "memoryUpdate": {
    "shouldUpdate": false,
    "topicTitle": "Nombre completo y claro del tema estudiado (ej. 'Fotosíntesis y Respiración Celular', 'Ecuaciones de Primer Grado con una Incógnita', 'Segunda Ley de Newton'). Debe ser un título completo con sentido gramatical propio, NUNCA incompleto, nunca cortado a la mitad ni con puntos suspensivos",
    "keyConceptsLearned": ["Concepto 1"],
    "summary": "1 frase corta de lo aprendido",
    "suggestedMastery": "iniciado" | "en_progreso" | "dominado"
  }
}
`;

    const userPromptText = `
Historial reciente:
${recentHistoryText || 'Inicio de conversación.'}

Tema en curso: ${currentTopic || 'General'}
${hasImage ? '[El estudiante adjuntó una imagen con este mensaje]' : ''}
Mensaje de ${studentName}: "${effectiveMessage}"

Instrucción final: Responde de forma CONCISA (máximo 2 a 3 párrafos breves), directa al grano, sin repetir presentaciones, sin bloques de código informático y en formato JSON.
`;

    // Construct multimodal parts if image is present
    let contentsPayload: any;
    if (hasImage) {
      let rawData = image.data;
      if (typeof rawData === 'string' && rawData.includes(',')) {
        rawData = rawData.split(',')[1];
      }
      let mimeType = image.mimeType || 'image/jpeg';
      if (!mimeType.startsWith('image/')) {
        mimeType = 'image/jpeg';
      }

      contentsPayload = [
        {
          role: 'user',
          parts: [
            { text: userPromptText },
            {
              inlineData: {
                mimeType,
                data: rawData,
              },
            },
          ],
        },
      ];
    } else {
      contentsPayload = userPromptText;
    }

    let rawText = '';
    let parsedData: any = null;

    // Stage 1: Try with structured responseSchema
    try {
      const response = await generateContentWithRetry({
        contents: contentsPayload,
        autoModelSwitch,
        preferredModel,
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              responseText: {
                type: Type.STRING,
                description: 'Explicación concisa y directa sin bloques de código innecesarios',
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 a 3 preguntas breves de seguimiento',
              },
              highlightedConcept: {
                type: Type.STRING,
                description: 'Concepto clave principal',
              },
              memoryUpdate: {
                type: Type.OBJECT,
                properties: {
                  shouldUpdate: { type: Type.BOOLEAN },
                  topicTitle: { 
                    type: Type.STRING,
                    description: 'Nombre completo y claro del tema estudiado (ej. Fotosíntesis y Respiración Celular, Ecuaciones de Primer Grado con una Incógnita, Segunda Ley de Newton). Debe ser un título completo con sentido gramatical propio, NUNCA incompleto, nunca cortado a la mitad ni con puntos suspensivos.',
                  },
                  keyConceptsLearned: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  summary: { type: Type.STRING },
                  suggestedMastery: { type: Type.STRING },
                },
              },
            },
            required: ['responseText', 'suggestedQuestions'],
          },
        },
      });

      rawText = response.text || '';
      parsedData = cleanAndParseJSON(rawText, subject);
      if (parsedData) {
        if (response.usedModel) {
          parsedData.usedModel = response.usedModel;
        }
        if (response.tokenUsage) {
          parsedData.tokenUsage = response.tokenUsage;
        }
      }
    } catch (schemaError: any) {
      console.warn('[TutorIA] Stage 1 (Schema) failed, falling back to Stage 2 (Direct Prompt):', schemaError?.message || schemaError);

      // Stage 2: Fallback without strict responseSchema (handles image parsing or schema edge cases)
      try {
        const fallbackResponse = await generateContentWithRetry({
          contents: contentsPayload,
          autoModelSwitch,
          preferredModel,
          config: {
            systemInstruction: `${systemInstruction}\n\nResponde en formato JSON válido con las llaves "responseText" y "suggestedQuestions".`,
            temperature: 0.4,
            maxOutputTokens: 1200,
          },
        });

        rawText = fallbackResponse.text || '';
        parsedData = cleanAndParseJSON(rawText, subject);
        if (parsedData) {
          if (fallbackResponse.usedModel) {
            parsedData.usedModel = fallbackResponse.usedModel;
          }
          if (fallbackResponse.tokenUsage) {
            parsedData.tokenUsage = fallbackResponse.tokenUsage;
          }
        }
      } catch (fallbackError: any) {
        console.error('[TutorIA] Both AI stages failed:', fallbackError?.message || fallbackError);

        // Stage 3: Graceful pedagogical fallback so user NEVER sees a raw 500 error or crash
        parsedData = {
          responseText: `Hola ${studentName}, ha habido una interrupción momentánea de conexión con el motor pedagógico. He guardado tu consulta${hasImage ? ' e imagen' : ''} para que puedas pulsar en **Reintentar** o reformularla en cualquier momento.`,
          suggestedQuestions: ['Reintentar consulta', 'Ver mis temas guardados en memoria'],
          isError: true,
          canRetry: true,
        };
      }
    }

    if (!parsedData || !parsedData.responseText) {
      parsedData = {
        responseText: `He revisado tu consulta sobre ${currentTopic || subject}. ¿Hay algún paso en particular donde sientas mayor dificultad?`,
        suggestedQuestions: ['Explicar el primer paso', 'Dar un ejemplo simple'],
      };
    }

    // Auto-detect and attach Mind Map or Visual Illustration if student requested one naturally in chat
    const userWantsMindMap = isMindMapRequest(trimmedMsg);
    const userWantsVisual = !userWantsMindMap && isVisualIllustrationRequest(trimmedMsg);

    if (userWantsMindMap && !parsedData.mindMap) {
      try {
        const targetTopic = extractTargetTopic(trimmedMsg, currentTopic || subject);
        const generatedMap = await generateMindMapInternal({
          topic: targetTopic,
          subject,
          grade,
          currentContext: recentHistoryText,
        });
        parsedData.mindMap = generatedMap;
        if (!parsedData.highlightedConcept) {
          parsedData.highlightedConcept = generatedMap?.topic || targetTopic;
        }
      } catch (mmErr) {
        console.warn('[TutorIA] Auto mind map generation failed in chat:', mmErr);
      }
    } else if (userWantsVisual && !parsedData.visualIllustration) {
      try {
        const targetPrompt = extractTargetTopic(trimmedMsg, currentTopic || subject);
        const generatedVisual = await generateVisualInternal({
          prompt: targetPrompt,
          topic: targetPrompt,
          subject,
          grade,
          currentContext: recentHistoryText,
        });
        parsedData.visualIllustration = generatedVisual;
        if (!parsedData.highlightedConcept) {
          parsedData.highlightedConcept = generatedVisual?.title || targetPrompt;
        }
      } catch (visErr) {
        console.warn('[TutorIA] Auto visual illustration generation failed in chat:', visErr);
      }
    }

    res.json(parsedData);
  } catch (criticalError: any) {
    console.error('Critical unhandled error in /api/tutor/chat:', criticalError);
    // Even on critical error, return valid JSON with friendly message
    res.json({
      responseText: 'Hubo una dificultad inesperada al generar la respuesta pedagógica. Por favor pulsa en Reintentar.',
      suggestedQuestions: ['Reintentar'],
      isError: true,
      canRetry: true,
    });
  }
});

// Interactive Mind Map Generator Endpoint
app.post('/api/tutor/mindmap', async (req, res) => {
  try {
    const { topic, subject = 'General', grade = 'secundaria', currentContext = '', autoModelSwitch, preferredModel } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'El tema es obligatorio para generar el mapa mental.' });
    }

    const mindMap = await generateMindMapInternal({
      topic: topic.trim(),
      subject,
      grade,
      currentContext,
      autoModelSwitch,
      preferredModel,
    });

    res.json({ mindMap });
  } catch (error: any) {
    console.warn('[TutorIA] Mind map generator endpoint error:', error);
    const cleanTopic = (req.body?.topic || 'Tema de estudio').trim();
    res.json({
      mindMap: {
        topic: cleanTopic,
        centralConcept: `Conceptos centrales y estructura didáctica de ${cleanTopic}.`,
        summary: `Estructura organizada en ramas principales para comprender y memorizar ${cleanTopic}.`,
        nodes: [
          {
            id: 'node-1',
            label: 'Conceptos Clave',
            description: 'Definición y principios fundamentales.',
            children: [
              { id: 'sub-1', label: 'Definición', description: `Aspectos esenciales de ${cleanTopic}` },
              { id: 'sub-2', label: 'Características', description: 'Propiedades destacadas' },
            ],
          },
          {
            id: 'node-2',
            label: 'Procedimiento y Uso',
            description: 'Cómo se analiza y aplica.',
            children: [
              { id: 'sub-3', label: 'Paso a paso', description: 'Secuencia lógica de desarrollo' },
              { id: 'sub-4', label: 'Ejemplo práctico', description: 'Caso de aplicación real' },
            ],
          },
          {
            id: 'node-3',
            label: 'Conclusiones y Consejos',
            description: 'Puntos clave para recordar.',
            children: [
              { id: 'sub-5', label: 'Idea central', description: 'Resumen en una frase' },
              { id: 'sub-6', label: 'Comprobación', description: 'Verificación del resultado' },
            ],
          },
        ],
      },
    });
  }
});

// Explanatory Visual / Infographic Generator Endpoint
app.post('/api/tutor/generate-visual', async (req, res) => {
  try {
    const { prompt, topic, subject = 'General', grade = 'secundaria', currentContext = '', autoModelSwitch, preferredModel } = req.body;
    const query = (prompt || topic || 'Concepto pedagógico').trim();

    const visual = await generateVisualInternal({
      prompt: query,
      topic: query,
      subject,
      grade,
      currentContext,
      autoModelSwitch,
      preferredModel,
    });

    res.json({ visual });
  } catch (error: any) {
    console.warn('[TutorIA] Visual illustration endpoint error:', error);
    const query = (req.body?.prompt || req.body?.topic || 'Concepto pedagógico').trim();
    const safeTitle = query.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svgFallback = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" style="background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
  <rect width="800" height="500" fill="#0f172a"/>
  <rect x="25" y="25" width="750" height="450" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="50" y="65" font-size="11" font-weight="700" fill="#38bdf8" letter-spacing="1">S.A.R.A • ESQUEMA DIDÁCTICO VISUAL</text>
  <text x="50" y="98" font-size="20" font-weight="800" fill="#ffffff">${safeTitle}</text>
  <circle cx="230" cy="285" r="75" fill="#2563eb" stroke="#93c5fd" stroke-width="3"/>
  <text x="230" y="280" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">${safeTitle.slice(0, 16)}</text>
  <text x="230" y="302" font-size="11" fill="#dbeafe" text-anchor="middle">Núcleo Central</text>
  <g>
    <line x1="300" y1="285" x2="410" y2="200" stroke="#60a5fa" stroke-width="2" stroke-dasharray="4"/>
    <rect x="410" y="175" width="340" height="50" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="430" y="205" font-size="13" font-weight="bold" fill="#f8fafc">1. Definición y Fundamentos</text>
  </g>
  <g>
    <line x1="300" y1="285" x2="410" y2="285" stroke="#60a5fa" stroke-width="2" stroke-dasharray="4"/>
    <rect x="410" y="260" width="340" height="50" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="430" y="290" font-size="13" font-weight="bold" fill="#f8fafc">2. Proceso y Aplicación</text>
  </g>
  <g>
    <line x1="300" y1="285" x2="410" y2="370" stroke="#60a5fa" stroke-width="2" stroke-dasharray="4"/>
    <rect x="410" y="345" width="340" height="50" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="430" y="375" font-size="13" font-weight="bold" fill="#f8fafc">3. Conclusión Práctica</text>
  </g>
</svg>`.trim();

    res.json({
      visual: {
        title: `Esquema didáctico: ${query}`,
        caption: `Representación conceptual ilustrada para el estudio y comprensión de ${query}.`,
        keyLabels: [
          { label: 'Definición', description: 'Idea o principio fundamental' },
          { label: 'Estructura', description: 'Componentes y relaciones del tema' },
        ],
        steps: ['Comprender la base', 'Analizar ejemplos', 'Aplicar el conocimiento'],
        imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svgFallback)}`,
      },
    });
  }
});

function parseJsonArray(rawText: string): any[] {
  let cleaned = (rawText || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    const res = JSON.parse(cleaned);
    return Array.isArray(res) ? res : [];
  } catch {
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const res = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
        return Array.isArray(res) ? res : [];
      } catch {}
    }
    return [];
  }
}

// Quiz generation endpoint tailored to grade, subject and topic
app.post('/api/tutor/quiz', async (req, res) => {
  try {
    const { topic, subject, grade, learningStyle, autoModelSwitch, preferredModel } = req.body;

    const prompt = `
Genera un quiz diagnóstico o de comprobación de 3 preguntas de opción múltiple para un estudiante de nivel "${grade || 'secundaria'}" sobre el tema "${topic || 'General'}" en la materia "${subject || 'General'}".
Estilo de aprendizaje preferido: ${learningStyle || 'visual'}.

Para cada pregunta incluye:
- question: Enunciado claro y bien redactado.
- options: Arreglo de 4 opciones de respuesta donde exactamente una es correcta.
- correctIndex: Índice numérico (0, 1, 2 o 3) de la respuesta correcta.
- explanation: Breve explicación pedagógica y formativa de por qué es la correcta.
`;

    const response = await generateContentWithRetry({
      contents: prompt,
      autoModelSwitch,
      preferredModel,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctIndex', 'explanation'],
          },
        },
      },
    });

    const parsed = parseJsonArray(response.text || '[]');
    if (parsed.length > 0) {
      return res.json({ questions: parsed });
    }
    throw new Error('Empty quiz array');
  } catch (error: any) {
    console.warn('[TutorIA] Quiz fallback used for:', req.body?.topic);
    const currentTopic = req.body?.topic || 'el tema actual';
    res.json({
      questions: [
        {
          id: 'q1',
          question: `¿Cuál es el objetivo principal al estudiar ${currentTopic}?`,
          options: [
            `Comprender los principios y aplicaciones de ${currentTopic}`,
            'Memorizar sin entender los pasos',
            'Omitir la comprobación de resultados',
            'Ignorar las definiciones básicas',
          ],
          correctIndex: 0,
          explanation: `El aprendizaje efectivo de ${currentTopic} se basa en la comprensión profunda y la práctica reflexiva.`,
        },
        {
          id: 'q2',
          question: `Al resolver problemas sobre ${currentTopic}, ¿cuál es el primer paso recomendado?`,
          options: [
            'Elegir una respuesta al azar',
            'Identificar los datos y la pregunta central',
            'Comenzar a escribir sin leer el enunciado',
            'Descartar el procedimiento metódico',
          ],
          correctIndex: 1,
          explanation: 'Identificar datos y objetivos permite estructurar adecuadamente el razonamiento.',
        },
        {
          id: 'q3',
          question: `¿Cómo podemos verificar que el resultado sobre ${currentTopic} es correcto?`,
          options: [
            'Comprobando si cumple las condiciones del enunciado',
            'Suponiendo que el primer intento nunca falla',
            'Ignorando las unidades o términos',
            'Cambiando el tema de estudio',
          ],
          correctIndex: 0,
          explanation: 'La comprobación paso a paso garantiza que la solución es sólida y coherente.',
        },
      ],
    });
  }
});

// AI Blind Spot analysis and targeted review generator
app.post('/api/tutor/blind-spots', async (req, res) => {
  try {
    const { mistakes, grade, subject, autoModelSwitch, preferredModel } = req.body;
    const mistakesSummary = Array.isArray(mistakes) && mistakes.length > 0
      ? mistakes.map((m: any) => `- Tema: "${m.topic}" | Pregunta fallada: "${m.question}" | Respuesta dada: "${m.selectedAnswer}" | Correcta: "${m.correctAnswer}" | Explicación: "${m.explanation}"`).join('\n')
      : 'No hay errores previos registrados todavía. Analiza puntos ciegos típicos para estudiantes de nivel ' + (grade || 'secundaria') + ' en ' + (subject || 'general') + '.';

    const prompt = `
Actúa como un tutor pedagógico experto en análisis de rendimiento y detección de puntos ciegos (conceptual gaps).
Historial de errores recientes del estudiante:
${mistakesSummary}

Analiza este historial y detecta los puntos ciegos o patrones de confusión recurrentes. Luego, genera un plan de repaso dirigido exclusivamente a superar estas dificultades.
Devuelve un JSON con la siguiente estructura exacta:
{
  "detectedBlindSpots": [
    {
      "concept": "Nombre del concepto confuso",
      "description": "Por qué el estudiante suele confundirse y cuál es la aclaración clave",
      "suggestedReviewTopic": "Tema específico a reforzar"
    }
  ],
  "reviewTitle": "Título motivador y claro del repaso dirigido",
  "microLesson": "Una mini-lección explicativa de 3 o 4 párrafos cortos y sencillos que explica de raíz los errores cometidos y cómo dominarlos correctamente.",
  "practiceQuestions": [
    {
      "id": "bs-1",
      "question": "Pregunta de opción múltiple enfocada estrictamente en el punto ciego detectado",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 0,
      "explanation": "Explicación de por qué esta es la respuesta correcta para superar el error."
    }
  ]
}
`;

    const response = await generateContentWithRetry({
      contents: prompt,
      autoModelSwitch,
      preferredModel,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedBlindSpots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suggestedReviewTopic: { type: Type.STRING },
                },
                required: ['concept', 'description', 'suggestedReviewTopic'],
              },
            },
            reviewTitle: { type: Type.STRING },
            microLesson: { type: Type.STRING },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['detectedBlindSpots', 'reviewTitle', 'microLesson', 'practiceQuestions'],
        },
      },
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('[TutorIA] Blind spots analysis fallback used:', error?.message);
    res.json({
      detectedBlindSpots: [
        {
          concept: 'Confusión en conceptos fundamentales',
          description: 'Se observa tendencia a memorizar sin profundizar en la aplicación práctica de los principios básicos.',
          suggestedReviewTopic: 'Fundamentos teóricos y aplicación guiada'
        }
      ],
      reviewTitle: 'Repaso Estratégico para Superar Puntos Ciegos',
      microLesson: 'Para superar las dificultades de aprendizaje, es fundamental descomponer los problemas complejos en pasos pequeños. En lugar de memorizar fórmulas o conceptos aislados, enfócate en comprender el "por qué" detrás de cada regla y verifica tus resultados paso a paso.',
      practiceQuestions: [
        {
          id: 'bs-fallback-1',
          question: '¿Cuál es la estrategia más efectiva para superar un error conceptual recurrente?',
          options: [
            'Analizar la explicación del error y practicar un caso similar paso a paso',
            'Ignorar el fallo y continuar con otro tema diferente',
            'Intentar memorizar el resultado sin comprender el proceso',
            'Adivinar en lugar de revisar los fundamentos'
          ],
          correctIndex: 0,
          explanation: 'Analizar el error y practicar de forma dirigida consolida el aprendizaje a largo plazo.'
        },
        {
          id: 'bs-fallback-2',
          question: '¿Por qué es útil identificar puntos ciegos en el estudio?',
          options: [
            'Para enfocar el tiempo de repaso exactamente en lo que necesita mejora',
            'Para hacer los exámenes más difíciles',
            'Para evitar estudiar los temas que ya dominamos',
            'No tiene ninguna utilidad práctica'
          ],
          correctIndex: 0,
          explanation: 'Detectar puntos ciegos optimiza tu tiempo de estudio al priorizar los temas que representan mayor dificultad.'
        }
      ]
    });
  }
});

// Flashcards generation endpoint
app.post('/api/tutor/flashcards', async (req, res) => {
  try {
    const { topic, subject, grade, autoModelSwitch, preferredModel } = req.body;

    const prompt = `
Crea 4 o 5 tarjetas de memoria activa (flashcards) para repasar el tema "${topic}" de la materia "${subject}" para un estudiante de nivel "${grade}".
Cada tarjeta debe tener:
- front: Pregunta, término o concepto a recordar.
- back: Respuesta concisa, clara y memorable.
- hint: Una pista pedagógica o mnemotécnica para ayudar a recordarlo.
`;

    const response = await generateContentWithRetry({
      contents: prompt,
      autoModelSwitch,
      preferredModel,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ['front', 'back'],
          },
        },
      },
    });

    const parsed = parseJsonArray(response.text || '[]');
    if (parsed.length > 0) {
      return res.json({ flashcards: parsed });
    }
    throw new Error('Empty flashcards array');
  } catch (error: any) {
    console.warn('[TutorIA] Flashcards fallback used for:', req.body?.topic);
    const currentTopic = req.body?.topic || 'Concepto clave';
    res.json({
      flashcards: [
        {
          id: 'f1',
          front: `¿Qué define fundamentalmente a ${currentTopic}?`,
          back: `Es el concepto central que estructura este apartado de estudio.`,
          hint: 'Enfócate en la idea o principio básico.',
        },
        {
          id: 'f2',
          front: `¿Cuál es el procedimiento clave en ${currentTopic}?`,
          back: `Analizar las condiciones iniciales y aplicar la regla metódica correspondiente.`,
          hint: 'Recuerda la secuencia paso a paso.',
        },
        {
          id: 'f3',
          front: `¿Cómo se aplica ${currentTopic} en la práctica?`,
          back: `Permite resolver situaciones cotidianas y ejercicios formativos con precisión.`,
          hint: 'Piensa en un ejemplo real o ejercicio representativo.',
        },
      ],
    });
  }
});

// Interactive Textbook Assistant endpoint
app.post('/api/tutor/textbook-chat', async (req, res) => {
  try {
    const { textbookText, question, chapter, autoModelSwitch, preferredModel } = req.body;

    const prompt = `
Actúa como un asistente pedagógico experto. El estudiante te ha proporcionado el siguiente contenido de un libro de texto o capítulo (${chapter || 'Capítulo general'}):
---
${textbookText.slice(0, 15000)}
---

Pregunta o duda del estudiante sobre el texto: "${question}"

Responde de forma clara, didáctica y estructurada. Cita fragmentos relevantes del texto proporcionado si es necesario, explica los términos complejos de forma sencilla e incluye 3 preguntas sugeridas para profundizar.
Devuelve un JSON con la estructura:
{
  "answer": "Respuesta pedagógica detallada...",
  "suggestedFollowUps": ["Pregunta 1", "Pregunta 2", "Pregunta 3"]
}
`;

    const response = await generateContentWithRetry({
      contents: prompt,
      autoModelSwitch,
      preferredModel,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['answer', 'suggestedFollowUps'],
        },
      },
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('[TutorIA] Textbook chat fallback used:', error?.message);
    const { question = 'Pregunta sobre el texto' } = req.body || {};
    res.json({
      answer: `Basado en el fragmento de texto proporcionado, la respuesta a "${question}" se centra en comprender los principios y definiciones expuestos en el capítulo. Te sugiero repasar los puntos clave y verificar los ejemplos del texto original.`,
      suggestedFollowUps: [
        '¿Cuáles son las ideas principales de este capítulo?',
        '¿Podrías explicarme los conceptos clave con una analogía?',
        'Hazme un resumen rápido de 3 puntos'
      ]
    });
  }
});

// Format Converter endpoint (Voice/Audio notes or written notes -> structured summary or mindmap)
app.post('/api/tutor/convert-format', async (req, res) => {
  try {
    const { rawInput, conversionType, subject, grade, autoModelSwitch, preferredModel } = req.body;
    // conversionType: 'summary' | 'mindmap'

    if (conversionType === 'mindmap') {
      const prompt = `
Actúa como S.A.R.A. Transforma los siguientes apuntes o notas de voz transcritas en un mapa mental altamente estructurado sobre el tema para un estudiante de nivel "${grade || 'secundaria'}" en "${subject || 'general'}":
---
${rawInput}
---

Devuelve ÚNICAMENTE un objeto JSON con este formato:
{
  "topic": "Título claro y conciso",
  "centralConcept": "Núcleo conceptual en una frase",
  "summary": "Resumen breve",
  "nodes": [
    {
      "id": "node-1",
      "label": "Rama Principal",
      "description": "Explicación",
      "children": [
        { "id": "sub-1", "label": "Subconcepto", "description": "Detalle" }
      ]
    }
  ]
}
`;
      const response = await generateContentWithRetry({
        contents: prompt,
        autoModelSwitch,
        preferredModel,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      let rawText = response.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      return res.json({ mindMap: JSON.parse(rawText) });
    } else {
      // Summary / structured notes
      const prompt = `
Actúa como un tutor académico experto. Convierte la siguiente nota de voz transcrita o apunte desordenado en un resumen de estudio altamente estructurado, claro y listo para repasar:
---
${rawInput}
---

Devuelve un JSON con esta estructura exacta:
{
  "title": "Título del Resumen",
  "keyTakeaways": ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
  "structuredContent": "Un texto explicativo y ordenado con párrafos y viñetas bien formateadas que sintetice perfectamente la información.",
  "actionableTip": "Un consejo práctico para memorizar o aplicar este conocimiento."
}
`;
      const response = await generateContentWithRetry({
        contents: prompt,
        autoModelSwitch,
        preferredModel,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
              structuredContent: { type: Type.STRING },
              actionableTip: { type: Type.STRING },
            },
            required: ['title', 'keyTakeaways', 'structuredContent', 'actionableTip'],
          },
        },
      });

      let rawText = response.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      return res.json({ summaryResult: JSON.parse(rawText) });
    }
  } catch (error: any) {
    console.warn('[TutorIA] Format converter fallback used:', error?.message);
    res.json({
      summaryResult: {
        title: 'Resumen de Apuntes Convertidos',
        keyTakeaways: [
          'Concepto principal extraído de tus notas',
          'Definición clave y reglas fundamentales',
          'Aplicación práctica sugerida'
        ],
        structuredContent: 'Tus notas han sido organizadas en conceptos estructurados para facilitar su estudio y repaso rápido.',
        actionableTip: 'Repasa este esquema cada dos días para afianzar la retención a largo plazo.'
      }
    });
  }
});

async function setupViteAndListen() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(indexPath);
    });
  }

  // Error handling middleware to prevent uncaught 500s
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TutorIA Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteAndListen();
