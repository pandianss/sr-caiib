/** Plain-text previews of the inline Markdown supported by the app. Full content stays unchanged. */
export function previewText(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/(^|[\s(])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?=$|[\s).,;:!?])/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\s+/g, ' ').trim();
}
