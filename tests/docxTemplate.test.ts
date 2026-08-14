import { describe, expect, it } from 'vitest';
import { detectTemplateFields, escapeHtml, fillTemplateFields } from '../src/lib/docxTemplate';

describe('docxTemplate', () => {
  it('detects template fields', () => {
    const html = '<p>Sayın {{adSoyad}}, {{kurum}} belgesi</p><p>{{kurum}} tekrar</p>';
    expect(detectTemplateFields(html)).toEqual(['adSoyad', 'kurum']);
  });

  it('supports spaced braces and accented names', () => {
    expect(detectTemplateFields('{{ ad  }} ve {{müşteri}}')).toEqual(['ad', 'müşteri']);
  });

  it('returns empty for no fields', () => {
    expect(detectTemplateFields('<p>Normal metin</p>')).toEqual([]);
  });

  it('fills fields and escapes HTML in values', () => {
    const html = '<p>Merhaba {{isim}}</p>';
    const out = fillTemplateFields(html, { isim: 'A&B <test>' });
    expect(out).toBe('<p>Merhaba A&amp;B &lt;test&gt;</p>');
  });

  it('replaces missing values with empty string', () => {
    const out = fillTemplateFields('<p>{{var}}</p><p>{{yok}}</p>', { var: 'x' });
    expect(out).toBe('<p>x</p><p></p>');
  });

  it('escapeHtml covers basic entities', () => {
    expect(escapeHtml(`<a href="x">'`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;');
  });
});
