/**
 * Intent detection utility for S.A.R.A
 * Recognizes when a student naturally asks for a Mind Map (mapa mental / conceptual)
 * or a Visual Illustration / Explanatory Diagram (foto explicativa / esquema didáctico)
 * directly in chat without having to click dedicated toolbar buttons.
 */

export function isMindMapRequest(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Direct keyword matching (normalized without accents)
  const mindMapKeywords = [
    'mapa mental',
    'mapas mentales',
    'mapa conceptual',
    'mapas conceptuales',
    'red conceptual',
    'redes conceptuales',
    'arbol conceptual',
    'arbol de conceptos',
    'mindmap',
    'mind map',
    'organizador visual',
    'esquema de ramas',
    'diagrama de ramas',
  ];

  if (mindMapKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // Combined action verb + generic 'mapa'
  const actionRegex = /\b(crea|crear|haz|hazme|genera|generar|dibuja|dibujar|muestrame|dame|quiero|necesito|elabora|elaborar|ver|construye|construir)\b.*\b(mapa)\b/i;
  return actionRegex.test(lower);
}

export function isVisualIllustrationRequest(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Exclude mind maps so they take priority if mentioned
  if (isMindMapRequest(text)) {
    return false;
  }

  // Specific visual illustration / photo explicativa phrases
  const visualPhrases = [
    'foto explicativa',
    'fotos explicativas',
    'imagen explicativa',
    'imagenes explicativas',
    'ilustracion explicativa',
    'ilustraciones explicativas',
    'esquema explicativo',
    'esquemas explicativos',
    'diagrama explicativo',
    'diagramas explicativos',
    'dibujo explicativo',
    'dibujos explicativos',
    'foto didactica',
    'fotos didacticas',
    'imagen didactica',
    'imagenes didacticas',
    'ilustracion didactica',
    'esquema visual',
    'esquemas visuales',
    'esquema grafico',
    'esquemas graficos',
    'infografia',
    'infografias',
    'infografia didactica',
    'infografia explicativa',
    'ficha explicativa',
  ];

  if (visualPhrases.some((phrase) => lower.includes(phrase))) {
    return true;
  }

  // Pattern: (crea|haz|genera|dibuja|ilustra|muestrame|quiero) + (una/la)? + (foto|imagen|ilustracion|dibujo|esquema|diagrama) + (de/del/sobre)?
  const actionVisualPattern = /\b(crea|crear|haz|hazme|genera|generar|dibuja|dibujar|ilustra|ilustrar|muestrame|ensename|dame|quiero|necesito|elabora|elaborar)\b.*\b(foto|imagen|ilustracion|dibujo|infografia|diagrama|esquema)\b/i;
  
  if (actionVisualPattern.test(lower)) {
    return true;
  }

  return false;
}

export function extractTargetTopic(text: string, defaultTopic: string = 'Tema de estudio'): string {
  if (!text || typeof text !== 'string') return defaultTopic;

  let cleaned = text
    .replace(/^(?:por favor|hola|tutor|tutora|sara|s\.a\.r\.a\.?)[,\s]*/gi, '')
    .trim();

  // Strip request verbs & intent phrases
  cleaned = cleaned.replace(
    /(?:puedes\s+)?(?:crear?|haz(?:me)?|genera?r?|dibuja?r?|ilustra?r?|mu[eé]strame|ens[eé][ñn]ame|dame|quiero|necesito|elabora?r?|construir?)\s+(?:un[ao]?|el|la|los|las)?\s*(?:mapa\s+mental(?:es)?|mapa\s+conceptual(?:es)?|red\s+conceptual|mindmap|mind\s+map|foto\s+explicativa(?:s)?|imagen\s+explicativa(?:s)?|ilustraci[oó]n\s+explicativa(?:s)?|esquema\s+explicativo(?:s)?|esquema\s+visual(?:es)?|diagrama\s+explicativo(?:s)?|infograf[ií]a(?:s)?|dibujo\s+explicativo(?:s)?|foto\s+did[aá]ctica(?:s)?|imagen\s+did[aá]ctica(?:s)?|esquema\s+gr[aá]fico(?:s)?|ficha\s+explicativa|foto|imagen|ilustraci[oó]n|diagrama|esquema|dibujo|mapa)(?:\s+(?:interactiv[oa]|did[aá]ctic[oa]|visual|explicativ[oa]))?/gi,
    ''
  );

  // Strip leading relational prepositions ("sobre el/la...", "de las...", "acerca de...")
  cleaned = cleaned
    .replace(/^\s*(?:sobre|acerca de|de|del|de la|de los|de las|para|en relación a|en relacion a|respecto a)\s*[:\s]*/i, '')
    .replace(/[¿?¡!.,;:"]/g, '')
    .trim();

  // If the extracted text has substance and isn't just a generic placeholder word
  if (cleaned.length >= 2 && !/^(eso|esto|tema|el tema|un tema|algún tema|algun tema)$/i.test(cleaned)) {
    return cleaned;
  }

  return defaultTopic;
}
