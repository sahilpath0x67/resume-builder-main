function tryParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function stripMarkdownFence(value: string): string {
  let text = value.trim().replace(/^\uFEFF/, '');

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();

  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return text;
}

function extractBalancedJson(value: string, open: '{' | '[', close: '}' | ']'): string | null {
  const start = value.indexOf(open);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i += 1) {
    const char = value[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === open) depth += 1;
    if (char === close) depth -= 1;

    if (depth === 0) return value.slice(start, i + 1);
  }

  return null;
}

export function parseAIJson<T>(raw: string): T {
  const text = stripMarkdownFence(raw);
  const direct = tryParse<T>(text);
  if (direct !== null) return direct;

  const fencedBlock = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  if (fencedBlock) {
    const fencedParsed = tryParse<T>(fencedBlock);
    if (fencedParsed !== null) return fencedParsed;
  }

  for (const [open, close] of [['{', '}'], ['[', ']']] as const) {
    const extracted = extractBalancedJson(text, open, close);
    if (!extracted) continue;

    const parsed = tryParse<T>(extracted);
    if (parsed !== null) return parsed;
  }

  throw new SyntaxError('AI returned text that did not contain valid JSON.');
}
