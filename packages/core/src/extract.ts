export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(text: string, max = 220): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

const PAIN_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b(can't|cannot|unable to|won't)\b/i, label: 'blocking' },
  { re: /\b(hard to|difficult to|struggle|pain point|annoying)\b/i, label: 'difficulty' },
  { re: /\b(need|wish|would like|looking for)\b/i, label: 'need' },
  { re: /\b(bug|broken|doesn't work|not working)\b/i, label: 'bug' },
  { re: /\b(expensive|costly|too much)\b/i, label: 'cost' },
];

export function detectPainLabels(text: string): string[] {
  const labels: string[] = [];
  for (const p of PAIN_PATTERNS) {
    if (p.re.test(text)) labels.push(p.label);
  }
  return labels;
}
