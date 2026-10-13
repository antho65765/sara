/**
 * Text sanitizer to ensure responses from the AI are clean, concise,
 * devoid of raw JSON leakage, unneeded code blocks, and repetitive phrases.
 */

export function cleanTutorResponseText(rawText: string, isProgrammingSubject: boolean = false): string {
  if (!rawText || typeof rawText !== 'string') {
    return 'Aquí tienes la explicación sobre el tema solicitado.';
  }

  let text = rawText.trim();

  // 1. Detect and strip wrapping markdown code blocks (e.g. ```json ... ``` or ```markdown ... ```)
  const wrappedCodeBlock = text.match(/^```(?:json|markdown|text|plain)?\s*([\s\S]*?)\s*```$/i);
  if (wrappedCodeBlock && wrappedCodeBlock[1]) {
    text = wrappedCodeBlock[1].trim();
  }

  // 2. Check if the string is raw JSON or leaked JSON structure
  if (text.startsWith('{') && (text.includes('"responseText"') || text.includes('responseText'))) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.responseText && typeof parsed.responseText === 'string') {
        text = parsed.responseText;
      }
    } catch {
      // Regex extraction fallback
      const match = text.match(/"responseText"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      if (match && match[1]) {
        try {
          text = JSON.parse(`"${match[1]}"`);
        } catch {
          text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      } else {
        // Strip out common JSON leftovers
        text = text
          .replace(/^\s*\{\s*"responseText"\s*:\s*"?/i, '')
          .replace(/"\s*,\s*"suggestedQuestions"[\s\S]*$/i, '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/^\s*\{|\}\s*$/g, '')
          .trim();
      }
    }
  }

  // 3. Strip any stray JSON syntax at boundaries
  text = text
    .replace(/^\{[\s\S]*?"responseText"\s*:\s*"/i, '')
    .replace(/"\s*,\s*"suggestedQuestions"[\s\S]*$/i, '')
    .trim();

  // 4. If not programming, remove accidental code fences (```, ```text, ```markdown)
  if (!isProgrammingSubject) {
    text = text
      .replace(/```(?:markdown|text|plain|json)?\s*([\s\S]*?)\s*```/g, '$1')
      .replace(/```/g, '');
  }

  // 5. Remove repetitive greetings and presentation loops
  text = text
    .replace(/^(?:¡?Hola!?\s*)?(?:Soy\s+S\.A\.R\.A\.?|Como\s+S\.A\.R\.A\.?)[^.\n]*[.\n]+\s*/i, '')
    .replace(/^(?:¡?Hola!?[^.\n]*,\s*soy\s+tu\s+tutora[^.\n]*[.\n]+)/i, '')
    .trim();

  return text || 'Aquí tienes la explicación sobre el tema solicitado.';
}

/**
 * Sanitizes and normalizes topic titles in memory.
 * Guarantees titles are clean, natural, and COMPLETE — never truncated or cut in half.
 */
export function formatTopicTitle(rawTitle: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return 'Tema de Estudio';
  }

  let title = rawTitle.trim();

  // 1. Remove surrounding quotes, backticks, asterisks, brackets
  title = title.replace(/^["'«“`\[\(\*]+|["'»”`\]\)\*]+$/g, '').trim();

  // 2. Remove common generic introductory prefixes, but preserve the whole topic
  title = title
    .replace(/^(?:el\s+tema\s+(?:de\s+hoy\s+)?(?:es|tratado|aprendido)\s*:?|tema\s*:?|aprendimos\s+sobre\s*:?|estudiamos\s*:?|estudio\s+de\s*:?|explicación\s+de\s*:?|explicación\s+sobre\s*:?|introducción\s+a\s*:?|repaso\s+de\s*:?|apuntes\s+sobre\s*:?|sobre\s*:?|lección\s+de\s*:?|concepto\s*:?)\s*/i, '')
    .trim();

  // 3. Remove subject prefix if it precedes a colon or dash (e.g. "Ciencias: Fotosíntesis" -> "Fotosíntesis")
  title = title.replace(/^(?:ciencias(?:\s+naturales)?|matemáticas|lengua(?:\s+y\s+literatura)?|historia|física|química|biología|inglés|programación)\s*[:\-–—|]\s*/i, '').trim();

  // 4. Strip trailing ellipses and cut-off indicators ("…", "...", ". . .")
  title = title.replace(/(?:\s*\.{2,}|\s*…)+$/g, '').trim();

  // 5. Clean trailing punctuation
  title = title.replace(/[,;:\-–—\.\s]+$/g, '').trim();

  // 6. Fix any accidental markdown bold or formatting markers inside
  title = title.replace(/\*\*/g, '').replace(/__/g, '');

  // 7. Safety check: only if a title is excessively long (over 120 chars) and contains a sentence delimiter, take the first full complete clause
  if (title.length > 120) {
    const clauseMatch = title.match(/^([^.?!;\n]+)/);
    if (clauseMatch && clauseMatch[1].length >= 10) {
      title = clauseMatch[1].trim();
    } else {
      const lastSpace = title.lastIndexOf(' ', 100);
      if (lastSpace > 20) {
        title = title.substring(0, lastSpace).trim();
      }
    }
    title = title.replace(/[,;:\-–—\.\s]+$/g, '').trim();
  }

  // 8. Capitalize first letter properly
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title || 'Tema de Estudio';
}
