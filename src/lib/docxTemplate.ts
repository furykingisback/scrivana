export interface TemplateField {
  name: string;
  value: string;
}

const FIELD_RE = /{{\s*([A-Za-z0-9_.\u00C0-\u024F-]+)\s*}}/g;

export function detectTemplateFields(html: string): string[] {
  const fields = new Set<string>();
  const re = new RegExp(FIELD_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    fields.add(m[1]);
  }
  return Array.from(fields);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fillTemplateFields(html: string, values: Record<string, string>): string {
  return html.replace(FIELD_RE, (_all, name: string) => {
    const value = values[name];
    if (value === undefined) return '';
    return escapeHtml(value);
  });
}
